import { createFileRoute } from "@tanstack/react-router";

import { settlePayment, validPaystackSignature } from "@/lib/payments.server";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        if (!(await validPaystackSignature(body, request.headers.get("x-paystack-signature")))) {
          return new Response("invalid signature", { status: 401 });
        }
        const event = JSON.parse(body) as { event: string; data?: { reference?: string } };
        if (event.event === "charge.success" && event.data?.reference) {
          await settlePayment(event.data.reference);
        }
        return new Response("ok");
      },
    },
  },
});
