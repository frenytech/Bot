import { createFileRoute } from "@tanstack/react-router";

import { InfoPage, pageHead } from "@/components/site/info-page";

export const Route = createFileRoute("/how-it-works")({
  head: () => pageHead("How It Works", "Create an account, add your academic profile and start studying your own courses on StudyAI."),
  component: () => (
    <InfoPage
      crumb="How It Works"
      eyebrow="How it works"
      title="From sign-up to exam-ready in four steps"
      description="StudyAI organises everything around your academic profile."
      items={[
        { title: "1. Create your account", body: "Sign up free with your email." },
        { title: "2. Add your profile", body: "Choose your university, faculty, department, level and semester." },
        { title: "3. Open your courses", body: "Read the materials published for your programme." },
        { title: "4. Practise & revise", body: "Use the AI tutor, CBT practice and flashcards to prepare." },
      ]}
    />
  ),
});
