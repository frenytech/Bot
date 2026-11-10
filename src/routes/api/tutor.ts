import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";
import { getEntitlements, type PlanId } from "@/lib/membership";

const Body = z.object({ threadId: z.string().uuid(), message: z.string().trim().min(1).max(4000) });

function watMidnightIso(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
  return new Date(`${d}T00:00:00+01:00`).toISOString();
}

function userClient(token: string) {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        h.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const SYSTEM = `You are StudyAI Tutor, a friendly, patient university tutor for Nigerian students.
Explain step by step, use simple language first and then precise terms, give short worked examples, and check understanding with a quick question at the end when useful.
When you use the course past questions provided, cite them like "(past question, p. 12)". If you are not sure, say so — never invent facts or page numbers.
Format answers in Markdown with headings, lists and code blocks where helpful. Keep answers focused.`;

export const Route = createFileRoute("/api/tutor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const sb = userClient(token);
        const { data: auth } = await sb.auth.getUser(token);
        const userId = auth.user?.id;
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid request", { status: 400 });
        const { threadId, message } = parsed.data;

        // RLS: only the owner can see this thread.
        const { data: thread } = await (sb as any).from("tutor_threads").select("id,title,course_id").eq("id", threadId).maybeSingle();
        if (!thread) return new Response("Chat not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const admin = supabaseAdmin as any;

        // Daily message limit by plan.
        const { data: sub } = await sb.from("subscriptions").select("plan,status,expires_at")
          .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
        const active = sub && sub.status === "active" && (!sub.expires_at || new Date(sub.expires_at) > new Date());
        const plan = getEntitlements(active ? (sub!.plan as PlanId) : "free");
        if (plan.aiMessagesPerDay !== null) {
          const { count } = await admin.from("ai_usage").select("id", { count: "exact", head: true })
            .eq("user_id", userId).eq("feature", "tutor").gte("created_at", watMidnightIso());
          if ((count ?? 0) >= plan.aiMessagesPerDay) {
            return Response.json({ error: "limit", limit: plan.aiMessagesPerDay }, { status: 429 });
          }
        }

        const key = process.env["DEEPSEEK_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 503 });

        const { data: past } = await admin.from("tutor_messages").select("role,content")
          .eq("thread_id", threadId).order("created_at", { ascending: false }).limit(39);
        const history = [...(past ?? []).reverse(), { role: "user", content: message }];

        // Course grounding: published past questions with page references.
        let grounding = "";
        if (thread.course_id) {
          const { data: course } = await sb.from("courses").select("code,title").eq("id", thread.course_id).maybeSingle();
          const words = message.toLowerCase().split(/\W+/).filter((w) => w.length > 4).slice(0, 5);
          let q = admin.from("extracted_questions").select("question_text,page_number,topic").eq("course_id", thread.course_id).eq("status", "published").limit(12);
          if (words.length) q = q.or(words.map((w) => `question_text.ilike.%${w}%`).join(","));
          const { data: qs } = await q;
          if (course) grounding = `Course: ${course.code} — ${course.title}\n`;
          if (qs?.length) grounding += `Relevant past questions:\n${qs.map((x: any) => `- (p. ${x.page_number ?? "?"}) ${String(x.question_text).slice(0, 300)}`).join("\n")}`;
        }

        const upstream = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: "deepseek-chat",
            stream: true,
            stream_options: { include_usage: true },
            temperature: 0.5,
            messages: [
              { role: "system", content: SYSTEM + (grounding ? `\n\n${grounding}` : "") },
              ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
            ],
          }),
        });
        if (!upstream.ok || !upstream.body) {
          console.error("DeepSeek tutor", upstream.status, await upstream.text().catch(() => ""));
          const msg = upstream.status === 401 || upstream.status === 402
            ? "The tutor isn't set up correctly yet. Please tell the administrator."
            : "The tutor is unavailable right now. Please try again.";
          return new Response(msg, { status: 503 });
        }

        // Only save the student's message once the tutor has accepted it, so failures leave no orphan messages.
        const { error: insErr } = await admin.from("tutor_messages").insert({ thread_id: threadId, user_id: userId, role: "user", content: message });
        if (insErr) console.error("tutor save user msg", insErr);

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let full = "";
        let usage = { prompt_tokens: 0, completion_tokens: 0 };
        const isFirst = (history?.length ?? 0) <= 1;

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const reader = upstream.body!.getReader();
            let buf = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() ?? "";
                for (const line of lines) {
                  const t = line.trim();
                  if (!t.startsWith("data:")) continue;
                  const payload = t.slice(5).trim();
                  if (payload === "[DONE]") continue;
                  try {
                    const j = JSON.parse(payload);
                    const delta = j.choices?.[0]?.delta?.content ?? "";
                    if (j.usage) usage = j.usage;
                    if (delta) { full += delta; controller.enqueue(encoder.encode(delta)); }
                  } catch { /* partial frame */ }
                }
              }
            } catch (e) {
              console.error("tutor stream", e);
            } finally {
              if (full) {
                const { error } = await admin.from("tutor_messages").insert({ thread_id: threadId, user_id: userId, role: "assistant", content: full });
                if (error) console.error("tutor save reply", error);
                await admin.from("ai_usage").insert({ user_id: userId, feature: "tutor", model: "deepseek-chat", prompt_tokens: usage.prompt_tokens ?? 0, completion_tokens: usage.completion_tokens ?? 0 });
                await admin.from("tutor_threads").update(isFirst && thread.title === "New chat" ? { title: message.slice(0, 60) } : { updated_at: new Date().toISOString() }).eq("id", threadId);
              }
              controller.close();
            }
          },
        });
        return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
      },
    },
  },
});
