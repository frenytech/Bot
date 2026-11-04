import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { GlassCard, Section } from "@/components/site/page-shell";
import { confirmPayment } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/payment/callback")({
  validateSearch: z.object({ reference: z.string().optional(), trxref: z.string().optional() }),
  head: () => ({ meta: [{ title: "Payment | StudyAI" }, { name: "robots", content: "noindex" }] }),
  component: Callback,
});

function Callback() {
  const { reference, trxref } = Route.useSearch();
  const ref = reference ?? trxref;
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("checking");
  useEffect(() => {
    if (!ref) { setStatus("unknown"); return; }
    confirmPayment({ data: { reference: ref } })
      .then((r) => { setStatus(r.status); if (r.status === "success") qc.invalidateQueries(); })
      .catch(() => setStatus("error"));
  }, [ref, qc]);
  const text: Record<string, string> = {
    checking: "Confirming your payment…",
    success: "Payment successful! Your membership is now active for 30 days.",
    pending: "Your payment is still processing. Refresh this page in a minute.",
    failed: "The payment didn't go through. You weren't charged for a membership.",
    abandoned: "The payment was cancelled.",
    unknown: "We couldn't find this payment.",
    error: "Something went wrong confirming your payment. Please contact us if you were charged.",
  };
  return (
    <Section className="max-w-lg">
      <GlassCard hover={false}>
        <p className="text-lg font-semibold">{text[status]}</p>
        <div className="mt-4 flex gap-2">
          <Button asChild><Link to="/dashboard">Go to dashboard</Link></Button>
          {status !== "success" && status !== "checking" ? <Button variant="outline" asChild><Link to="/pricing">Back to pricing</Link></Button> : null}
        </div>
      </GlassCard>
    </Section>
  );
}
