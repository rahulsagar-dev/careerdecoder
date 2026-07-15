
# LinkedIn Analysis Feature — Full Plan

Mirrors the existing Resume Analysis + GitHub Analysis patterns. User uploads their own LinkedIn "Save to PDF" export (ToS-safe), we parse it, and generate an AI analysis with strengths, weaknesses, and improvement suggestions.

## 1. User Flow

1. User navigates to `/linkedin-analysis` (new sidebar entry between Resume Analysis and GitHub Analysis).
2. Page shows:
   - Instructions panel: "How to export your LinkedIn PDF" — Profile → **More** → **Save to PDF** (current LinkedIn UI, verified).
   - Upload dropzone (PDF only, ≤10MB).
   - Privacy note: "Your LinkedIn PDF is processed to generate this analysis and is not shared with third parties. The file is discarded after parsing unless you enable history."
3. On upload → `parse-linkedin` edge function extracts text → `generate-linkedin-analysis` edge function produces structured analysis → saved to `linkedin_analysis` table → rendered as cards.
4. Past analyses list (like Resume Analysis history), with delete option.
5. Feature is gated behind `check-usage-limit` (`linkedin-analysis`, 1 free/month, unlimited on Pro), enforced server-side via `enforceUsage.ts`.

## 2. Database Schema (one migration)

**New table: `linkedin_analysis`**

Fields (domain-specific):
- `user_id` — owner
- `headline_score`, `about_score`, `experience_score`, `skills_score`, `overall_score` — 0-100
- `strengths` — jsonb array
- `weaknesses` — jsonb array
- `suggestions` — jsonb array (each with title, description, priority)
- `keyword_gaps` — jsonb array (missing keywords vs target career)
- `parsed_text` — text (raw extracted text, for debugging/regeneration)
- `target_career` — text (optional, from profile)
- Standard: id, created_at, updated_at

**Access rules (RLS):**
- Users can view/insert/update/delete only their own rows (`auth.uid() = user_id`).
- `service_role` full access for edge functions.

**Usage counter:** No schema change — reuses existing `usage_counters` table with `feature = 'linkedin-analysis'`.

**No new storage bucket.** PDFs are parsed in-memory in the edge function and never persisted (matches the privacy note). If the user later wants history of the raw file, we can add a private `linkedin-pdfs` bucket in a follow-up.

## 3. Edge Functions

Three new functions, all `verify_jwt` default (JWT-required):

### `parse-linkedin`
- Accepts `multipart/form-data` PDF upload.
- Server-side validation: MIME `application/pdf`, size ≤10MB (matches resume audit).
- Extracts text using **`unpdf`** (already used in `parse-resume` — Deno-compatible, works in edge runtime). Does NOT use `pdf-parse` (Node-only).
- Returns `{ text, sections: { headline, about, experience, skills, education } }` — best-effort section splitting via heading regex.
- Rate limit: enforced via `enforceUsage(userId, 'linkedin-analysis', { increment: false })` — pre-check only, real increment happens in generate step.

### `generate-linkedin-analysis`
- Body: `{ parsedText, sections, targetCareer? }`.
- Calls `enforceUsage(userId, 'linkedin-analysis', { increment: true })` — atomic server-side gate.
- Calls Lovable AI (`google/gemini-2.5-flash`) with a structured-output prompt returning:
  ```
  { overall_score, headline_score, about_score, experience_score, skills_score,
    strengths[], weaknesses[], suggestions[{title, description, priority}],
    keyword_gaps[] }
  ```
- Uses the user's profile's target career (from `profiles.target_career` or `career_recommendations`) to tailor keyword gaps.
- Inserts row into `linkedin_analysis`, returns saved row.

### (no third function) 
Delete/list operations happen via direct Supabase client from the frontend under RLS — matches the pattern used by `resume_analysis`.

## 4. Frontend

### New page: `src/pages/LinkedInAnalysisPage.tsx`
- Layout matches `ResumeAnalysisPage`:
  - Header + instructions accordion
  - Upload card (react-dropzone) with client-side MIME/size check (defense in depth; server is authoritative)
  - Progress states: uploading → parsing → analyzing → done
  - Results view: score cards (overall + 4 sub-scores), strengths/weaknesses lists, prioritized suggestions, keyword gaps chips
  - Past analyses list with delete
- Wrapped with paywall error handling via `handleFeatureError` from `featureGate.ts` (opens `UpgradeModal` on limit/pro-only).

### New service: `src/services/linkedinService.ts`
- `uploadAndParse(file)` → invokes `parse-linkedin`
- `generateAnalysis(parsed, targetCareer)` → invokes `generate-linkedin-analysis`
- `listAnalyses()`, `deleteAnalysis(id)` → direct Supabase queries

### Route & nav
- Add `/linkedin-analysis` to `AppRoutes.tsx` under `<ProtectedRoute>`.
- Add sidebar entry in `DashboardLayout.tsx` between "Resume Analysis" and "GitHub Analysis" (Linkedin icon from lucide-react).

### Feature gating
- Added to `FREE_LIMITS` in both `check-usage-limit/index.ts` and `_shared/enforceUsage.ts` as `'linkedin-analysis': 1`.
- Frontend uses `gateFeature('linkedin-analysis')` for UX preview; server enforces atomically.

## 5. Security & Privacy

- Server-side MIME + size validation in `parse-linkedin` (matches recent audit fixes for resume/bug-screenshots).
- No persistent storage of the raw PDF.
- RLS on `linkedin_analysis` scoped to `auth.uid() = user_id`.
- All AI calls server-side; `LOVABLE_API_KEY` never exposed.
- CORS headers on both new functions.

## 6. Out of Scope (explicit)

- Scraping LinkedIn — forbidden by ToS.
- Storing the uploaded PDF — deferred until user opts into history.
- Comparing two users' profiles — not requested.

## 7. Files Touched

**New:**
- `supabase/functions/parse-linkedin/index.ts`
- `supabase/functions/generate-linkedin-analysis/index.ts`
- `src/pages/LinkedInAnalysisPage.tsx`
- `src/services/linkedinService.ts`
- 1 migration (creates `linkedin_analysis` table + grants + RLS)

**Modified:**
- `src/routes/AppRoutes.tsx` — new route
- `src/components/layout/DashboardLayout.tsx` — sidebar entry
- `supabase/functions/_shared/enforceUsage.ts` — add limit
- `supabase/functions/check-usage-limit/index.ts` — add limit

## 8. Verification

- Upload a sample LinkedIn PDF → confirm text extracts and analysis renders.
- Try uploading a non-PDF → server rejects with 400.
- Upload as free user twice in a month → second attempt opens `UpgradeModal`.
- Pro user → unlimited.
- Delete an analysis → row disappears (RLS enforced).

Approve to build.
