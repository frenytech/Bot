# StudyAI — Build Roadmap

Phases follow the master development prompt. Own Supabase (ref `ajgdfaugmiyzynlazvrn`)
powers everything; no Lovable Cloud.

## Phase 1 — Architecture
- [x] Own Supabase connected (external, not Lovable Cloud)
- [x] Core schema: profiles, roles, academic directory, courses, materials,
      scanner jobs, extracted questions, subscriptions, payments, reading
      progress/usage, AI usage, site content
- [x] RLS + EXECUTE hardening on internal helpers
- [x] Super-admin provisioning path (server-side only, never self-granted)
- [x] Private storage bucket for course PDFs

## Phase 2 — Public website, branding, responsive design
- [x] StudyAI design system (deep navy, purple/cyan/electric-blue, glass)
- [x] Logo + favicon, no public Lovable branding
- [x] Home, About, Features, How It Works, Pricing, Contact, Resources
- [x] Terms, Privacy, Cookie Policy + cookie consent
- [x] Login / Register
- [x] SEO: sitemap, robots, canonical, per-page metadata

## Phase 3 — Authentication and academic profiles
- [x] Email/password register with university/faculty/department/level/semester
- [x] Login, logout, forgot password, reset password
- [x] Google Sign-In through Supabase Auth
- [x] Student dashboard shell (12 sections)

## Phase 4 — Super administrator dashboard
- [ ] Admin: students, directory editing, settings, messages, payments, AI analytics
- [x] PDF manager: courses, upload, publish/hide, delete (page count pending scanner)

## Phase 5 — Automatic PDF scanner
- [ ] Upload -> scan pipeline: page count, text vs scanned, OCR, question +
      option extraction, diagram/table detection, page references
- [ ] Cleanup: OCR spacing, noise, duplicate questions, repeated headers/footers
- [ ] AI validation pass + flags for uncertain results
- [x] Administrator question-review interface (edit, approve, reject, publish)
- [x] Scan button with progress (resume pending)
- [x] Published questions feed the CBT bank

## Phase 6 — Protected PDF reading
- [x] Private storage reads through the backend, no public URLs
- [x] PDF.js reader with per-student watermark
- [x] Daily PDF + page limits enforced server-side, locked pages blurred
- [x] Progress saved, resumes last page, WAT midnight reset

## Phase 7 — Memberships and Paystack
- [x] Centralized entitlements (free / explorer ₦300 / premium ₦500)
- [x] Paystack checkout, verify on return, signed webhook, 30-day activation
- [ ] Paystack initialize, verify, webhook, duplicate protection
- [ ] Subscription activation only after backend verification
- [ ] Payment history and subscription management UI

## Phase 8 — DeepSeek AI Tutor and RAG
- [x] DeepSeek chat through the backend (threaded, saved, streamed, daily limits)
- [ ] Chunking + embeddings + retrieval with source/page references
- [ ] Tutor customization (personality, avatar, colours, layout, language)

## Phase 9 — CBT, flashcards, AI study notes
- [x] CBT generation, timer, navigation, exam vs practice mode, results
- [ ] AI explanations with source references
- [x] Flashcards with review sessions and understood tracking
- [x] AI study notes saved per course/topic

## Phase 10 — ElevenLabs and YouTube
- [ ] ElevenLabs voice tutor (Premium), playback controls
- [ ] YouTube discovery, search by course/topic, saved videos, embed player

## Phase 11 — SEO, legal, QA, deployment
- [x] sitemap.xml, robots.txt, canonical, structured data
- [x] Legal pages and cookie consent
- [ ] Environment variable docs and deployment instructions
- [ ] End-to-end QA pass across mobile and desktop

## Blocked on credentials from the user
- DeepSeek API key
- ElevenLabs API key
- Paystack public/secret keys + webhook secret
- YouTube Data API key
- Google OAuth client (for Google Sign-In)
- Super-admin email (who should be the one super administrator)
