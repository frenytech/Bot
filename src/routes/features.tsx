import { createFileRoute } from "@tanstack/react-router";

import { InfoPage, pageHead } from "@/components/site/info-page";

export const Route = createFileRoute("/features")({
  head: () => pageHead("Features", "Protected course PDFs, AI tutor, CBT practice, flashcards, study notes and progress analytics."),
  component: () => (
    <InfoPage
      crumb="Features"
      eyebrow="Features"
      title="Everything you need for exam season"
      description="One platform for reading, practising and understanding your courses."
      items={[
        { title: "Protected course materials", body: "Read your department's PDFs securely inside StudyAI." },
        { title: "AI tutor", body: "Ask questions about your courses and get clear explanations." },
        { title: "CBT practice", body: "Timed practice papers built from past questions." },
        { title: "Flashcards & notes", body: "Quick revision cards and summaries for every topic." },
        { title: "Voice tutor", body: "Listen to explanations on the Premium plan." },
        { title: "Progress tracking", body: "See what you've read and where to focus next." },
      ]}
    />
  ),
});
