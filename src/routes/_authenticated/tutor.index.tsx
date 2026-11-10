import { createFileRoute } from "@tanstack/react-router";

import { TutorShell } from "@/components/tutor/tutor-shell";

export const Route = createFileRoute("/_authenticated/tutor/")({
  head: () => ({ meta: [{ title: "AI Tutor | StudyAI" }, { name: "robots", content: "noindex" }] }),
  component: () => <TutorShell />,
});
