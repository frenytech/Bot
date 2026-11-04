import type { ReactNode } from "react";

import { Breadcrumbs, CtaBand, GlassCard, PageHero, Section } from "@/components/site/page-shell";

export type InfoItem = { title: string; body: ReactNode };

/** Simple public content page: hero, card grid, call to action. */
export function InfoPage({
  crumb,
  eyebrow,
  title,
  description,
  items,
  children,
}: {
  crumb: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  items: InfoItem[];
  children?: ReactNode;
}) {
  return (
    <>
      <Breadcrumbs items={[{ label: crumb }]} />
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <Section className="pt-0">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <GlassCard key={item.title}>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</div>
            </GlassCard>
          ))}
        </div>
        {children}
      </Section>
      <CtaBand />
    </>
  );
}

export function pageHead(title: string, description: string) {
  const full = `${title} | StudyAI`;
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      { property: "og:title", content: full },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
