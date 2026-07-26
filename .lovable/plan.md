# Reduce Bounce Rate — Landing Page Plan

Current: 69% bounce, 236 views on `/`, mostly Direct + mobile-heavy (107/286), India-heavy (122). Most visitors leave `/` without a second pageview. Fixes below target the "what is this and why should I care in 5 seconds" gap.

## What to change

### 1. Above-the-fold clarity (highest impact)
- Replace the abstract gradient blob with a **real product screenshot** (resume analysis result or skill-gap chart). Visitors need to see the product, not a glowing brain.
- Shrink hero vertical padding on mobile — right now the CTA is often below the fold on phones (107 mobile visits).
- Move the "Free forever · No card" chip into the CTA button subtext, tighten headline to one line on desktop.

### 2. Interactive proof, not just claims
- Add a **"Try a sample analysis"** button in the hero that opens a modal with a pre-filled example resume → shows the actual analysis output. No signup required. This is the single biggest bounce killer for tool sites.
- Alternative if too heavy: a 15-sec autoplay muted MP4/GIF loop of resume upload → score → roadmap, right next to the headline.

### 3. Reorder the page for scanners
- Current order: Hero → Stats strip → Reviews → Features → How it works → CTA.
- New order: Hero (with product visual) → **Features grid** (so scanners immediately see the 5 tools) → How it works → Reviews → Stats → CTA.
- Rationale: visitors bounce because they don't know what the product *does*. Features must come before social proof.

### 4. Mobile-first fixes
- Reduce hero `py-20 md:py-28` → `py-10 md:py-24`.
- Stack CTAs full-width on mobile with a visible primary + ghost secondary.
- Ensure the Navbar "Pricing" and "Login" links are reachable in the mobile menu (verify).

### 5. Exit-friction: internal linking from `/`
- Add a **"Popular career guides"** strip linking to 4–6 `/careers/[slug]` pages (data analyst, product manager, SWE, data scientist, designer, marketer). Gives bouncers a second click and helps SEO internal graph.
- Add a **"From the blog"** 3-card row linking to seeded posts.

### 6. Trust signals near the CTA
- Add a tiny row under the primary CTA: "🇮🇳 Built for Indian job market · ₹ pricing · UPI accepted" (122/286 visitors are IN).
- Add a live count "X professionals decoded their career this week" pulled from `profiles` created in last 7 days (real, not fake).

### 7. Perceived speed
- Preload the hero screenshot; lazy-load everything below the fold.
- Confirm no layout shift from `ReviewsMarquee` mounting.

## Out of scope (won't touch)
- Auth, payments, edge functions, DB schema.
- Pricing, dashboard, feature pages.
- Any AI/edge-function logic.

## Files to edit
- `src/pages/Landing.tsx` — reorder sections, new hero, add popular careers strip, blog strip, IN trust row.
- `src/components/layout/Navbar.tsx` — verify mobile menu has Pricing/Login (only if broken).
- New: `src/components/landing/PopularCareers.tsx`, `src/components/landing/BlogTeaser.tsx`, `src/components/landing/SampleAnalysisModal.tsx` (or a `HeroDemo.tsx` for the GIF version).
- New asset: `src/assets/landing-hero-screenshot.png` (generated) OR `public/landing-demo.mp4`.

## Decision needed before build

Pick **one** for the hero visual — the rest of the plan stays the same:

- **A. Static product screenshot** (fastest, ships today). Generated image of the resume-analysis result card.
- **B. Autoplay looping demo video/GIF** (highest bounce impact, needs a ~15s screen recording — I'd generate a stylized MP4).
- **C. Interactive "Try sample analysis" modal** (biggest conversion lift, ~half a day of work, no signup required, uses a hardcoded sample).

## Technical notes
- No backend changes. All edits are presentation-layer in `src/pages/Landing.tsx` and new components under `src/components/landing/`.
- "Popular careers" and "From the blog" pull from existing `src/data/careers.ts` and `src/data/blog.ts` — no new data sources.
- Live signup count: single Supabase `count` query on `profiles` with `created_at > now() - 7 days`, cached client-side for the session.
