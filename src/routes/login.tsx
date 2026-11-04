import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard, Section } from "@/components/site/page-shell";
import { pageHead } from "@/components/site/info-page";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => pageHead("Log in", "Sign in to your StudyAI account."),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard", replace: true });
  }
  async function forgot() {
    const email = (document.getElementById("email") as HTMLInputElement).value;
    if (!email) return toast.error("Enter your email first.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
    if (error) toast.error(error.message);
    else toast.success("Check your email for a reset link.");
  }
  return (
    <Section className="max-w-md">
      <GlassCard hover={false}>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Log in"}</Button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <button type="button" onClick={forgot} className="text-primary hover:underline">Forgot password?</button>
          <Link to="/register" className="text-primary hover:underline">Create account</Link>
        </div>
      </GlassCard>
    </Section>
  );
}
