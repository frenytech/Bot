import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Breadcrumbs, GlassCard, PageHero, Section } from "@/components/site/page-shell";
import { pageHead } from "@/components/site/info-page";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/resources")({
  head: () => pageHead("Educational Resources", "Study guides and exam tips for university students from the StudyAI team."),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("id,title,excerpt,category,author")
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <Breadcrumbs items={[{ label: "Resources" }]} />
      <PageHero eyebrow="Resources" title="Guides to help you study better" description="Articles and tips published by the StudyAI team." />
      <Section className="pt-0">
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : !data?.length ? (
          <GlassCard hover={false}><p className="text-muted-foreground">No articles yet — check back soon.</p></GlassCard>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {data.map((r) => (
              <GlassCard key={r.id}>
                <p className="text-xs font-semibold text-primary uppercase">{r.category}</p>
                <h3 className="mt-2 text-lg font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{r.excerpt}</p>
              </GlassCard>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
