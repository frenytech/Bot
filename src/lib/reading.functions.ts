import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getEntitlements, type PlanId } from "@/lib/membership";

/** Daily limits reset at midnight West Africa Time (UTC+1). */
function watDate(): string {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

type Ctx = { supabase: any; userId: string };

async function planFor({ supabase, userId }: Ctx): Promise<PlanId> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan,status,expires_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data || data.status !== "active") return "free";
  if (data.expires_at && new Date(data.expires_at) < new Date()) return "free";
  return data.plan as PlanId;
}

const idInput = z.object({ materialId: z.string().uuid() });

/**
 * Opens a course PDF for the signed-in student. Access is checked against the
 * student's academic profile (RLS), and the daily PDF allowance is enforced
 * here on the server before any file bytes leave storage.
 */
export const openMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: material, error } = await supabase
      .from("course_materials")
      .select("id,file_name,storage_path,page_count,courses(code,title)")
      .eq("id", data.materialId)
      .maybeSingle();
    if (error) throw error;
    if (!material) return { ok: false as const, reason: "not_found" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const plan = getEntitlements(await planFor(context));
    const today = watDate();

    const { data: usage } = await supabaseAdmin
      .from("reading_daily_usage")
      .select("material_id,pages_read")
      .eq("user_id", userId)
      .eq("usage_date", today);
    const mine = usage?.find((u) => u.material_id === material.id);
    if (!mine) {
      if (plan.pdfsPerDay !== null && (usage?.length ?? 0) >= plan.pdfsPerDay) {
        return { ok: false as const, reason: "pdf_limit" as const, limit: plan.pdfsPerDay };
      }
      await supabaseAdmin
        .from("reading_daily_usage")
        .insert({ user_id: userId, usage_date: today, material_id: material.id, pages_read: 0 });
    }

    const { data: progress } = await supabaseAdmin
      .from("reading_progress")
      .select("last_page_read")
      .eq("user_id", userId)
      .eq("material_id", material.id)
      .maybeSingle();

    const file = await supabaseAdmin.storage.from("course-pdfs").download(material.storage_path);
    if (file.error || !file.data) throw new Error("Could not load this PDF.");
    const bytes = new Uint8Array(await file.data.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }

    return {
      ok: true as const,
      fileName: material.file_name,
      course: material.courses as { code: string; title: string } | null,
      pdfBase64: btoa(bin),
      pagesReadToday: mine?.pages_read ?? 0,
      pageLimit: plan.pagesPerPdfPerDay,
      lastPage: progress?.last_page_read ?? 1,
      watermark: context.claims.email ?? userId,
    };
  });

const pageInput = z.object({
  materialId: z.string().uuid(),
  page: z.number().int().min(1).max(10000),
  totalPages: z.number().int().min(1).max(10000),
});

/**
 * Records one newly viewed page. Returns whether the student may view it under
 * today's per-PDF page allowance.
 */
export const recordPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => pageInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const plan = getEntitlements(await planFor(context));
    const today = watDate();

    const { data: usage } = await supabaseAdmin
      .from("reading_daily_usage")
      .select("pages_read")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .eq("material_id", data.materialId)
      .maybeSingle();
    if (!usage) return { allowed: false, pagesReadToday: 0 };

    const used = usage.pages_read;
    if (plan.pagesPerPdfPerDay !== null && used >= plan.pagesPerPdfPerDay) {
      return { allowed: false, pagesReadToday: used };
    }
    await supabaseAdmin
      .from("reading_daily_usage")
      .update({ pages_read: used + 1 })
      .eq("user_id", userId)
      .eq("usage_date", today)
      .eq("material_id", data.materialId);

    const { data: prog } = await supabaseAdmin
      .from("reading_progress")
      .select("pages_read_total,last_page_read")
      .eq("user_id", userId)
      .eq("material_id", data.materialId)
      .maybeSingle();
    await supabaseAdmin.from("reading_progress").upsert(
      {
        user_id: userId,
        material_id: data.materialId,
        last_page_read: Math.max(prog?.last_page_read ?? 0, data.page),
        pages_read_total: (prog?.pages_read_total ?? 0) + 1,
        completed: data.page >= data.totalPages,
      },
      { onConflict: "user_id,material_id" },
    );
    await supabaseAdmin
      .from("course_materials")
      .update({ page_count: data.totalPages })
      .eq("id", data.materialId)
      .eq("page_count", 0);

    return { allowed: true, pagesReadToday: used + 1 };
  });
