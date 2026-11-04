import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/site/legal-page";
import { pageHead } from "@/components/site/info-page";

export const Route = createFileRoute("/cookies")({
  head: () => pageHead("Cookie Policy", "How StudyAI uses cookies and how to manage your preferences."),
  component: () => (
    <LegalPage
      title="Cookie Policy"
      path="/cookies"
      updated="November 2026"
      summary="We use a small number of cookies to keep you signed in and improve StudyAI."
      sections={[
        { heading: "Essential", body: <p>Required to sign in and keep your session secure.</p> },
        { heading: "Analytics", body: <p>Optional; help us understand how the platform is used.</p> },
        { heading: "Marketing", body: <p>Optional; off unless you turn them on.</p> },
      ]}
    />
  ),
});
