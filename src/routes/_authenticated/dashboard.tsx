import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { GlassCard, Section } from "@/components/site/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | StudyAI" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, entitlements } = useAuth();
  const courses = useQuery({
    queryKey: ["my-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id,code,title,description,course_materials(id,file_name)").eq("is_published", true).order("code");
      if (error) throw error;
      return data;
    },
  });
  const needsProfile = profile && !profile.department_id;
  return (
    <Section>
      <h1 className="text-3xl font-bold">Hi {profile?.full_name?.split(" ")[0] || "there"} 👋</h1>
      <p className="mt-2 text-muted-foreground">You're on the {entitlements.name} plan.</p>
      {needsProfile ? (
        <GlassCard hover={false} className="mt-6">
          <p>Finish your academic profile so we can show your courses.</p>
          <Button className="mt-3" asChild><Link to="/settings">Complete profile</Link></Button>
        </GlassCard>
      ) : null}
      <Button className="mt-6" asChild><Link to="/cbt">Take a practice test</Link></Button>
      <h2 className="mt-10 text-xl font-semibold">Your courses</h2>
      <div className="mt-4 grid gap-5 md:grid-cols-3">
        {courses.isLoading ? <p className="text-muted-foreground">Loading…</p> : !courses.data?.length ? (
          <p className="text-muted-foreground">No courses have been published for your programme yet.</p>
        ) : courses.data.map((c) => (
          <GlassCard key={c.id}>
            <p className="text-xs font-semibold text-primary">{c.code}</p>
            <h3 className="mt-1 font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {c.course_materials.map((m) => (
                <li key={m.id}><Link to="/read/$materialId" params={{ materialId: m.id }} className="text-primary hover:underline">{m.file_name}</Link></li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}
