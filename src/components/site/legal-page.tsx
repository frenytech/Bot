import type { ReactNode } from "react";

import { Breadcrumbs, PageHero, Section } from "@/components/site/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { BRAND } from "@/lib/brand";

export type LegalSection = { heading: string; body: ReactNode };

/**
 * Shared shell for Terms, Privacy and Cookie Policy so the three documents
 * read as one set and stay easy for the administrator to keep current.
 */
export function LegalPage({
  title,
  summary,
  updated,
  sections,
  path,
}: {
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
  path: string;
}) {
  return (
    <>
      <Breadcrumbs items={[{ label: title }]} />
      <PageHero
        eyebrow="Legal"
        title={title}
        description={summary}
        className="pb-10"
      />
      <Section className="max-w-3xl pt-4">
        <p className="text-sm text-muted-foreground">Last updated: {updated}</p>
        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <Reveal key={section.heading}>
              <article>
                <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {section.body}
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="glass-card mt-12 rounded-2xl p-6">
          <h3 className="text-sm font-semibold">Questions about this policy?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Write to {BRAND.email}, call {BRAND.phone}, or message FrenyTech on WhatsApp at{" "}
            {BRAND.phone}. We reply to data and account requests within 30 days.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            StudyAI is developed and powered by FrenyTech. More at{" "}
            <a
              href={BRAND.github}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              {BRAND.github}
            </a>
            .
          </p>
        </div>
      </Section>
      <span className="hidden">{path}</span>
    </>
  );
}
