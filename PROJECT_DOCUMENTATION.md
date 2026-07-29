# Career Decoder — Complete Technical Documentation

> Live: https://careerdecoder.work · Stack: React 18 + Vite + TypeScript + Tailwind/shadcn · Backend: Supabase (Postgres + Auth + Storage + Edge Functions) · AI: Lovable AI Gateway (Google Gemini) · Payments: Razorpay (India)

This document explains **everything**: what the product does, how each screen works, what happens on the server for every action, the database design, the security model, the money flow, and the anti-abuse/cost-control systems.

---

## Table of Contents

1. [What the product is](#1-what-the-product-is)
2. [High-level architecture](#2-high-level-architecture)
3. [Tech stack & build setup](#3-tech-stack--build-setup)
4. [Authentication & session handling](#4-authentication--session-handling)
5. [Routing & page map](#5-routing--page-map)
6. [Frontend service layer](#6-frontend-service-layer)
7. [The AI features — how each one actually works](#7-the-ai-features--how-each-one-actually-works)
8. [Edge functions reference](#8-edge-functions-reference)
9. [Database schema](#9-database-schema)
10. [Security model](#10-security-model)
11. [Monetization: plans, limits, promo codes, referrals](#11-monetization-plans-limits-promo-codes-referrals)
12. [Razorpay payment flow end-to-end](#12-razorpay-payment-flow-end-to-end)
13. [AI cost & abuse controls](#13-ai-cost--abuse-controls)
14. [Admin tooling](#14-admin-tooling)
15. [SEO & performance](#15-seo--performance)
16. [Design system](#16-design-system)
17. [Operations runbook](#17-operations-runbook)
18. [Glossary / FAQ answers](#18-glossary--faq-answers)

---

## 1. What the product is

Career Decoder is an AI career-intelligence platform for students and early-career professionals (India-first). A user creates a profile (skills, interests, degree, career goal, resume), and the platform produces:

| Feature | What the user gets |
|---|---|
| Career Recommendations | 5–7 matched careers with a computed match score, required/missing skills, INR salary range |
| Skill Gap Analysis | Readiness score, matched vs missing skills, priority tiers, skill distribution |
| Learning Roadmap | 6–12 ordered learning steps (topologically sorted by skill dependency) with resources + progress tracking |
| Project Suggestions | 4–6 portfolio projects that close the specific skill gaps |
| Resume Analysis | ATS score (0–100), extracted skills/experience/projects, strengths, weaknesses, fixes |
| LinkedIn Analysis | Section-level scoring (headline/about/experience/skills), keyword gaps, prioritized suggestions |
| GitHub Analysis | Portfolio score from real GitHub API data + per-repo AI complexity review |
| AI Interview Simulator | Adaptive multi-turn mock interview (HR/Technical/Behavioral) + weighted evaluation (Pro only) |
| Market Intelligence | Trending/declining skills, salary by experience, hiring cities/companies, market position score |
| Career Path Graph | Interactive node graph of the route from current skills → target role |
| Career Readiness Report | One consolidated recruiter-style report blending all of the above |
| Analytics | Historical trends: interview scores, roadmap completion, readiness over time |

Supporting systems: subscriptions (Free/Pro), usage metering, promo codes, referral rewards, reviews/testimonials, support tickets & bug reports, blog + programmatic career guides for SEO.

---

## 2. High-level architecture

```
Browser (React SPA)
   |
   |-- supabase-js  -->  Supabase Auth (JWT)  ------------+
   |                                                       |
   |-- supabase-js  -->  Postgres via PostgREST            |  (RLS enforced,
   |                     (reads of own rows only)          |   auth.uid() scoped)
   |                                                       |
   |-- functions.invoke --> Supabase Edge Functions (Deno) -+
   |                            |
   |                            |-- service_role client (bypasses RLS, trusted)
   |                            |-- Lovable AI Gateway --> Google Gemini
   |                            |-- GitHub REST API
   |                            |-- Razorpay REST API
   |                            \-- Supabase Storage (resumes, bug-screenshots)
   |
   \-- Razorpay Checkout.js (payment modal)

Razorpay servers --(signed webhook)--> razorpay-webhook edge function
```

**Golden rule of this codebase:** the browser never performs privileged work. All AI calls, quota enforcement, payment verification, promo redemption, and referral rewards happen inside edge functions using the service-role key. The client-side checks that exist (e.g. `gateFeature`) are **UX only**, never security.

---

## 3. Tech stack & build setup

- **React 18 + Vite 5 + TypeScript 5**, SWC compiler (`@vitejs/plugin-react-swc`), dev server on port 8080.
- **Tailwind CSS v3** with the full **shadcn/ui** component set (`src/components/ui/*`, Radix-based).
- **State/data**: React Context (auth, cookie consent) + direct service calls; `@tanstack/react-query` provider mounted for cache-capable calls.
- **Routing**: `react-router-dom` v6.
- **Charts**: `recharts`. **Graph**: `@xyflow/react`. **Markdown**: `react-markdown`. **Head tags**: `react-helmet-async`. **Toasts**: `sonner` + shadcn toaster.

### Performance-critical build config (`vite.config.ts`)
Manual Rollup chunks so the landing page doesn't download the whole app:

`vendor-react`, `vendor-supabase`, `vendor-query`, `vendor-charts`, `vendor-flow`, `vendor-markdown`.

### Instant paint shell (`index.html`)
A pure-CSS branded loading shell (`#app-shell`) renders before any JS executes and auto-hides via `#root:not(:empty) + #app-shell { display:none }`. This removed the 4–8s white screen on Indian 4G and was the single biggest bounce-rate fix.

### Route-level code splitting (`src/routes/AppRoutes.tsx`)
Only `Landing` is eagerly imported. Every other page is `React.lazy` + a shared `<Suspense>` spinner. Landing-critical JS dropped from ~478 KB gz to ~194 KB gz.

### Entry chain
`src/main.tsx` → `HelmetProvider` → `src/App.tsx` → `QueryClientProvider` → `TooltipProvider` → toasters → `BrowserRouter` → `CookieConsentProvider` → `AuthProvider` → `AppRoutes` + globally mounted `HelpButton`, `CookieConsent`, `UpgradeModal`.

---

## 4. Authentication & session handling

**Provider**: Supabase Auth, email + password, email verification required. Google OAuth code exists (`GoogleSignInButton`, `authService.signInWithGoogle`) but is currently not surfaced on the login/signup pages.

### `src/context/AuthContext.tsx`
- On mount calls `supabase.auth.getSession()` **first** so protected pages never flash an unauthenticated state (this fixed the old "clicking Billing signs me out" bug).
- Subscribes to `onAuthStateChange`, but **only clears the session on `SIGNED_OUT` / `USER_DELETED`**. Other events with a null payload are ignored so mid-navigation token refreshes can't log the user out.
- On any new session it auto-claims a pending referral: reads `localStorage["pending_ref"]` (written by `/signup?ref=CODE`) and calls the `apply-referral` edge function, toasting on success and clearing the key on terminal errors.

### `src/services/authService.ts`
`signUp` (stores `full_name` metadata, `emailRedirectTo: window.location.origin`), `signIn`, `signInWithGoogle`, `signOut`, `sendPasswordReset` (redirect → `/reset-password`), `updatePassword`, `getCurrentUser`.

### Flows
- **Signup** (`Signup.tsx`): captures `?ref=`, validates password confirm, then shows a "check your email to verify" confirmation screen. Users must verify before AI features work (`enforceUsage` blocks unverified emails with 403).
- **Login** (`Login.tsx`): after sign-in, loads the profile; no profile → `/profile/setup`, else the sanitized `?redirect=` path or `/dashboard`.
- **Forgot password**: always shows a generic "if that account exists we sent a link" message (prevents account enumeration).
- **Reset password** (`ResetPassword.tsx`): listens for the Supabase `PASSWORD_RECOVERY` event from the `#type=recovery` hash, updates the password, signs out, redirects to login.
- **Protected routes** (`ProtectedRoute.tsx`): spinner while loading → redirect to `/login?redirect=<path>` if signed out.

---

## 5. Routing & page map

### Public
`/` Landing · `/login` · `/signup` · `/forgot-password` · `/reset-password` · `/pricing` · `/blog`, `/blog/:slug` · `/careers`, `/careers/:slug` · `/support` (+`/help`) · `/privacy-policy` · `/terms-of-service` · `*` NotFound

### Protected (requires session)
`/dashboard` · `/profile` · `/profile/setup` · `/career-recommendations` · `/career-details/:id` · `/skill-analysis` (+`/skill-gap`) · `/learning-roadmap` · `/resume-analysis` · `/linkedin-analysis` · `/github-analysis` · `/interview-simulator` · `/market-intelligence` · `/career-path` · `/career-report` · `/analytics` · `/billing` · `/payment-success` · `/referrals` · `/leave-review` · `/admin/reviews` · `/admin/inbox` · `/admin/promo-codes`

Admin routes are only session-gated at the router level; the actual admin check happens in-page (`reviewService.isAdmin`) **and** is enforced server-side by RLS/edge-function checks against `profiles.is_admin`.

### Layouts
- **`Navbar` + `Footer`** — public marketing pages.
- **`DashboardLayout`** — shadcn collapsible sidebar with 18 nav items, active-state accent bar, welcome header, logout button, plus in-page anchor "insight" links (`#career-paths`, `#skill-gaps`, `#learning-roadmap`, `#projects`) used from the Dashboard.

### Landing page section order (bounce-rate optimized)
Hero (with `HeroPreview` product mock + inline career links + no-signup secondary CTA) → Features → Popular Careers → How It Works → Reviews + Stats trust block → Blog teaser → CTA banner.

---

## 6. Frontend service layer

Every network call lives in `src/services/*`; pages never call Supabase directly (with a couple of deliberate exceptions like `CareerReportPage` and `Referrals`).

| Service | Key functions |
|---|---|
| `authService` | signUp / signIn / signInWithGoogle / signOut / sendPasswordReset / updatePassword |
| `profileService` | getProfile, createProfile, updateProfile (allowlist-sanitized upsert), uploadResume (≤10 MB, pdf/doc/docx, stored at `<uid>/resume.<ext>`), getResumeSignedUrl (5-min), getResumeBlobUrl |
| `careerService` | generateRecommendations, getRecommendations, getCareerById, generateSkillAnalysis, getSkillAnalysis |
| `roadmapService` | generateRoadmap, getRoadmap, getStepsByRoadmap, updateStepStatus (recomputes progress) |
| `projectService` | generateProjects, getProjects |
| `resumeService` | parseResume, scoreResume, getResumeAnalysis, updateProfileSkillsFromResume (case-insensitive merge) |
| `linkedinService` | uploadAndParse (multipart fetch to `parse-linkedin`), generateAnalysis, listAnalyses, getLatest, deleteAnalysis |
| `githubService` | analyzeGithubProfile, getGithubAnalysis, getRepoAnalysis |
| `interviewService` | createSession, sendMessage, evaluateInterview, getMessages, getSessions |
| `marketService` | generateInsights, getInsights |
| `billingService` | createSubscription, validatePromo, verifyPayment, cancel, checkUsage, `loadRazorpay()` script loader |
| `reviewService` | getApproved, getMine, submit, listAll, setStatus, isAdmin |
| `featureGate` | `gateFeature`, `handleFeatureError`, `UpgradeRequiredError` |

### `featureGate.ts` — the UX paywall layer
`gateFeature(feature)` calls the `check-usage-limit` edge function; if disallowed it fires the global upgrade modal and throws `UpgradeRequiredError`. `handleFeatureError(err)` centralizes every failure mode into the right UI: upgrade modal (`pro_only` / `limit_reached`), "verify your email" toast, "you already have a generation in progress" toast (`already_running`), or a generic error toast.

### `UpgradeModal` pub/sub pattern
`requestUpgrade(detail)` dispatches a `window` CustomEvent; the globally mounted `UpgradeModal` listens for it. Any code anywhere can open the paywall without prop drilling or extra context.

### Hooks
- `useSubscription` — reads the user's `subscriptions` row; derives `isActive` (status active AND period not expired) and `isPro`; exposes `refresh()`.
- `useIsIndia` — timezone/locale heuristic (`Asia/Kolkata`, `-in`) with `?region=IN|INTL` override; defaults to India. Gates Razorpay checkout availability.
- `useIsMobile`, `use-toast` — standard helpers.

---

## 7. The AI features — how each one actually works

The pattern for most features is: **deterministic math on the server + AI for the qualitative parts**. Scores are never left to the model alone; that's what makes results stable and defensible.

### Career Recommendations
1. Profile (skills, interests, goal, degree) is hashed → cache lookup (10 min TTL).
2. Concurrency slot acquired so one user can't fire five generations.
3. Gemini returns careers with `required_skills` each tagged `{category: core|secondary|optional, difficulty, is_critical}` — **the model is explicitly forbidden from inventing the match score**.
4. The server computes the score: skill match weighting + category weighting − critical-skill penalty (capped at 30). Salary is enforced in INR (₹ LPA).
5. Old rows deleted, new rows written to `career_recommendations` with the `input_hash`.

### Skill Gap Analysis
Union of required skills from top career recs is classified by Gemini, then matched against the user's profile skills through a **synonym map + normalization + fuzzy token matching** (so "Data Visualization" matches "Tableau/Power BI" style variants — this fixed the old false-"missing" bug). Industry weight tables per career family (frontend, backend, data-scientist, ML, devops, cybersecurity, …) determine the readiness score.

### Learning Roadmap
A hard-coded `SKILL_DEPENDENCIES` graph is topologically sorted (Kahn's algorithm) to produce foundation → intermediate → advanced ordering. That ordering is fed to Gemini, which fleshes out 6–12 steps with descriptions, resources, and time estimates. Steps land in `roadmap_steps`; toggling a step recomputes `completed_steps`/`progress` on `learning_roadmaps`.

### Resume Analysis
`parse-resume` downloads the stored file from the private `resumes` bucket and extracts text: **unpdf** for PDFs (with a regex fallback), **fflate** unzip of `word/document.xml` for DOCX, plain decode otherwise. Gemini parses it under a strict anti-hallucination prompt ("return only what is literally written"). Then `score-resume` **re-invokes `parse-resume` server-to-server** (so resume content is never trusted from the browser), computes a deterministic industry-alignment score, asks Gemini for an ATS score under a 30/25/25/20 rubric (keywords / formatting / impact metrics / action verbs), and blends: `final = 0.8 × AI ATS + 0.2 × industry alignment`.

### LinkedIn Analysis
`parse-linkedin` accepts a "Save to PDF" export (≤10 MB, magic-byte checked), extracts text with unpdf and splits headline/about/experience/skills by heading regex. `generate-linkedin-analysis` scores each section 0–100 and returns prioritized suggestions and keyword gaps.

### GitHub Analysis
Pulls real data from the GitHub REST API (repos, commits, READMEs). Deterministic sub-scores — commit consistency, tech diversity, project quality, documentation, deployment — combine at weights **0.25 / 0.20 / 0.25 / 0.15 / 0.15** into the portfolio score. Gemini then reviews up to 10 repos individually for complexity (1–10) plus strengths/weaknesses; if the AI call fails for a repo it silently defaults rather than failing the whole run.

### AI Interview Simulator (Pro only)
A stateful loop. The session row tracks `current_question_index`, `difficulty_level`, `topics_covered`, `weak_topics`, `follow_up_count`. Phase is derived from question count: warmup → core → deep_dive → scenario. The model appends a metadata sentinel block to each reply which the server parses to decide whether to escalate difficulty (on a strong answer) or de-escalate (on a weak one). Usage is metered **once per session, on the first turn**, not per message. `evaluate-interview` then scores five dimensions: clarity 25%, technical depth 25%, problem solving 20%, communication 15%, confidence 15%.

### Market Intelligence
Gemini returns trending/declining skills, salary by experience level, demand and competition levels, growth rate, top hiring cities and companies, and per-skill demand scores. The server computes the **market position score**: `0.7 × weighted coverage + 0.3 × raw coverage − declining-skill penalty (max 15)`, and buckets skill gaps into Critical / High / Medium by demand score.

### Career Readiness Report
Aggregates everything with `Promise.allSettled` and computes the headline number:

`final = 0.25×skills + 0.20×resume + 0.20×github + 0.20×market + 0.15×roadmap progress`

Gemini writes the narrative (summary, career fit, gap analysis, market read, portfolio review, short/mid/long-term action plan). The report is returned live, not persisted.

---

## 8. Edge functions reference

All live in `supabase/functions/`. All handle CORS preflight and return JSON.

### Shared modules (`_shared/`)

**`enforceUsage.ts`** — the real quota gate (service-role, unbypassable).
1. Blocks unverified emails (403 `email_unverified`).
2. Reads `subscriptions`; `isPro` = plan `pro` + status `active` + period not expired.
3. Pro bypasses all limits.
4. Hard Pro-only gate for `career-report` and `interview-session` (402 `pro_only`).
5. Free tier monthly limits: career-recommendations 1, skill-analysis 2, github-analysis 1, resume-analysis 2, linkedin-analysis 1, learning-roadmap 2, market-insights 2, project-suggestions 2, career-report 0.
6. Counts against `usage_counters` keyed by `(user_id, feature, period_start = 1st of UTC month)`; 402 `limit_reached` when exceeded; increments when `increment: true`.

**`aiGuard.ts`** — cost/concurrency guard.
- `hashInput` — SHA-256 of sorted-key JSON → deterministic cache key.
- `checkCache(table, userId, hash, ttl)` — returns a recent identical result instead of re-calling the model.
- `acquireSlot` / `releaseSlot` — `active_generations` row with a unique `(user_id, feature)` constraint; a second concurrent request fails the insert and gets a 429 `already_running` with a wait hint. Stale slots older than 120 s are cleared automatically.
- `enqueuePending` — writes to `pending_generations` for a future async worker (defined, not yet used).

**`promo.ts`** — price table (`monthly 49900 paise / yearly 399900 paise`) and `resolvePromoCode` (existence, active, expiry, `applies_to`, max redemptions, per-user duplicate, discount math for `percent` / `flat` / `free_extension` / `free_upgrade`).

### Function list

| Function | Auth | Purpose |
|---|---|---|
| `generate-career-recommendations` | JWT claims | Careers + server-computed match scores (cached, slotted) |
| `generate-skill-analysis` | JWT claims | Skill classification, readiness score (cached, slotted) |
| `generate-learning-roadmap` | JWT claims | Topologically ordered roadmap + steps |
| `generate-project-suggestions` | JWT claims | 4–6 portfolio projects |
| `parse-resume` | JWT claims | Storage download + PDF/DOCX text extraction + structured parse |
| `score-resume` | JWT claims | Re-parses server-side, blended ATS score, writes `resume_analysis` |
| `parse-linkedin` | JWT claims | Multipart PDF upload → text + sections (no AI, no writes) |
| `generate-linkedin-analysis` | JWT claims | Section scores, suggestions, keyword gaps |
| `analyze-github-profile` | JWT | GitHub API + per-repo AI review + portfolio score |
| `interview-chat` | JWT | Adaptive interview turn engine |
| `evaluate-interview` | JWT | Weighted 5-dimension scoring + feedback |
| `generate-market-insights` | JWT | Market data + market position score |
| `generate-career-report` | JWT | Consolidated Pro-only report |
| `check-usage-limit` | JWT | Client pre-check: `{allowed, remaining, plan, limit, reason}` |
| `create-razorpay-order` | JWT | Order creation or free-promo activation |
| `verify-razorpay-payment` | JWT | HMAC verification + Pro activation + promo redemption |
| `razorpay-webhook` | HMAC signature | Signed lifecycle events → `payment_events` + `subscriptions` |
| `cancel-razorpay-subscription` | JWT | Cancel at period end |
| `update-razorpay-subscription` | JWT | Downgrade to free (same underlying logic) |
| `validate-promo-code` | JWT | Pre-checkout promo preview, mutates nothing |
| `admin-promo-codes` | JWT + `is_admin` | Promo CRUD with strict validation |
| `get-referral-code` | JWT | `svc_get_or_create_referral_code` RPC |
| `apply-referral` | JWT | Zod-validated code → `svc_apply_referral` RPC |

**Models used**: `google/gemini-3-flash-preview` for most features; `google/gemini-2.5-flash` for LinkedIn analysis and market insights. All calls go through `https://ai.gateway.lovable.dev/v1/chat/completions` with `LOVABLE_API_KEY`, using **forced tool-calling** for schema-guaranteed JSON (the only exception is `interview-chat`, which uses a sentinel metadata block because it needs free-form conversational text).

**Standard error codes**: 401 unauthorized · 400 validation · 402 `pro_only` / `limit_reached` / AI credits exhausted · 403 `email_unverified` · 409 promo already used · 410 promo expired/exhausted · 429 rate limit or `already_running` · 500 server · 502 Razorpay upstream.

---

## 9. Database schema

26 tables in `public`. Every user-owned table follows the same pattern: `user_id` column, RLS `auth.uid() = user_id`, and an `input_hash` column on cacheable AI results.

### Identity
- **`profiles`** — `id` (= auth user id), full_name, education, college, degree, graduation_year, skills[], interests[], career_goal, resume_url, github_url, `is_admin`. Owner-only select/insert/update; no delete.

### AI results (owner-only CRUD)
`career_recommendations`, `skill_analysis`, `learning_roadmaps` → `roadmap_steps` (ownership via join), `project_suggestions`, `resume_analysis`, `linkedin_analysis`, `github_analysis` → `repo_analysis` (via join), `interview_sessions` → `interview_messages` (via join), `market_data`.

Admins **cannot** read other users' AI results — admin scope is deliberately limited to moderation/support.

### Orchestration (service-role writes only, owner read-only)
- **`active_generations`** — concurrency slots, unique `(user_id, feature)`.
- **`pending_generations`** — queued/failed jobs with payload, result, attempts.

### Billing (service-role writes only, owner read-only)
- **`subscriptions`** — one row per user: plan, status, provider, provider_customer_id, provider_subscription_id, billing_interval, currency, period start/end, cancel_at_period_end. Auto-seeded as `free/active/none` by a trigger on `auth.users`.
- **`usage_counters`** — unique `(user_id, feature, period_start)`.
- **`payment_events`** — webhook audit log, unique `(provider, event_id)` for idempotency, **explicit deny policy** (`SELECT … USING (false)`) so clients can never read it.

### Promos & referrals
- **`promo_codes`** — code, discount_type, discount_value, applies_to, max_redemptions, redemption_count, expires_at, active. Clients can read **active codes only**; writes are admin/service-role.
- **`promo_redemptions`** — unique `(promo_code_id, user_id)`; owner read; writes only through the `redeem_promo` function.
- **`user_referral_codes`** — one 8-char code per user.
- **`referrals`** — unique `referred_user_id`; both parties can read their own; explicit **deny** policies for client insert/update/delete.

### Community & support
- **`reviews`** — public can read `approved`, owners read their own, admins read all; users can only insert/update with status in (`approved`,`pending`) so they can't self-moderate; auto-approved on submit with admin reject capability.
- **`bug_reports`**, **`support_tickets`** — anonymous or authenticated insert; owners read their own; **admins** read all and update status.
- **`feedback`** — thumbs up/down per feature context.

### Storage buckets
- **`resumes`** — private; per-user folder isolation (`(storage.foldername(name))[1] = auth.uid()`); read via 5-minute signed URLs.
- **`bug-screenshots`** — private, same per-user folder isolation.

### Database functions
Public wrappers (service-role only): `svc_get_or_create_referral_code`, `svc_apply_referral`, `redeem_promo`.
Private schema: `private.is_admin`, `private.grant_pro_days`, `private.get_or_create_referral_code`, `private.apply_referral`, `private.prevent_is_admin_insert`, `private.prevent_is_admin_escalation`.
Triggers: `seed_free_subscription` on `auth.users`; `set_updated_at` on several tables; the two `is_admin` guard triggers on `profiles`; `reviews_set_updated_at`.

---

## 10. Security model

1. **RLS everywhere.** Every user table is scoped by `auth.uid()`; child tables verify ownership through a join to the parent.
2. **Private schema for privileged logic.** Sensitive `SECURITY DEFINER` functions live in `private`, which PostgREST does not expose. Execute is revoked from `anon`/`authenticated` — except `private.is_admin`, which must be callable so RLS policies can evaluate it.
3. **Service-role-only mutation** for anything financial or reward-bearing: `payment_events`, `subscriptions`, `usage_counters`, `promo_redemptions`, `referrals`, `active_generations`, `pending_generations`. Clients can at most read their own row.
4. **Explicit deny policies** as defense in depth (`payment_events` select `false`; `referrals` insert/update/delete `false`) so a future mis-granted privilege still can't open a hole.
5. **Privilege-escalation triggers.** `profiles.is_admin` is forced to `false` on insert and reverted on update — a user who owns their profile row still cannot make themselves admin.
6. **Payment integrity.** Signature verification uses constant-time comparison; amounts and billing periods are always recomputed server-side from the price table, never taken from the client; the pending order is bound to a `user_id` at creation so a payment can't be credited to another account.
7. **Anti-abuse economics.** Promo redemption is atomic under a `FOR UPDATE` row lock with per-user uniqueness; referrals are capped at 10 rewarded per referrer and one per referred user.
8. **AI input trust.** `score-resume` re-parses the resume server-side rather than accepting parsed data from the browser; missing-skill lists come from stored DB rows, not client input.
9. **Minimal anonymous surface.** `anon` can only insert bug reports / support tickets and read approved reviews.
10. **Email verification gate** before any AI feature runs.

---

## 11. Monetization: plans, limits, promo codes, referrals

### Plans
| | Free | Pro (₹499/month or ₹3999/year) |
|---|---|---|
| Career recommendations | 1/month | Unlimited |
| Skill analysis | 2/month | Unlimited |
| Learning roadmap | 2/month | Unlimited |
| Project suggestions | 2/month | Unlimited |
| Resume analysis | 2/month | Unlimited |
| LinkedIn analysis | 1/month | Unlimited |
| GitHub analysis | 1/month | Unlimited |
| Market insights | 2/month | Unlimited |
| AI Interview Simulator | ❌ | ✅ |
| Career Readiness Report | ❌ | ✅ |

Counters reset on the 1st of each UTC month (`period_start`).

### Promo codes (`/admin/promo-codes`)
Four types: `percent` (1–100), `flat` (paise off), `free_extension` (N free days), `free_upgrade` (one free cycle). Each has `applies_to` (monthly/yearly/any), optional `max_redemptions`, optional `expires_at`, and an active flag. Codes match `^[A-Z0-9_-]{3,40}$`. A fully-discounting code skips Razorpay entirely and activates Pro immediately; a partial-discount code is only marked redeemed **after** a successful payment.

### Referrals (`/referrals`)
Each user gets an 8-char code. Sharing `/signup?ref=CODE` stores the code in localStorage; on first successful session `apply-referral` runs. Both referrer and referred user receive **30 days of Pro** (`private.grant_pro_days` extends the existing period rather than overwriting). Guards: no self-referral, one referral per referred user, max 10 rewarded referrals per referrer (further ones record with 0 reward days so retries stop).

---

## 12. Razorpay payment flow end-to-end

The app uses **one-time orders** per billing period (not Razorpay's native recurring subscriptions), with code paths that still understand native subscription IDs.

1. **Create order** — `create-razorpay-order`
   - Free-promo path: `redeem_promo` RPC → upsert `subscriptions` to `pro/active` → return `{free: true}`. No Razorpay call.
   - Paid path: validates keys and amount, creates a Razorpay Order with `notes` containing `user_id`, `email`, `interval`, promo metadata; upserts `subscriptions` to `status: incomplete` with `provider_subscription_id = order_id`; returns `{order_id, amount, currency, key_id}`.
2. **Checkout** — the browser loads Razorpay Checkout.js on demand and opens the modal; on success it returns `order_id`, `payment_id`, `signature`.
3. **Verify** — `verify-razorpay-payment`
   - Recomputes `HMAC-SHA256(secret, "orderId|paymentId")` and compares in constant time.
   - Confirms the pending row belongs to the caller.
   - Re-fetches the order from Razorpay to recover promo notes and redeems the code.
   - Activates Pro: period end = now + 30 days or + 1 year based on the **stored** interval.
   - Records `payment.verified` in `payment_events` with duplicate-ignore idempotency.
4. **Webhook** — `razorpay-webhook` verifies the `x-razorpay-signature` HMAC, logs every event to `payment_events`, and maps `subscription.activated|charged` → active Pro, `subscription.cancelled|completed` → free/canceled, `subscription.halted|pending|payment.failed` → past_due. For the one-time-order model this is primarily an audit/reconciliation path.
5. **Cancel / downgrade** — `cancel-razorpay-subscription` / `update-razorpay-subscription`: `order_`-prefixed IDs simply set `cancel_at_period_end = true` locally (access lapses naturally at `current_period_end`, which `enforceUsage` re-checks on every call); real subscription IDs also call Razorpay's cancel endpoint with `cancel_at_cycle_end: 1`.

**Secrets involved**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (separate from the API secret), plus `RAZORPAY_PLAN_MONTHLY` / `RAZORPAY_PLAN_YEARLY` for the native-subscription path.

Payments are shown only to India-detected visitors (`useIsIndia`) unless a free promo applies.

---

## 13. AI cost & abuse controls

Layered defenses so a traffic spike or a malicious user cannot burn the AI budget:

1. **Server-side quotas** (`enforceUsage`) — cannot be bypassed by tampering with the client.
2. **Email verification** required before any generation.
3. **Input-hash caching** — identical inputs within 10 minutes return the stored result with `cached: true`, and **do not** consume a usage credit.
4. **Concurrency slots** — one in-flight generation per `(user, feature)`; duplicates get 429 `already_running` and a friendly toast instead of a second model call.
5. **Deferred increments** — several functions only increment the counter after the AI call succeeds, so failures don't cost the user a credit.
6. **Forced tool-calling** — schema-guaranteed JSON avoids retry loops from unparsable output.
7. **Graceful degradation** — per-repo GitHub AI failures fall back to defaults rather than failing the run.
8. **Gateway error surfacing** — 429 (rate limit) and 402 (credits exhausted) are passed through to clear user-facing messages, never hidden behind a fake AI answer.

---

## 14. Admin tooling

Admin = `profiles.is_admin = true` (set manually via SQL; not self-assignable).

- **`/admin/reviews`** — list all reviews, approve/reject. Reviews are auto-approved on submit; rejection is the moderation lever. The homepage marquee only renders when there are at least 6 approved reviews.
- **`/admin/inbox`** — bug reports and support tickets with status updates.
- **`/admin/promo-codes`** — create/update/delete promo codes with validation.

Granting Pro manually is done with a SQL upsert into `public.subscriptions` for the user's id.

---

## 15. SEO & performance

- `SEO.tsx` (react-helmet-async) sets title, description, canonical (`https://careerdecoder.work` + path), OG/Twitter tags, and optional JSON-LD per page.
- `index.html` carries the static head baseline plus `Organization` and `WebSite` JSON-LD, Google Search Console verification, and Supabase preconnect/dns-prefetch.
- `public/sitemap.xml`, `public/robots.txt`, `public/llms.txt`.
- Programmatic SEO content: career guides from `src/data/careers.ts` (`/careers/:slug`) and blog posts from `src/data/blog.ts` (`/blog/:slug`), surfaced on the landing page as second-click targets.
- Performance: manual vendor chunks, lazy routes, instant paint shell, single H1 per page, semantic HTML, responsive viewport.

---

## 16. Design system

- **Font**: Inter (300–800).
- **Tokens**: all colors are HSL CSS variables in `src/index.css` for light and `.dark` themes, mapped through `tailwind.config.ts` (`background`, `foreground`, `primary`, `card`, `muted`, `sidebar-*`, …). Components never hardcode hex or `text-white`.
- **Brand**: primary indigo `hsl(239 84% 67%)`; signature gradient `from-primary to-hsl(260 84% 60%)` used on the logo, nav, headings, and CTAs.
- **Radius**: `--radius: 0.75rem` (rounded-2xl card feel).
- **Charts**: legend-based layouts for pie/donut charts to avoid label overflow on mobile.
- **Components**: full shadcn/ui set, Radix primitives, `cn()` = clsx + tailwind-merge.

---

## 17. Operations runbook

**Environment / secrets** (Supabase → Edge Functions secrets): `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_MONTHLY`, `RAZORPAY_PLAN_YEARLY`.

**Auth configuration**: Site URL must be `https://careerdecoder.work` with production + preview + localhost redirect URLs added, otherwise verification links resolve to localhost.

**Common issues**
| Symptom | Cause / fix |
|---|---|
| Verification email links to localhost | Supabase Auth Site URL not set to production |
| "Verify your email" on a feature | `enforceUsage` email gate — user hasn't confirmed |
| 429 `already_running` | A generation for that feature is already in flight; wait ~2 min for the stale slot to clear |
| 402 `pro_only` / `limit_reached` | Working as designed — upgrade modal appears |
| Razorpay "Authentication failed" (502) | Test key used against live mode or vice versa |
| Reviews missing from homepage | Fewer than 6 approved reviews |
| Admin pages 403 | `profiles.is_admin` not set for that user |

**Debugging**: Supabase → Edge Functions → Logs per function; `payment_events` is the audit trail for every Razorpay callback.

---

## 18. Glossary / FAQ answers

**"Is the AI just making up scores?"** No. Every headline number — match score, readiness, portfolio score, market position, ATS, interview score, final readiness — is computed by deterministic weighted formulas in TypeScript on the server. The model supplies classification and prose only.

**"Can a user cheat the free limits?"** No. The client-side check is cosmetic; the authoritative gate runs inside each edge function with the service-role key against `usage_counters` and `subscriptions`.

**"Can a user make themselves admin or give themselves Pro?"** No. Database triggers revert `is_admin` changes, and `subscriptions` / `promo_redemptions` / `referrals` have no client write path at all.

**"Where is user data stored and who can see it?"** In Postgres with row-level security keyed to the signed-in user. Resumes are in a private storage bucket with per-user folder isolation and 5-minute signed URLs. Even admins cannot read other users' AI results.

**"What happens when a subscription expires?"** `enforceUsage` re-checks `current_period_end` on every call, so access reverts to Free the moment the period lapses — no cron job required.

**"What if the AI provider rate-limits us?"** 429 and 402 responses are surfaced as explicit user-facing messages; caching, concurrency slots, and quotas keep normal load well below limits.
