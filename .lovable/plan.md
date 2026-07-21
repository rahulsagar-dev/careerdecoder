# 30-Day Growth Plan for Career Decoder

Based on your analytics: 209 visitors/wk, 78% bounce, 455 pageviews, only 6 hits on /pricing, mostly Direct traffic. That tells us: people arrive, don't understand the value fast enough, and don't discover pricing. Fix conversion first (compounds every other channel), then bring more traffic.

---

## Week 1 — Conversion fixes (biggest ROI on existing traffic)

Goal: cut bounce from 78% → ~55%, get more people from `/` to `/signup` and `/pricing`.

1. **Landing hero rewrite** (`src/pages/Landing.tsx`)
   - Replace "Decode Your Career with AI" with an outcome-led headline: e.g. *"Land your next role — AI-decoded resume, skill gaps, and interview prep in one place."*
   - Sub-headline names the 5 concrete features + "Free to start, ₹499/mo Pro".
   - Two CTAs above the fold: **Get Started Free** + **See how it works** (scrolls to a 30-sec demo GIF/video).

2. **Add social proof above the fold**
   - "Trusted by X professionals" counter (real number from `profiles` table).
   - Move the `ReviewsMarquee` higher (currently below "How It Works").
   - Add 3 outcome stats: e.g. "Resumes analyzed", "Interviews simulated", "Skills mapped".

3. **Product demo section** — 20–40 sec screen-capture GIF of resume upload → analysis → roadmap. Single most powerful bounce killer.

4. **Pricing visibility**
   - Add a "Pricing" link to the top nav (only /pricing had 6 views — people can't find it).
   - Add a "Free forever plan available" strip above the hero CTAs.

5. **Signup friction**
   - Landing → Signup is where you'll lose most people. Add a "no credit card, 30 seconds" microcopy near the CTA.

## Week 2 — SEO foundation

Goal: start ranking for long-tail career queries. Semrush data is available if you want me to research specific keywords in your niche.

1. **Blog / content routes** — add `/blog` with 6 seed articles (MDX or Supabase-backed):
   - "How to write a resume for a data analyst job in 2026"
   - "Top 10 skill gaps for aspiring product managers"
   - "AI mock interview questions for software engineers (with sample answers)"
   - "How ATS scoring actually works"
   - "LinkedIn profile optimization checklist"
   - "Career switch to tech from non-tech — a 6-month roadmap"
   Each 1200–1800 words, targets one keyword, ends with CTA to the matching feature.

2. **Per-page SEO** — `SEO.tsx` is already there. Add unique title/description/JSON-LD to every feature page (currently many share generic tags).

3. **Internal linking** — link from blog posts → feature pages → signup. Right now the site has almost no internal link graph.

4. **Programmatic SEO (stretch)** — templated pages like `/careers/data-analyst`, `/careers/product-manager` (top 30 roles). Auto-generated from your existing career recommendations schema. Huge long-tail win.

## Week 3 — Distribution launches

Goal: 3–5 traffic spikes, ideally one converts to a steady channel.

1. **Product Hunt relaunch** — you already had 2 hits from PH. Do a proper launch: hunter, 5 assets, launch on Tuesday IST-friendly time (12:01 AM PT). Prep a comment thread with founder story.

2. **LinkedIn (highest fit for your audience)** — 3 posts/week for 3 weeks:
   - Founder story (why you built it)
   - "I analyzed 100 resumes — here's what I found" (screenshots)
   - Free tool teaser + link
   Post from your personal profile; company pages get 5% the reach.

3. **Reddit** — genuine value posts (not spam) in r/developersIndia, r/JobHuntingHacks, r/resumes, r/csMajors. Answer questions, mention tool only when relevant.

4. **India campus outreach** — 74/209 visitors are IN. DM 20 college placement cells / T&P officers offering free Pro for their students. Referral loop starts here.

5. **Referral program** — extend the existing promo code system: every user gets a code that grants them +30 days when someone signs up with it. You already have `promo_codes` + `redeem_promo` — this is a small addition.

## Week 4 — Measure & double down

1. **Add funnel tracking** — right now analytics shows visits but not signup rate. Add PostHog or lightweight event logging: `landing_view`, `signup_start`, `signup_complete`, `first_analysis`, `pro_upgrade`.
2. Look at which Week 1–3 change moved bounce/signup most. Kill the losers, double budget on the winner.
3. **Email nurture** — anyone who signs up but doesn't run an analysis in 3 days gets one email with a demo link. You already have Lovable Cloud, this is one edge function + cron.

---

## What I'd build in code (once you approve)

Only the items that require code, in priority order:

1. Rewrite `src/pages/Landing.tsx` hero + add demo + move reviews up + add stats strip.
2. Add `/blog` route with MDX (or a `posts` table + list/detail pages) and seed 2 posts as templates.
3. Programmatic `/careers/[slug]` pages.
4. Referral extension of promo codes (share link → auto-generated code).
5. Funnel event logging table + hooks.

The distribution work (Product Hunt, LinkedIn, Reddit, campus DMs) is on you — I can draft the copy for each if useful.

---

## Technical notes

- Semrush tools are available; I can pull real keyword volumes/difficulty for the 6 blog topics before writing anything, so we target things you can actually rank for.
- `careerdecoder.work` Authority Score is likely <20 (new domain) — expect 2–3 months before SEO traffic materializes. That's why distribution runs in parallel.
- Bounce rate on `/` will drop most from the demo GIF, not from copy changes. Prioritize recording that.

Approve this plan and I'll start with Week 1 (Landing rewrite + demo section + pricing nav link + social proof reordering).
