import { getEntitlements, type PlanId } from "@/lib/membership";

const PAYSTACK = "https://api.paystack.co";

function key() {
  const k = process.env["PAYSTACK_SECRET_KEY"];
  if (!k) throw new Error("Payments are not configured.");
  return k;
}

export async function paystack<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PAYSTACK}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = (await res.json()) as any;
  if (!res.ok || !json.status) {
    console.error("Paystack error", path, res.status, json?.message);
    throw new Error("Payment provider error.");
  }
  return json.data as T;
}

/** HMAC-SHA512 signature check for Paystack webhooks (Web Crypto, works on workers). */
export async function validPaystackSignature(body: string, signature: string | null) {
  if (!signature) return false;
  const cryptoKey = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(key()), { name: "HMAC", hash: "SHA-512" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(body));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === signature;
}

/**
 * Verifies a payment with Paystack and, exactly once, marks it paid and
 * activates a 30-day membership. Safe to call from both the redirect and the webhook.
 */
export async function settlePayment(reference: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: payment } = await supabaseAdmin
    .from("payments").select("*").eq("reference", reference).maybeSingle();
  if (!payment) return { status: "unknown" as const };
  if (payment.status === "success") return { status: "success" as const, plan: payment.plan as PlanId };

  const tx = await paystack<any>(`/transaction/verify/${encodeURIComponent(reference)}`);
  const expectedKobo = Math.round(Number(payment.amount_naira) * 100);
  if (tx.status !== "success" || tx.amount !== expectedKobo || tx.currency !== "NGN") {
    const status = tx.status === "abandoned" ? "abandoned" : tx.status === "success" ? "failed" : "pending";
    if (status !== "pending") {
      await supabaseAdmin.from("payments").update({ status, provider_response: tx }).eq("id", payment.id).eq("status", "pending");
    }
    return { status: status as "failed" | "abandoned" | "pending" };
  }

  // Only the first caller flips pending -> success, so activation happens once.
  const { data: won } = await supabaseAdmin
    .from("payments")
    .update({ status: "success", paid_at: new Date().toISOString(), provider_response: tx })
    .eq("id", payment.id).eq("status", "pending").select("id");
  if (won?.length) {
    await supabaseAdmin.from("subscriptions").update({ status: "expired" }).eq("user_id", payment.user_id).eq("status", "active");
    await supabaseAdmin.from("subscriptions").insert({
      user_id: payment.user_id,
      plan: payment.plan,
      status: "active",
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
      paystack_reference: reference,
      auto_renew: false,
    });
  }
  return { status: "success" as const, plan: payment.plan as PlanId };
}

export function priceFor(plan: PlanId) {
  return getEntitlements(plan).priceNaira;
}
