# Free No-Signup Tools (Lead Magnets)

Goal: let a first-time visitor get real value in under 60 seconds without creating an account, then hit a natural "sign up to unlock the rest" moment. This targets the 82% bounce rate directly — right now every useful thing on the site is behind `/login`.

## What gets built

Two public tools, both reachable from the hero and the nav:

### 1. Free ATS Resume Score — `/free/ats-score`
- Drag-and-drop a PDF/DOCX resume, no account, no email required.
- Runs the same parsing + ATS scoring engine the paid product uses.
- **Shown free:** overall ATS score (0–100) with a visual gauge, 3 sub-scores (formatting/parseability, keyword coverage, impact & metrics), the top 3 detected skills, and 2 concrete fixes.
- **Locked behind signup:** the full fix list, missing-keyword list, section-by-section rewrite suggestions, and saving the result. Rendered as a blurred/teaser card with a "Create free account to unlock" button.

### 2. Free Resume Insights — `/free/resume-insights`
- Same upload (a single upload flow shared with the tool above — results page shows both tabs).
- **Shown free:** detected skills, experience level estimate, top 3 career matches with a match %, and a one-line "what your resume says about you" summary.
- **Locked behind signup:** full career match list with salary ranges, skill-gap breakdown, and the learning roadmap.

Both tools end with the same conversion block: "Save this report + get your skill gap, roadmap and mock interviews — free account".

## Anti-abuse (important — these are unauthenticated AI calls)

- New `anon_tool_usage` table keyed on a hashed IP + day. Limit: **2 free runs per IP per 24h**, enforced server-side in the edge function (service-role writes only, no client policies — same fail-closed pattern as `usage_counters`).
- Hard file limits: 2 MB, PDF/DOCX only, rejected server-side.
- Extracted text truncated before it reaches the model, and the input-hash cooldown from `aiGuard.ts` is reused so identical resumes don't re-bill.
- Results are returned in the response and held in browser memory/sessionStorage only — nothing anonymous is written to `resume_analysis`. When the visitor signs up, the client re-posts the stored result so their first dashboard is already populated.

## Entry points

- Hero: secondary CTA becomes "Check your ATS score free — no signup".
- Nav: "Free Tools" link.
- Blog posts (`how-ats-scoring-works` especially) and the career guides get an inline CTA card into the tool.
- Both pages get their own SEO title/description, JSON-LD, and sitemap entries — "free ATS resume checker" is a high-intent search term worth ranking for.

## Technical notes

- New edge function `free-resume-score` with `verify_jwt = false`, which: validates the upload, extracts text with the existing `unpdf`/`fflate` path from `parse-resume`, checks the IP-based limiter, calls the model, and returns a trimmed public payload (it never returns the locked fields, so the paywall can't be bypassed from devtools).
- Scoring logic in `score-resume/index.ts` (synonyms, industry weights, dependency graph) is extracted into `_shared/resumeScoring.ts` so both the authed and anonymous paths use one implementation.
- New pages `src/pages/FreeAtsScore.tsx` and `src/pages/FreeResumeInsights.tsx`, lazy-loaded in `AppRoutes.tsx` as public routes, sharing an `src/components/free/ResumeDropzone.tsx` and a `LockedTeaser.tsx`.
- One migration: `anon_tool_usage` table with grants (`service_role` only), RLS enabled, no client policies.

## Out of scope for now

- No email capture gate (asking for an email before showing the score kills the conversion the tool is meant to create).
- No anonymous LinkedIn or GitHub tool yet — resume is the highest-intent entry point; add a second tool once this one shows traffic.
