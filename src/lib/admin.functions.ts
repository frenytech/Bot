import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function adminClient(supabase: any): Promise<any> {
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error || !data) throw new Error("Not allowed");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Super-admin overview: students, payments, messages and AI usage. */
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await adminClient(context.supabase);
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const [students, payments, messages, ai, subs] = await Promise.all([
      sb.from("profiles").select("id,full_name,created_at,universities(name),departments(name),academic_levels(name)").order("created_at", { ascending: false }).limit(100),
      sb.from("payments").select("id,email,plan,amount_naira,status,reference,created_at,paid_at").order("created_at", { ascending: false }).limit(100),
      sb.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100),
      sb.from("ai_usage").select("feature,prompt_tokens,completion_tokens").gte("created_at", since).limit(10000),
      sb.from("subscriptions").select("plan").eq("status", "active").gt("expires_at", new Date().toISOString()),
    ]);
    const aiByFeature: Record<string, { calls: number; tokens: number }> = {};
    for (const r of ai.data ?? []) {
      const f = (aiByFeature[r.feature] ??= { calls: 0, tokens: 0 });
      f.calls++; f.tokens += (r.prompt_tokens ?? 0) + (r.completion_tokens ?? 0);
    }
    const revenue = (payments.data ?? []).filter((p: any) => p.status === "success").reduce((a: number, p: any) => a + p.amount_naira, 0);
    return {
      students: (students.data ?? []) as any[],
      payments: (payments.data ?? []) as any[],
      messages: (messages.data ?? []) as any[],
      aiByFeature,
      activeSubs: (subs.data ?? []).length,
      revenue,
    };
  });

export const setMessageStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["new", "read", "resolved"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await adminClient(context.supabase);
    await sb.from("contact_messages").update({ status: data.status }).eq("id", data.id);
    return { ok: true };
  });
