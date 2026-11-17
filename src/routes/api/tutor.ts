import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { getEntitlements } from '@/lib/membership';
import { tutorInput, tutorInstructions } from '@/lib/tutor/policy';
import { currentPlan, pdfContext, reserve } from '@/lib/tutor/context';

export const Route = createFileRoute('/api/tutor')({ server: { handlers: {
  POST: async ({ request }) => {
    let cleanup: (() => Promise<void>) | undefined;
    try {
      const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
      if (!token) return new Response('Please sign in again.', { status: 401 });
      const url = process.env['SUPABASE_URL'];
      const publishable = process.env['SUPABASE_PUBLISHABLE_KEY'];
      if (!url || !publishable) return new Response('The tutor is unavailable. Please try again later.', { status: 503 });
      const sb = createClient<Database>(url, publishable, {
        auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
        global: { fetch: (input, init) => { const headers = new Headers(init?.headers); headers.set('apikey', publishable); headers.set('Authorization', `Bearer ${token}`); return fetch(input, { ...init, headers }); } },
      });
      const { data: auth } = await sb.auth.getUser(token);
      const userId = auth.user?.id;
      if (!userId) return new Response('Please sign in again.', { status: 401 });
      const parsed = tutorInput.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return new Response('Invalid tutor request.', { status: 400 });
      const { threadId, requestId, mode, materialId, page, regenerateId } = parsed.data;
      const { data: thread, error: threadError } = await sb.from('tutor_threads').select('id,title,course_id').eq('id', threadId).eq('user_id', userId).maybeSingle();
      if (threadError) throw new Error('Could not load this chat.');
      if (!thread) return new Response('Chat not found.', { status: 404 });
      const plan = await currentPlan(sb, userId);
      const limits = getEntitlements(plan);
      const key = process.env['GROQ_API_KEY'];
      if (!key) return new Response('The tutor is not configured yet. Please tell the administrator.', { status: 503 });
      const { supabaseAdmin: admin } = await import('@/integrations/supabase/client.server');
      const reservation = await reserve(admin, userId, requestId, 'tutor', limits.aiMessagesPerDay);
      if (reservation === 'duplicate') return new Response('This request was already sent. Please wait for its reply.', { status: 409 });
      if (reservation === 'limit') return Response.json({ limit: limits.aiMessagesPerDay }, { status: 429 });
      cleanup = async () => { await admin.from('tutor_requests').delete().eq('id', requestId).eq('user_id', userId); };
      const { data: past, error: pastError } = await sb.from('tutor_messages').select('id,role,content').eq('thread_id', threadId).order('created_at', { ascending: false }).limit(80);
      if (pastError) throw new Error('Could not load conversation history.');
      const history = [...(past ?? [])].reverse();
      let message = parsed.data.message;
      if (regenerateId) {
        const last = history.at(-1), previous = history.at(-2);
        if (last?.id !== regenerateId || last.role !== 'assistant' || previous?.role !== 'user') {
          await cleanup(); return new Response('Only the latest reply can be regenerated.', { status: 400 });
        }
        history.pop(); history.pop(); message = previous.content;
      }
      const { data: profile } = await sb.from('profiles').select('academic_level_id').eq('id', userId).maybeSingle();
      const level = profile?.academic_level_id ? (await sb.from('academic_levels').select('name').eq('id', profile.academic_level_id).maybeSingle()).data?.name ?? '' : '';
      const course = thread.course_id ? (await sb.from('courses').select('code,title').eq('id', thread.course_id).maybeSingle()).data : null;
      const recent = history.slice(-6).map(m => m.content).join('\n');
      const grounding = await pdfContext(sb, admin, userId, plan, thread.course_id, `${recent}\n${message}`, materialId, page);
      // Bounded historical context, always keeping recent turns and the original question.
      let budget = 48000;
      const contextMessages: { role: string; content: string }[] = [];
      for (const h of [...history].reverse()) {
        if (!['user', 'assistant'].includes(h.role)) continue;
        const content = h.content.slice(0, Math.min(16000, budget));
        if (!content) break;
        contextMessages.unshift({ role: h.role, content }); budget -= content.length;
      }
      if (history.length && contextMessages.length < history.length) {
        const first = history[0];
        if (first) contextMessages.unshift({ role: 'user', content: `Earlier original question: ${first.content.slice(0, 2000)}` });
      }
      const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(120000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'openai/gpt-oss-120b', stream: true, temperature: 0.5,
          messages: [{ role: 'system', content: tutorInstructions(mode, level, course ? `${course.code} — ${course.title}` : '') + (grounding.text ? `\n\nAUTHORIZED PDF EXCERPTS:\n${grounding.text}` : '') }, ...contextMessages, { role: 'user', content: message }],
        }),
      });
      const upstreamBody = upstream.body;
      if (!upstream.ok || !upstreamBody) {
        console.error('Groq tutor request failed', upstream.status);
        await cleanup();
        return new Response(upstream.status === 429 ? 'The tutor is busy. Please try again shortly.' : 'The tutor is unavailable right now. Please try again.', { status: 503 });
      }
      let savedUserId: string | undefined;
      if (!regenerateId) {
        const { data: saved, error } = await admin.from('tutor_messages').insert({ thread_id: threadId, user_id: userId, role: 'user', content: message }).select('id').single();
        if (error) { await upstreamBody.cancel(); throw new Error('Could not save your question.'); }
        savedUserId = saved.id;
      }
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const emit = (event: string, data: unknown) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          const reader = upstreamBody.getReader();
          let full = '', buf = '', doneFrame = false;
          let usage = { prompt_tokens: 0, completion_tokens: 0 };
          const decoder = new TextDecoder();
          try {
            emit('start', { userId: savedUserId });
            function parse(line: string) {
              if (!line.trim().startsWith('data:')) return;
              const payload = line.trim().slice(5).trim();
              if (payload === '[DONE]') { doneFrame = true; return; }
              const j = JSON.parse(payload);
              if (j.error) throw new Error('AI stream failed');
              const delta = j.choices?.[0]?.delta?.content;
              if (j.x_groq?.usage) usage = j.x_groq.usage; else if (j.usage) usage = j.usage;
              if (typeof delta === 'string' && delta) { full += delta; emit('delta', { text: delta }); }
              if (full.length > 100000) throw new Error('Response exceeded safe length');
            }
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split('\n'); buf = lines.pop() ?? '';
              for (const line of lines) parse(line);
            }
            buf += decoder.decode(); if (buf.trim()) parse(buf);
            if (!doneFrame || !full.trim()) throw new Error('Incomplete AI reply');
            const save = regenerateId
              ? admin.from('tutor_messages').update({ content: full }).eq('id', regenerateId).eq('user_id', userId).select('id').single()
              : admin.from('tutor_messages').insert({ thread_id: threadId, user_id: userId, role: 'assistant', content: full }).select('id').single();
            const { data: saved, error } = await save;
            if (error) throw new Error('Could not save reply');
            const { error: usageError } = await admin.from('ai_usage').insert({ user_id: userId, feature: 'tutor', model: 'openai/gpt-oss-120b', prompt_tokens: usage.prompt_tokens ?? 0, completion_tokens: usage.completion_tokens ?? 0 });
            if (usageError) throw new Error('Could not record usage');
            await admin.from('tutor_requests').update({ status: 'complete' }).eq('id', requestId);
            await admin.from('tutor_threads').update({ updated_at: new Date().toISOString(), ...(thread.title === 'New chat' ? { title: message.slice(0, 60) } : {}) }).eq('id', threadId);
            emit('done', { messageId: saved.id });
          } catch (error) {
            console.error('Tutor response interrupted', error instanceof Error ? error.message : 'stream error');
            if (savedUserId) await admin.from('tutor_messages').delete().eq('id', savedUserId).eq('user_id', userId);
            await cleanup?.();
            emit('error', { message: 'The reply was interrupted. Please try again; your question has been restored.' });
          } finally { reader.releaseLock(); controller.close(); }
        },
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
    } catch (error) {
      await cleanup?.();
      console.error('Tutor request', error instanceof Error ? error.message : 'unknown error');
      return new Response(error instanceof Error && /material|PDF|page|allowance/.test(error.message) ? error.message : 'The tutor could not reply. Please try again.', { status: 503 });
    }
  },
} } });
