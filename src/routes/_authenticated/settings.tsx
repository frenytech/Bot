import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard, Section } from "@/components/site/page-shell";
import { AcademicFields, emptyAcademic, type AcademicValues } from "@/components/site/academic-fields";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings | StudyAI" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [academic, setAcademic] = useState<AcademicValues>(emptyAcademic);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name);
    setAcademic({
      university_id: profile.university_id ?? "",
      faculty_id: profile.faculty_id ?? "",
      department_id: profile.department_id ?? "",
      academic_level_id: profile.academic_level_id ?? "",
      semester_id: profile.semester_id ?? "",
    });
  }, [profile]);

  async function save() {
    if (!user) return;
    setBusy(true);
    const n = (v: string) => v || null;
    const { error } = await supabase.from("profiles").update({
      full_name: name.slice(0, 120),
      university_id: n(academic.university_id),
      faculty_id: n(academic.faculty_id),
      department_id: n(academic.department_id),
      academic_level_id: n(academic.academic_level_id),
      semester_id: n(academic.semester_id),
      onboarded: true,
    }).eq("id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved.");
    await refreshProfile();
  }

  return (
    <Section className="max-w-2xl">
      <GlassCard hover={false}>
        <h1 className="text-2xl font-bold">Your profile</h1>
        <div className="mt-6 space-y-4">
          <div><Label htmlFor="name">Full name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <AcademicFields value={academic} onChange={setAcademic} />
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
        </div>
      </GlassCard>
      <Billing userId={user?.id} />
    </Section>
  );
}

function Billing({ userId }: { userId: string | undefined }) {
  const q = useQuery({
    queryKey: ["billing", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [sub, pays] = await Promise.all([
        supabase.from("subscriptions").select("plan,status,expires_at").eq("user_id", userId!).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("payments").select("id,plan,amount_naira,status,reference,created_at").eq("user_id", userId!).order("created_at", { ascending: false }).limit(50),
      ]);
      return { sub: sub.data, pays: pays.data ?? [] };
    },
  });
  const sub = q.data?.sub;
  const active = sub && sub.status === "active" && (!sub.expires_at || new Date(sub.expires_at) > new Date());
  return (
    <GlassCard hover={false} className="mt-6">
      <h2 className="text-xl font-bold">Membership & payments</h2>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p>{active ? <>You're on <b className="capitalize">{sub!.plan}</b>{sub!.expires_at ? ` until ${new Date(sub!.expires_at).toLocaleDateString()}` : ""}.</> : "You're on the Free plan."}</p>
        <Button asChild size="sm"><Link to="/pricing">{active ? "Renew or change plan" : "Upgrade"}</Link></Button>
      </div>
      <div className="mt-4 space-y-2">
        {q.data?.pays.length ? q.data.pays.map((p) => (
          <div key={p.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <span className="capitalize">{p.plan} · ₦{p.amount_naira.toLocaleString()}</span>
            <span className="capitalize text-muted-foreground">{p.status} · {new Date(p.created_at).toLocaleDateString()}</span>
          </div>
        )) : <p className="text-sm text-muted-foreground">No payments yet.</p>}
      </div>
    </GlassCard>
  );
}
