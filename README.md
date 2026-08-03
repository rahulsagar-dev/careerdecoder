# 🎯 Career Decode — AI-Powered Career Intelligence Platform

> Your personal AI career advisor that analyzes skills, recommends careers, simulates interviews, audits your LinkedIn/GitHub, and builds actionable roadmaps — all in one platform.

🌐 **Live:** [careerdecoder.work](https://careerdecoder.work)

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)](https://lovable.dev)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ecf8e)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%20Flash-4285f4)](https://deepmind.google/technologies/gemini/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-0d2366)](https://razorpay.com)

---

## 📋 What is Career Decode?

**Career Decode** is a full-stack AI career intelligence platform that helps students and professionals navigate their career journey with data-driven insights. It combines real-time market intelligence, personalized skill gap analysis, adaptive interview simulation, resume + LinkedIn + GitHub audits, and recruiter-level career reports into a single cohesive platform — powered by Google Gemini via the Lovable AI Gateway.

Whether you're a student figuring out your first role, a professional planning a career switch, or someone preparing for interviews — Career Decode gives you a structured, AI-guided path forward.

---

## ✨ Features

### 🤖 AI Career Recommendations
- Analyzes your skills, education, experience, and interests
- Generates 5–7 best-fit career matches with weighted match scores (0–100)
- Identifies missing skills and provides detailed gap analysis per role
- Career details with role description, salary insights, and growth trajectory

### 📊 Skill Gap Analysis
- Compares your current skills against industry requirements for target careers
- **Readiness score** (0–100) with weighted skill distribution
- Missing skills bucketed by priority (High / Medium / Low) with impact weights
- Synonym-aware matching (e.g., "Data Visualization" ↔ "Tableau", "py" ↔ "Python")

### 🗺️ Learning Roadmap
- Dependency-aware, step-by-step learning paths (6–12 steps)
- Kahn's algorithm topological sort for logical prerequisite ordering
- Per-step progress tracking with completion percentage
- Aligned portfolio project suggestions

### 📄 Resume Intelligence
- Upload PDF/DOCX; server-side parsing via `unpdf` + `fflate` in edge functions
- AI-extracted skills, experience, education, projects, certifications
- **ATS Score** (0–100) with strengths, weaknesses, and rewrite suggestions

### 🐙 GitHub Portfolio Analysis
- Public repo analysis via GitHub REST API
- Scored on commit consistency, tech diversity, documentation, and complexity
- Overall Portfolio Score (0–100) with actionable feedback

### 💼 LinkedIn Profile Analysis
- Upload your LinkedIn PDF export; parsed via `parse-linkedin` edge function
- Gemini-powered audit of headline, About, experience, skills, and consistency
- Concrete rewrite suggestions and profile optimization scores

### 🎙️ Adaptive Interview Simulator *(Pro only)*
- HR / Technical / Behavioral rounds with adaptive difficulty (Easy → Hard)
- 5-dimension scoring: Clarity, Depth, Problem Solving, Communication, Confidence
- Full session history with per-message topic tags and performance trends

### 📈 Market Intelligence
- Real-time demand, competition, and growth analysis for your target role
- Market Position Score comparing your skills vs. current market demand
- Strategic recommendations and emerging trend callouts

### 🧠 Career Path Graph
- Interactive React Flow (`@xyflow/react`) visualization of Skills → Careers → Projects → Steps
- Lock/unlock nodes based on mastered skills
- "Fastest" and "High-Impact" path optimization modes

### 📑 Career Readiness Report
- Recruiter-level AI report aggregating every signal on the platform
- 5-dimension assessment + 3-tier action plan (0–3 mo / 3–6 mo / 6–12 mo)
- Final Readiness Score with clean PDF export

### 📊 Analytics Dashboard
- Interview performance trends, skill distribution, roadmap completion
- Aggregated stats: Readiness %, Roadmap %, Interview Count, Avg Score

### 💳 Billing & Promo Codes
- **Razorpay** one-time orders for Pro Monthly (₹499) and Pro Yearly (₹3,999)
- Webhook-driven subscription sync into a provider-agnostic `subscriptions` schema
- Full promo-code engine: percent off / flat off / free extension days / free upgrade
- Server-side atomic redemption via `redeem_promo` RPC (single-use per user)
- 100%-off codes skip Razorpay entirely and activate Pro immediately

### 🎁 Free No-Signup Tools (lead magnets)
- `/free/ats-score` — instant ATS score with formatting / keyword / impact breakdown
- `/free/resume-insights` — extracted skills, experience level, and top matching roles
- Powered by the public `free-resume-score` edge function with IP-based rate limiting (2 runs/day)
- Blurred `LockedTeaser` sections convert visitors into signups

### 🔗 Referral Program
- Every user gets a shareable code (`/referrals`)
- Referrer + referred user each receive 30 days of Pro
- Rewards capped at 10 referrals per referrer to prevent farming
- Code minting and redemption run through `private` schema functions behind `get-referral-code` / `apply-referral` edge functions

### 📝 Content & SEO Engine
- Blog (`/blog`, `/blog/:slug`) and programmatic career guides (`/careers`, `/careers/:slug`)
- `react-helmet-async` `SEO` component: per-route title, description, canonical, OpenGraph (`og:type=article` on editorial routes), Twitter cards, JSON-LD
- `sitemap.xml`, `robots.txt`, `llms.txt`, Google Search Console verification

### ⚡ Performance
- Route-level code splitting (`React.lazy` + Suspense) — landing bundle ~194 KB gz
- Vite manual chunks (react / supabase / query / charts / flow)
- Instant-paint branded loading shell in `index.html`, Supabase preconnect

### ⭐ Community Reviews
- Users submit ratings + comments from `/leave-review`
- Reviews publish instantly; admins can reject/reset from `/admin/reviews`
- Auto-scrolling `ReviewsMarquee` on the landing page (unlocks at 6+ reviews)

### 🛠️ Admin Console
- `/admin/inbox` — triage bug reports and support tickets
- `/admin/reviews` — moderate the review wall
- `/admin/promo-codes` — CRUD promo codes with usage limits and expiry
- All gated behind `is_admin` (stored in a separate role-checked path with escalation triggers)


### 🔐 Auth & Account
- Email/password sign-up with mandatory email verification screen
- Forgot / reset password flow
- 5-step mandatory profile onboarding
- Cookie consent banner (compliance-only, no external analytics wired)
- Legal pages: Terms of Service, Privacy Policy

---

## 💰 Pricing

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | ₹0 | 1 career run · 2 resume analyses / mo · 2 skill gap / mo · 1 GitHub / mo · 1 LinkedIn / mo · basic market intel |
| **Pro Monthly** | ₹499 / mo | Everything unlimited · **AI Interview Simulator (Pro exclusive)** · full market intel · PDF export · priority support |
| **Pro Yearly** | ₹3,999 / yr | Same as Pro, save ~33% |

Payments are India-only (Razorpay) for now. Schema is provider-agnostic so Stripe can be added later without a rewrite.

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React 18)                     │
│  Pages · ShadCN UI · React Query · React Router · Helmet     │
│               TypeScript + Tailwind CSS 3                    │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTPS / JWT
┌──────────────────────────▼───────────────────────────────────┐
│                     Supabase Backend                         │
│   Auth (GoTrue) · PostgreSQL + RLS · Storage · Realtime      │
│   ┌────────────────────────────────────────────────────────┐ │
│   │        Deno Edge Functions (25 functions)              │ │
│   │  AI · Razorpay · Promo redemption · Usage enforcement  │ │
│   └────────────────────────────────────────────────────────┘ │
└─────────┬────────────────────────────────────────┬───────────┘
          │ Lovable AI Gateway                     │ Razorpay API
┌─────────▼──────────────┐            ┌────────────▼───────────┐
│  Google Gemini Flash   │            │  Razorpay Orders +     │
│  JSON-mode generation  │            │  Webhooks (HMAC-SHA256)│
└────────────────────────┘            └────────────────────────┘
```

### Reliability & cost controls
- `_shared/aiGuard.ts` — SHA-256 input hashing → response cache + concurrency dedup (prevents duplicate spend on the same prompt)
- `_shared/enforceUsage.ts` — server-side per-plan usage counters; increments only on success; hard 402 gate on Pro-only features; email-verification gate
- `_shared/promo.ts` — deterministic discount math shared by validation + order creation
- Response caching so retries and stale-tab clicks don't re-bill the AI gateway

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite 5, Tailwind CSS 3, ShadCN UI |
| **State** | TanStack React Query |
| **Routing / SEO** | React Router v6, react-helmet-async, JSON-LD, sitemap.xml, robots.txt, llms.txt |
| **Charts / Graph** | Recharts, `@xyflow/react` |
| **Backend** | Supabase (Auth, PostgreSQL, Storage, Realtime, Edge Functions) |
| **AI** | Google Gemini Flash via Lovable AI Gateway (JSON tool calling) |
| **Payments** | Razorpay one-time orders + webhook (HMAC-SHA256) |
| **Runtime** | Deno (Supabase Edge Functions) |
| **Testing** | Vitest, Playwright, Testing Library |

---

## 🔌 Edge Functions

| Function | Purpose |
|----------|---------|
| `generate-career-recommendations` | AI career matching |
| `generate-skill-analysis` | Skill gap + readiness score |
| `generate-learning-roadmap` | Roadmap generation |
| `generate-project-suggestions` | Portfolio project ideas |
| `parse-resume` / `score-resume` | Resume parse + ATS scoring |
| `parse-linkedin` / `generate-linkedin-analysis` | LinkedIn PDF audit |
| `analyze-github-profile` | GitHub portfolio scoring |
| `interview-chat` / `evaluate-interview` | Adaptive interview + evaluation |
| `generate-market-insights` | Market demand analysis |
| `generate-career-report` | Final recruiter-level report |
| `create-razorpay-order` | Order creation with promo application + free-path activation |
| `verify-razorpay-payment` | Signature verification + subscription activation + promo redemption |
| `razorpay-webhook` | Idempotent event ingestion (`payment.captured`, `order.paid`, etc.) |
| `cancel-razorpay-subscription` / `update-razorpay-subscription` | Billing lifecycle |
| `validate-promo-code` | Frontend price preview |
| `admin-promo-codes` | Admin CRUD for promo codes |
| `check-usage-limit` | Frontend feature-gate lookups |
| `free-resume-score` | Public, no-auth ATS scoring for the free tools (IP rate-limited) |
| `get-referral-code` / `apply-referral` | Referral code minting and reward redemption |

All AI functions run through the Lovable AI Gateway with JSON-mode structured output, protected by the shared `aiGuard` cache/dedup layer.

---

## 🗄️ Database Schema (highlights)

User data (all RLS-scoped to `auth.uid()`):
`profiles`, `career_recommendations`, `skill_analysis`, `learning_roadmaps`, `roadmap_steps`, `resume_analysis`, `github_analysis`, `linkedin_analysis`, `interview_sessions`, `interview_messages`, `market_data`, `project_suggestions`, `repo_analysis`, `usage_counters`, `support_tickets`, `bug_reports`.

Billing & growth (service-role only):
`subscriptions`, `payment_events`, `promo_codes`, `promo_redemptions`, `reviews`.

### Security posture
- RLS enabled on every user-facing table with `auth.uid()`-scoped policies
- Explicit `GRANT`s to `authenticated` / `service_role`; no ambient `public` access
- `is_admin` helper moved to a `private` schema; `EXECUTE` revoked from `anon`/`authenticated`
- `is_admin` escalation blocked by `BEFORE INSERT/UPDATE` triggers
- Roles stored in a dedicated table (never on `profiles`)
- Razorpay webhooks verified with local HMAC-SHA256; secrets whitespace-hardened
- Promo redemption is atomic via `redeem_promo` RPC (service-role only)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20 LTS (or bun)
- A **Supabase** project
- A **Lovable** account for AI Gateway access
- A **Razorpay** account (test or live) if you want payments

### Installation

```bash
git clone https://github.com/your-username/career-decode.git
cd career-decode
npm install     # or: bun install
npm run dev     # or: bun dev
```

App runs at `http://localhost:8080`.

### Environment Variables

`.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Edge Function Secrets** (Supabase Dashboard → Project Settings → Secrets):

| Secret | Purpose |
|--------|---------|
| `LOVABLE_API_KEY` | Lovable AI Gateway (all AI functions) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations from edge functions |
| `RAZORPAY_KEY_ID` | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Razorpay private key |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook HMAC verification |

### Supabase Auth URLs

In **Authentication → URL Configuration**, set:
- **Site URL:** your production domain (e.g. `https://careerdecoder.work`)
- **Redirect URLs:** production, preview, and `http://localhost:8080/**`

### Razorpay Webhook

Point Razorpay webhook to:
```
https://<project>.supabase.co/functions/v1/razorpay-webhook
```
Subscribed events: `payment.captured`, `payment.failed`, `payment.authorized`, `order.paid`.

---

## 🧪 Testing

```bash
npm run test               # unit tests (Vitest)
npm run test:watch
npx playwright test        # E2E
```

---

## 🤝 Contributing

1. Fork → feature branch → PR
2. Follow TypeScript strict mode; Tailwind + ShadCN UI only
3. Add RLS + GRANTs for any new public-schema table
4. Document new edge functions in this README

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

## 🙏 Acknowledgments

- [Lovable](https://lovable.dev) — AI-powered full-stack development
- [Supabase](https://supabase.com) — Auth, Postgres, Storage, Edge Functions
- [Google Gemini](https://deepmind.google/technologies/gemini/) — AI model
- [ShadCN UI](https://ui.shadcn.com) — accessible React components
- [Razorpay](https://razorpay.com) — payments

---

<p align="center">
  Built with ❤️ for job-seekers · <a href="https://careerdecoder.work">careerdecoder.work</a>
</p>
