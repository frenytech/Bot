import { lazy, Suspense } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Brain, ClipboardCheck, Layers, LineChart, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/client-only";
import { CtaBand, GlassCard, Section, SectionHeading } from "@/components/site/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { pageHead } from "@/components/site/info-page";
import { BRAND } from "@/lib/brand";
import { PLAN_ORDER, PLANS, priceLabel } from "@/lib/membership";

const HeroScene = lazy(() => import("@/components/hero/hero-scene").then((m) => ({ default: m.HeroScene })));

export const Route = createFileRoute("/")({
  head: () => pageHead("AI Learning for University Students", "StudyAI gives university students their course PDFs, an AI tutor, CBT practice and flashcards in one place."),
  component: Home,
});

const FEATURES = [
  { icon: BookOpen, title: "Your course PDFs", body: "Read materials published for your exact department, level and semester." },
  { icon: Brain, title: "AI tutor", body: "Ask anything about your courses and get clear, step-by-step answers." },
  { icon: ClipboardCheck, title: "CBT practice", body: "Timed past-question papers so exam day feels familiar." },
  { icon: Layers, title: "Flashcards & notes", body: "Quick revision built from the topics you're studying." },
  { icon: LineChart, title: "Progress tracking", body: "Pick up where you stopped and see what's left to read." },
  { icon: ShieldCheck, title: "Protected materials", body: "Materials stay inside StudyAI, watermarked to each student." },
];

function Home() {
  return (
    <>
      <section className="relative overflow-hidden aurora-canvas">
        <div className="pointer-events-none absolute inset-0 grid-canvas" aria-hidden />
        <div className="section-shell relative grid items-center gap-10 py-16 md:py-24 lg:grid-cols-2">
          <Reveal>
            <p className="mb-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
              {BRAND.attribution}
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] text-balance md:text-6xl">
              Study smarter. <span className="text-gradient">Learn faster.</span> Achieve more.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Your course materials, an AI tutor and CBT practice — organised around your university, department and level.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild><Link to="/register">Get started free<ArrowRight className="size-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/how-it-works">How it works</Link></Button>
            </div>
          </Reveal>
          <div className="relative h-72 md:h-96">
            <ClientOnly fallback={<div className="size-full rounded-3xl glass-panel" />}>
              <Suspense fallback={<div className="size-full rounded-3xl glass-panel" />}>
                <HeroScene />
              </Suspense>
            </ClientOnly>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading eyebrow="Features" title="Everything for exam season, in one place" />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <GlassCard key={f.title}>
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Pricing" title="Start free, upgrade when you need more" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLAN_ORDER.map((id) => (
            <GlassCard key={id}>
              <h3 className="text-xl font-bold">{PLANS[id].name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{PLANS[id].positioning}</p>
              <p className="mt-4 text-3xl font-extrabold">{priceLabel(PLANS[id])}</p>
            </GlassCard>
          ))}
        </div>
        <div className="mt-6 text-center"><Button variant="outline" asChild><Link to="/pricing">Compare plans</Link></Button></div>
      </Section>

      <CtaBand />
    </>
  );
}
