import { createFileRoute } from "@tanstack/react-router";

import { TutorShell } from "@/components/tutor/tutor-shell";

export const Route = createFileRoute("/_authenticated/tutor/$threadId")({
  head: () => ({ meta: [{ title: "AI Tutor chat | StudyAI" }, { name: "robots", content: "noindex" }] }),
  component: TutorThread,
});

function TutorThread() {
  const { threadId } = Route.useParams();
  return <TutorShell threadId={threadId} />;
}
