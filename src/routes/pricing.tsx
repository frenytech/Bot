import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Breadcrumbs, GlassCard, PageHero, Section } from "@/components/site/page-shell";
import { pageHead } from "@/components/site/info-page";
import { PLAN_ORDER, PLANS, priceLabel } from "@/lib/membership";

export const Route = createFileRoute("/pricing")({
  head: () => pageHead("Pricing", "Compare StudyAI's Free, Explorer and Premium memberships for university students."),
  component: PricingPage,
});

const limit = (n: number | null, unit: string) => (n === null ? `Unlimited ${unit}` : `${n} ${unit}`);

function PricingPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Pricing" }]} />
      <PageHero eyebrow="Pricing" title="Simple plans for every student" description="Start free and upgrade when you need more." />
      <Section className="pt-0">
        <div className="grid gap-6 md:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            return (
              <GlassCard key={id} className={id === "explorer" ? "border-primary/50" : ""}>
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.positioning}</p>
                <p className="mt-4 text-3xl font-extrabold">{priceLabel(p)}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {[
                    limit(p.pdfsPerDay, "PDFs per day"),
                    limit(p.aiMessagesPerDay, "AI tutor messages per day"),
                    limit(p.cbtSessionsPerDay, "CBT sessions per day"),
                    `Up to ${p.cbtMaxQuestions} questions per CBT`,
                    p.voiceTutor ? "Voice tutor" : "Text tutor",
                  ].map((f) => (
                    <li key={f} className="flex gap-2"><Check className="size-4 text-primary" />{f}</li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" asChild><Link to="/register">Get started</Link></Button>
              </GlassCard>
            );
          })}
        </div>
      </Section>
    </>
  );
}
