import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumbs, GlassCard, PageHero, Section } from "@/components/site/page-shell";
import { pageHead } from "@/components/site/info-page";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/contact")({
  head: () => pageHead("Contact", "Get in touch with the StudyAI team at FrenyTech by email, phone or WhatsApp."),
  component: ContactPage,
});

function ContactPage() {
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: String(f.get("name")).slice(0, 120),
      email: String(f.get("email")).slice(0, 200),
      subject: String(f.get("subject")).slice(0, 200),
      message: String(f.get("message")).slice(0, 4000),
    });
    setBusy(false);
    if (error) return toast.error("Your message could not be sent. Please try again.");
    toast.success("Thanks! We'll get back to you soon.");
    form.reset();
  }
  return (
    <>
      <Breadcrumbs items={[{ label: "Contact" }]} />
      <PageHero eyebrow="Contact" title="We'd love to hear from you" description={`Email ${BRAND.email} or call ${BRAND.phone}.`} />
      <Section className="max-w-2xl pt-0">
        <GlassCard hover={false}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div><Label htmlFor="name">Name</Label><Input id="name" name="name" required maxLength={120} /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
            <div><Label htmlFor="subject">Subject</Label><Input id="subject" name="subject" required maxLength={200} /></div>
            <div><Label htmlFor="message">Message</Label><Textarea id="message" name="message" required rows={5} maxLength={4000} /></div>
            <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send message"}</Button>
          </form>
        </GlassCard>
      </Section>
    </>
  );
}
