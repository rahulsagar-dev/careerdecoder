＃ Why bounce is still 75%+

I checked the live site and the analytics you're looking at. The landing copy is not the main problem anymore — **load time and a blank first screen are.**

## What I measured (facts, not guesses)

1. **One giant JS bundle: 478 KB compressed** (`/assets/index-DgOJWN6g.js`, ~1.6 MB unpacked). Every route is imported eagerly in `src/routes/AppRoutes.tsx` — dashboard, React Flow career graph, Recharts analytics, markdown renderer, admin pages — all download **before the landing page can paint**. On a mid-range Indian 4G phone that's roughly 4–8 seconds of white screen.
2. **The HTML is empty.** `index.html` ships 2.5 KB with `<div id="root"></div>` and no fallback markup — so until that 478 KB parses, a visitor literally sees nothing. Most bounces happen inside 3 seconds.
3. **The second-click strips aren't earning clicks.** Top pages are `/` (251), `/signup` (53), `/login` (49), `/support` (23) — `/careers` and `/blog` don't appear in the top 10 at all, even though both strips are on the landing page. They sit too far down (after Reviews + Stats) for mobile visitors.
4. **A chunk of your "bounce" is bots.** 84 Unknown + 14 CN + 4 MD + 2 RU countries, plus a `temp-mail.org` referrer. Days with 3–7 visitors show 100% bounce — those are scrapers, and they drag the average up regardless of what we build.
5. **Head metadata mismatch.** `index.html` still says "Career Decode — AI-Powered Career Guidance" while the React Helmet title says "Career Decoder — AI Resume Score…". The `og:image` points at an old Lovable preview screenshot URL, so link shares look off-brand.

## The fix, in priority order

### 1. Route-level code splitting (biggest win)
Convert every route in `AppRoutes.tsx` to `React.lazy` + a `<Suspense>` fallback, keeping only `Landing` eager. Expected result: landing bundle drops from ~478 KB to well under 150 KB compressed. Heavy libraries (`@xyflow/react`, `recharts`, `react-markdown`, `jspdf`-style exports) stop loading for people who never log in.

### 2. Instant paint shell
Put a lightweight branded loading state directly in `index.html` (logo + headline skeleton, inline CSS, no JS) so the screen is never blank. Add manual Vite chunking so React/Supabase/UI vendor code cache separately across visits.

### 3. Restructure for the 3-second scan
- Move **Popular Careers** directly under the Features grid — it's the highest-intent second click and currently gets zero traffic buried at position 6.
- Collapse **Reviews + Stats** into one trust block after How It Works.
- Blog teaser stays near the footer.
- Add 3–4 inline text links inside the hero subcopy area ("Data Analyst · Product Manager · Software Engineer guides →") so there's a clickable exit above the fold that isn't signup.

### 4. Lower the commitment on the primary CTA
Right now the only action is "Analyze my resume — free" → `/signup`, a wall. Add a secondary above-the-fold path that delivers value with zero auth: a free **"Check your resume keywords"** teaser or a link straight into a career guide. Every visitor who isn't ready to create an account currently has nowhere to go but back.

### 5. Fix head metadata + filter noise
- Sync `index.html` title/description/og with the Helmet values; replace the stale `og:image` R2 URL.
- Preconnect to the Supabase origin so the first auth check doesn't block.
- Note in reporting that Unknown/CN/MD/RU traffic is bot noise — judge progress on the IN + US segment, not the blended number.

## What I won't touch
Auth, payments, edge functions, DB schema, AI logic, pricing. This is presentation + bundling only.

## Files to change
- `src/routes/AppRoutes.tsx` — lazy routes + Suspense fallback.
- `vite.config.ts` — manual vendor chunks.
- `index.html` — paint shell, metadata sync, preconnect.
- `src/pages/Landing.tsx` — section reorder, hero inline career links, secondary no-auth CTA.
- `src/components/landing/PopularCareers.tsx` — minor spacing after the move.

## Expected outcome
Realistically 75% → high-50s/low-60s on the real (non-bot) segment. Load time is the single biggest lever left; copy changes alone won't move it further.
