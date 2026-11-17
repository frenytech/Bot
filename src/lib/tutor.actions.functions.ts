import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
export const saveTutorResponse = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ messageId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: message } = await context.supabase.from('tutor_messages').select('content,thread_id').eq('id', data.messageId).eq('user_id', context.userId).eq('role', 'assistant').maybeSingle();
    if (!message) throw new Error('Response not found.');
    const { data: thread } = await context.supabase.from('tutor_threads').select('course_id,title').eq('id', message.thread_id).maybeSingle();
    if (!thread) throw new Error('Chat not found.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const topic = `Tutor: ${thread.title}`.slice(0, 200);
    const { data: existing } = await context.supabase.from('study_notes').select('id').eq('user_id', context.userId).eq('topic', topic).eq('content', message.content).limit(1);
    if (existing?.length) return { saved: true };
    const { error } = await supabaseAdmin.from('study_notes').insert({ user_id: context.userId, course_id: thread.course_id, topic, content: message.content });
    if (error) throw new Error('Could not save the response.');
    return { saved: true };
  });
