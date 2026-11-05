import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Returns a random set of published questions for a course the student can see. Answers are withheld. */
export const startTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ courseId: z.string().uuid(), count: z.number().int().min(5).max(100) }).parse(d))
  .handler(async ({ data, context }) => {
    // RLS on courses decides whether this student may see the course.
    const { data: course } = await context.supabase.from("courses").select("id,code,title").eq("id", data.courseId).maybeSingle();
    if (!course) throw new Error("Course not available");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.from("extracted_questions")
      .select("id,question_text,options,page_number")
      .eq("course_id", data.courseId).eq("status", "published").not("correct_option", "is", null).limit(500);
    if (error) throw new Error("Could not load questions");
    const pick = [...(rows ?? [])].sort(() => Math.random() - 0.5).slice(0, data.count);
    return {
      course,
      questions: pick.map((q) => ({ id: q.id, text: q.question_text, options: (q.options ?? {}) as Record<string, string>, page: q.page_number })),
    };
  });

/** Grades answers server-side and returns the correct options. */
export const gradeTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ answers: z.record(z.string().uuid(), z.string().max(2)) }).parse(d))
  .handler(async ({ data }) => {
    const ids = Object.keys(data.answers);
    if (!ids.length || ids.length > 100) throw new Error("Invalid test");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("extracted_questions").select("id,correct_option").in("id", ids).eq("status", "published");
    const correct: Record<string, string> = {};
    let score = 0;
    for (const r of rows ?? []) {
      correct[r.id] = r.correct_option ?? "";
      if ((data.answers[r.id] ?? "").toUpperCase() === (r.correct_option ?? "").toUpperCase()) score++;
    }
    return { score, total: ids.length, correct };
  });
