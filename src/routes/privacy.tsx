import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/site/legal-page";
import { pageHead } from "@/components/site/info-page";

export const Route = createFileRoute("/privacy")({
  head: () => pageHead("Privacy Policy", "How StudyAI collects, uses and protects your personal data."),
  component: () => (
    <LegalPage
      title="Privacy Policy"
      path="/privacy"
      updated="November 2026"
      summary="We collect only what we need to run StudyAI for you."
      sections={[
        { heading: "What we collect", body: <p>Your name, email, academic profile, reading progress and payment records.</p> },
        { heading: "How we use it", body: <p>To show you the right courses, track your progress and manage your membership.</p> },
        { heading: "Your rights", body: <p>You can ask us to correct or delete your data at any time.</p> },
      ]}
    />
  ),
});
