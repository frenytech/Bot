import { createFileRoute } from "@tanstack/react-router";

import { InfoPage, pageHead } from "@/components/site/info-page";

export const Route = createFileRoute("/about")({
  head: () => pageHead("About", "StudyAI is an AI learning platform for university students, built and powered by FrenyTech."),
  component: () => (
    <InfoPage
      crumb="About"
      eyebrow="About StudyAI"
      title="Built for how university students actually study"
      description="StudyAI brings your course materials, an AI tutor and CBT practice into one place, organised around your university, department, level and semester."
      items={[
        { title: "Our mission", body: "Help every student study smarter, learn faster and achieve more with tools matched to their own courses." },
        { title: "Who builds it", body: "StudyAI is designed, developed and powered by FrenyTech." },
        { title: "Your courses first", body: "Materials are matched to your academic profile, so you only see what belongs to your programme." },
      ]}
    />
  ),
});
