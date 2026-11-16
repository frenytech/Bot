import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Flashcards built from published questions of a course the student can see. */
export const getFlashcards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ courseId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: course } = await context.supabase.from("courses").select("id").eq("id", data.courseId).maybeSingle();
    if (!course) throw new Error("Course not available");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("extracted_questions")
      .select("id,question_text,options,correct_option,page_number,topic")
      .eq("course_id", data.courseId).eq("status", "published").not("correct_option", "is", null).limit(200);
    const { data: reviews } = await (context.supabase as any).from("flashcard_reviews").select("question_id,understood").eq("user_id", context.userId);
    const known = new Map<string, boolean>((reviews ?? []).map((r: any) => [r.question_id, r.understood]));
    return (rows ?? []).map((q) => {
      const opts = (q.options ?? {}) as Record<string, string>;
      const key = (q.correct_option ?? "").toUpperCase();
      return { id: q.id, front: q.question_text, back: opts[key] ? `${key}. ${opts[key]}` : key, page: q.page_number, topic: q.topic, understood: known.get(q.id) ?? false };
    });
  });

/** Generates AI study notes for a topic using DeepSeek and saves them for the student. */
export const generateNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ courseId: z.string().uuid(), topic: z.string().trim().min(2).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: course } = await context.supabase.from("courses").select("id,code,title").eq("id", data.courseId).maybeSingle();
    if (!course) throw new Error("Course not available");
    const key = process.env["GROQ_API_KEY"];
    if (!key) throw new Error("AI is not configured");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: qs } = await supabaseAdmin.from("extracted_questions").select("question_text,page_number")
      .eq("course_id", data.courseId).eq("status", "published").limit(30);
    const context_ = (qs ?? []).map((q) => `- (p.${q.page_number ?? "?"}) ${q.question_text.slice(0, 300)}`).join("\n");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b", temperature: 0.4,
        messages: [
          { role: "system", content: "You are a university tutor. Write clear, well-structured study notes in Markdown: short intro, key concepts with headings, worked examples, common exam traps, and a 5-point summary. Be accurate and concise." },
          { role: "user", content: `Course: ${course.code} — ${course.title}\nTopic: ${data.topic}\n\nPast exam questions from this course (for focus):\n${context_ || "none"}` },
        ],
      }),
    });
    if (!res.ok) { console.error("Groq notes", res.status, await res.text()); throw new Error("AI service unavailable, try again"); }
    const j = await res.json();
    const content = String(j.choices?.[0]?.message?.content ?? "").slice(0, 50000);
    if (!content) throw new Error("No notes generated");
    const { data: note, error } = await (supabaseAdmin as any).from("study_notes")
      .insert({ user_id: context.userId, course_id: course.id, topic: data.topic, content }).select("id,topic,content,created_at").single();
    if (error) throw new Error("Could not save notes");
    await supabaseAdmin.from("ai_usage").insert({ user_id: context.userId, feature: "study_notes", model: "openai/gpt-oss-120b", prompt_tokens: j.usage?.prompt_tokens ?? 0, completion_tokens: j.usage?.completion_tokens ?? 0 });
    return note as { id: string; topic: string; content: string; created_at: string };
  });
