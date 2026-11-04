import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { paystack, priceFor, settlePayment } from "@/lib/payments.server";

/** Starts a Paystack checkout for a paid plan; price always comes from the server. */
export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ plan: z.enum(["explorer", "premium"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const email = context.claims.email;
    if (!email) throw new Error("Your account needs an email address to pay.");
    const amount = priceFor(data.plan);
    const reference = `SAI-${crypto.randomUUID()}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("payments").insert({
      user_id: context.userId, plan: data.plan, amount_naira: amount, email, reference, status: "pending", provider_response: {},
    });
    if (error) throw error;
    const origin = new URL(getRequest().url).origin;
    const tx = await paystack<{ authorization_url: string }>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email, amount: amount * 100, currency: "NGN", reference,
        callback_url: `${origin}/payment/callback`,
        metadata: { user_id: context.userId, plan: data.plan },
      }),
    });
    return { url: tx.authorization_url };
  });

/** Confirms a payment after Paystack redirects back. */
export const confirmPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ reference: z.string().min(5).max(100) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: own } = await context.supabase
      .from("payments").select("id").eq("reference", data.reference).maybeSingle();
    if (!own) return { status: "unknown" as const };
    return settlePayment(data.reference);
  });
