import { createFileRoute } from "@tanstack/react-router";

import { GlassCard, Section } from "@/components/site/page-shell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin | StudyAI" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <Section><p className="text-muted-foreground">Loading…</p></Section>;
  if (!isAdmin)
    return <Section><GlassCard hover={false}>You don't have access to this page.</GlassCard></Section>;
  return (
    <Section>
      <h1 className="text-3xl font-bold">Admin</h1>
      <p className="mt-2 text-muted-foreground">Course, PDF and question management are coming in the next phase.</p>
    </Section>
  );
}
