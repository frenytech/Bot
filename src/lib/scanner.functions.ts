import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Verifies the caller is the super-admin, then returns the privileged client (job/question tables are server-write only). */
async function assertAdmin(supabase: any): Promise<any> {
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error || !data) throw new Error("Not allowed");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const startInput = z.object({ materialId: z.string().uuid(), pagesTotal: z.number().int().min(0).max(5000), hasText: z.boolean() });

/** Creates a scan job for a material and marks it as processing. */
export const startScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => startInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.supabase);
    await sb.from("course_materials")
      .update({ status: "processing", page_count: data.pagesTotal, has_selectable_text: data.hasText })
      .eq("id", data.materialId);
    const { data: job, error } = await sb.from("pdf_processing_jobs")
      .insert({ material_id: data.materialId, status: "running", pages_total: data.pagesTotal, started_at: new Date().toISOString() })
      .select("id").single();
    if (error) throw new Error(error.message);
    return { jobId: job.id as string };
  });

const pagesInput = z.object({
  jobId: z.string().uuid(),
  materialId: z.string().uuid(),
  pages: z.array(z.object({ page: z.number().int().min(1), text: z.string().max(20000) })).min(1).max(6),
});

type AiQuestion = {
  number?: number | null; page?: number; question: string;
  options?: Record<string, string>; answer?: string | null; topic?: string | null;
  has_diagram?: boolean; uncertain?: boolean; year?: number | null;
};

const PROMPT = `You extract exam questions from university past-question PDF text.
Clean OCR noise, fix broken spacing, drop repeated headers/footers and page numbers.
Return ONLY JSON: {"questions":[{"number":int|null,"page":int,"question":string,"options":{"A":string,...},"answer":"A"|null,"topic":string|null,"year":int|null,"has_diagram":bool,"uncertain":bool}]}.
Only include an answer if it is printed in the text. Set uncertain=true if the text is garbled or options seem incomplete. Theory questions have empty options. If there are no questions, return {"questions":[]}.`;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 300);

/** Sends a batch of extracted page text to DeepSeek and stores the questions for review. */
export const scanPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => pagesInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.supabase);
    const key = process.env["GROQ_API_KEY"];
    if (!key) throw new Error("AI key missing");

    const { data: job } = await sb.from("pdf_processing_jobs").select("*").eq("id", data.jobId).single();
    const { data: mat } = await sb.from("course_materials").select("course_id").eq("id", data.materialId).single();

    const body = data.pages.map((p) => `=== PAGE ${p.page} ===\n${p.text}`).join("\n\n");
    let questions: AiQuestion[] = [];
    let ocrErrors = 0;
    const emptyPages = data.pages.filter((p) => p.text.trim().length < 20).length;
    if (body.replace(/=== PAGE \d+ ===/g, "").trim().length > 20) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          response_format: { type: "json_object" },
          temperature: 0,
          messages: [{ role: "system", content: PROMPT }, { role: "user", content: body }],
        }),
      });
      if (!res.ok) {
        ocrErrors = data.pages.length;
      } else {
        const j = await res.json();
        try { questions = JSON.parse(j.choices?.[0]?.message?.content ?? "{}").questions ?? []; }
        catch { ocrErrors = data.pages.length; }
      }
    }

    const { data: existing } = await sb.from("extracted_questions").select("question_text").eq("material_id", data.materialId);
    const seen = new Set<string>((existing ?? []).map((r: any) => norm(r.question_text)));
    let dupes = 0, opts = 0;
    const rows = [];
    for (const q of questions) {
      if (!q?.question || q.question.trim().length < 5) continue;
      const k = norm(q.question);
      if (seen.has(k)) { dupes++; continue; }
      seen.add(k);
      const options = q.options && typeof q.options === "object" ? q.options : {};
      opts += Object.keys(options).length;
      const flags: string[] = [];
      if (q.uncertain) flags.push("uncertain");
      if (q.has_diagram) flags.push("diagram");
      if (!q.answer && Object.keys(options).length) flags.push("no_answer");
      rows.push({
        material_id: data.materialId, course_id: mat?.course_id ?? null, job_id: data.jobId,
        question_text: q.question.slice(0, 5000), options, correct_option: q.answer ?? null,
        page_number: q.page ?? data.pages[0]?.page ?? null, question_number: q.number ?? null,
        topic: q.topic?.slice(0, 200) ?? null, exam_year: q.year ?? null, flags, status: "pending_review",
      });
    }
    if (rows.length) {
      const { error } = await sb.from("extracted_questions").insert(rows);
      if (error) throw new Error(error.message);
    }

    const scanned = (job?.pages_scanned ?? 0) + data.pages.length;
    const done = scanned >= (job?.pages_total ?? 0);
    await sb.from("pdf_processing_jobs").update({
      pages_scanned: scanned,
      progress_percent: job?.pages_total ? Math.min(100, Math.round((scanned / job.pages_total) * 100)) : 100,
      questions_detected: (job?.questions_detected ?? 0) + rows.length,
      awaiting_review: (job?.awaiting_review ?? 0) + rows.length,
      options_extracted: (job?.options_extracted ?? 0) + opts,
      duplicates_detected: (job?.duplicates_detected ?? 0) + dupes,
      ocr_errors: (job?.ocr_errors ?? 0) + ocrErrors + emptyPages,
      status: done ? "completed" : "running",
      finished_at: done ? new Date().toISOString() : null,
    }).eq("id", data.jobId);
    if (done) await sb.from("course_materials").update({ status: "processed" }).eq("id", data.materialId);
    return { added: rows.length, duplicates: dupes, scanned, done };
  });
