import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/** Shared building blocks for the public website. */

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden aurora-canvas", className)}>
      <div className="pointer-events-none absolute inset-0 grid-canvas" aria-hidden />
      <div className="section-shell relative py-16 md:py-24">
        <Reveal>
          {eyebrow ? (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.06] text-balance md:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </Reveal>
      </div>
    </section>
  );
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("section-shell py-16 md:py-20", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </Reveal>
  );
}

export function GlassCard({
  children,
  className,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn("glass-card rounded-2xl p-6", hover && "glass-card-hover", className)}>
      {children}
    </div>
  );
}

export function CtaBand({
  title = "Start learning with StudyAI today",
  description = "Create a free account, add your academic profile, and see how your course materials, AI tutor and CBT practice fit together.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Section>
      <Reveal>
        <div className="glass-panel relative overflow-hidden rounded-3xl p-10 text-center md:p-14">
          <div
            className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl animate-pulse-glow"
            aria-hidden
          />
          <h2 className="relative text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">{description}</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/register">
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/** Breadcrumb trail for SEO-friendly navigation context. */
export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="section-shell pt-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <li>
          <Link to="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span aria-hidden>/</span>
            {item.to ? (
              <Link to={item.to} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
