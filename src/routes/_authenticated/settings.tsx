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
    </Section>
  );
}
