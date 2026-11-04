import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard, Section } from "@/components/site/page-shell";
import { pageHead } from "@/components/site/info-page";
import { AcademicFields, emptyAcademic } from "@/components/site/academic-fields";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => pageHead("Create your account", "Register for StudyAI free and set up your academic profile."),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [academic, setAcademic] = useState(emptyAcademic);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: String(f.get("email")),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: String(f.get("full_name")).slice(0, 120), ...academic },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) navigate({ to: "/dashboard", replace: true });
    else toast.success("Account created! Check your email to confirm, then log in.");
  }

  return (
    <Section className="max-w-2xl">
      <GlassCard hover={false}>
        <h1 className="text-2xl font-bold">Create your StudyAI account</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div><Label htmlFor="full_name">Full name</Label><Input id="full_name" name="full_name" required maxLength={120} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
            <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required minLength={8} /></div>
          </div>
          <AcademicFields value={academic} onChange={setAcademic} />
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Already registered? <Link to="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </GlassCard>
    </Section>
  );
}
