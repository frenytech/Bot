/**
 * Centralized membership entitlements for StudyAI.
 *
 * Every plan limit lives here and nowhere else. The backend reads these values
 * to decide what a student may do; the pricing page renders them. Changing a
 * ceiling is a one-line edit in this file, and the enforcement follows it.
 */

export type PlanId = "free" | "explorer" | "premium";

export type Entitlements = {
  id: PlanId;
  name: string;
  positioning: string;
  priceNaira: number;
  /** Distinct PDFs a student may open per calendar day. null = unlimited. */
  pdfsPerDay: number | null;
  /** Readable pages per PDF per day. null = unlimited. */
  pagesPerPdfPerDay: number | null;
  /** AI tutor messages per day. null = unlimited. */
  aiMessagesPerDay: number | null;
  /** CBT sessions per day. null = unlimited. */
  cbtSessionsPerDay: number | null;
  /** Largest generated CBT paper. */
  cbtMaxQuestions: number;
  flashcards: "basic" | "advanced";
  studyNotes: "basic" | "advanced";
  youtube: "limited" | "full";
  /** ElevenLabs voice tutor. */
  voiceTutor: boolean;
  analytics: "basic" | "expanded" | "full";
  tutorCustomization: "basic" | "expanded" | "full";
  priorityAccess: boolean;
  includes: PlanId[];
};

export const PLANS: Record<PlanId, Entitlements> = {
  free: {
    id: "free",
    name: "Free",
    positioning: "Start Learning",
    priceNaira: 0,
    pdfsPerDay: 2,
    pagesPerPdfPerDay: 40,
    aiMessagesPerDay: 20,
    cbtSessionsPerDay: 3,
    cbtMaxQuestions: 20,
    flashcards: "basic",
    studyNotes: "basic",
    youtube: "limited",
    voiceTutor: false,
    analytics: "basic",
    tutorCustomization: "basic",
    priorityAccess: false,
    includes: [],
  },
  explorer: {
    id: "explorer",
    name: "Explorer",
    positioning: "Learn Without Limits",
    priceNaira: 300,
    pdfsPerDay: null,
    pagesPerPdfPerDay: null,
    aiMessagesPerDay: 150,
    cbtSessionsPerDay: null,
    cbtMaxQuestions: 50,
    flashcards: "advanced",
    studyNotes: "advanced",
    youtube: "full",
    voiceTutor: false,
    analytics: "expanded",
    tutorCustomization: "expanded",
    priorityAccess: false,
    includes: ["free"],
  },
  premium: {
    id: "premium",
    name: "Premium",
    positioning: "Experience the Complete Power of StudyAI",
    priceNaira: 500,
    pdfsPerDay: null,
    pagesPerPdfPerDay: null,
    aiMessagesPerDay: null,
    cbtSessionsPerDay: null,
    cbtMaxQuestions: 50,
    flashcards: "advanced",
    studyNotes: "advanced",
    youtube: "full",
    voiceTutor: true,
    analytics: "full",
    tutorCustomization: "full",
    priorityAccess: true,
    // Premium carries every Explorer entitlement plus its own benefits.
    includes: ["free", "explorer"],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "explorer", "premium"];

export function getEntitlements(plan: PlanId | null | undefined): Entitlements {
  return PLANS[plan && plan in PLANS ? plan : "free"];
}

/** True when `used` is below the plan ceiling (null ceiling = unlimited). */
export function withinLimit(ceiling: number | null, used: number): boolean {
  return ceiling === null || used < ceiling;
}

export function naira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function priceLabel(plan: Entitlements): string {
  return plan.priceNaira === 0 ? "₦0" : `${naira(plan.priceNaira)}/month`;
}
