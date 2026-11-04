import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/site/legal-page";
import { pageHead } from "@/components/site/info-page";

export const Route = createFileRoute("/terms")({
  head: () => pageHead("Terms of Service", "The terms that govern your use of StudyAI."),
  component: () => (
    <LegalPage
      title="Terms of Service"
      path="/terms"
      updated="November 2026"
      summary="By using StudyAI you agree to these terms."
      sections={[
        { heading: "Your account", body: <p>Keep your login details private. You are responsible for activity on your account.</p> },
        { heading: "Course materials", body: <p>Materials are for your personal study only. Copying, downloading or redistributing them is not allowed.</p> },
        { heading: "Memberships", body: <p>Paid plans unlock higher daily limits for the period you pay for.</p> },
        { heading: "Acceptable use", body: <p>Do not misuse the platform, attempt to bypass limits, or share access with others.</p> },
      ]}
    />
  ),
});
