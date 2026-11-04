/**
 * StudyAI brand constants — An AI Learning Platform by FrenyTech.
 *
 * Single source of truth for product name, legal attribution and FrenyTech
 * contact routes, so no page hardcodes its own copy of them.
 */

export const BRAND = {
  name: "StudyAI",
  tagline: "Study Smarter. Learn Faster. Achieve More.",
  attribution: "An AI Learning Platform by FrenyTech",
  footerLine: "© 2026 StudyAI. All rights reserved. Built and powered by FrenyTech.",
  github: "https://github.com/frenytech",
  email: "feranmiabiola1002@gmail.com",
  phone: "08148828743",
  whatsapp: "https://wa.me/2348148828743",
} as const;

export const SITE_URL = "https://studyai.frenytech.com";

export type NavItem = { label: string; to: string };

export const PRIMARY_NAV: NavItem[] = [
  { label: "Features", to: "/features" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "Pricing", to: "/pricing" },
  { label: "Resources", to: "/resources" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export const FOOTER_NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Product",
    items: [
      { label: "Features", to: "/features" },
      { label: "How It Works", to: "/how-it-works" },
      { label: "Pricing", to: "/pricing" },
      { label: "Register", to: "/register" },
    ],
  },
  {
    heading: "Learn",
    items: [
      { label: "Educational Resources", to: "/resources" },
      { label: "AI Tutor", to: "/features" },
      { label: "CBT Practice", to: "/features" },
      { label: "Study Materials", to: "/how-it-works" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "FrenyTech on GitHub", to: BRAND.github },
    ],
  },
  {
    heading: "Legal",
    items: [
      { label: "Terms and Conditions", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Cookie Policy", to: "/cookies" },
    ],
  },
];

export function isExternal(to: string): boolean {
  return /^https?:\/\//.test(to) || to.startsWith("mailto:") || to.startsWith("tel:");
}
