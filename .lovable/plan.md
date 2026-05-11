## Issues found

1. **"Failed to create profile"** — `ProfileSetup` always does INSERT. The logged-in user (`17simranrajpoot@gmail.com` → Kajal Rajpoot) already has a profile row, so INSERT throws a duplicate-key error. There is no guard that detects an existing profile and redirects.

2. **No "Go back" / update path for existing users** — Once a profile exists, ProfileSetup has no exit, and there is no way to use this 5-step wizard to *update* an existing profile.

3. **Resume "View Resume" link broken (404 "Bucket not found")** — Two separate problems combined:
   - The `resumes` bucket is **private**, but old data has a hard-coded **public** URL (`/storage/v1/object/public/resumes/...`) that returns 404.
   - New uploads now save just the file *path* (e.g. `userId/resume.pdf`), but `Profile.tsx` renders it directly inside `href`, which is also not a valid URL for a private bucket.

4. **Skill ↔ job-post comparison broken (Market Position = 0%)** — `MarketIntelligencePage.generate()` calls `marketService.generateInsights(role)` **without passing the user's skills**, so the edge function compares against an empty array → coverage = 0 → score = 0.

## Plan

### A. Fix ProfileSetup for existing users
- On mount, fetch existing profile.
  - If a profile exists → pre-fill the form from it and switch to **update mode** (`profileService.updateProfile` instead of `createProfile`).
  - Update title to "Update your profile" and submit button to "Save changes".
- Add a **"Back to Dashboard"** button in the header of `/profile/setup` (always visible) so existing users can leave the wizard at any time.
- Make Step 4 resume upload optional in update mode — keep existing resume if no new file uploaded.

### B. Fix resume link (private bucket → signed URL)
- Add `profileService.getResumeSignedUrl(pathOrUrl)` that:
  - If value looks like a full Supabase public URL, extract the object path after `/resumes/`.
  - Call `supabase.storage.from("resumes").createSignedUrl(path, 3600)` and return the signed URL.
- In `Profile.tsx`, when user clicks "View Resume", resolve a fresh signed URL on click and open it in a new tab. Show a toast if it fails.
- This handles both the legacy bad public URL and new clean paths without a migration.

### C. Pass user skills to Market Intelligence
- In `MarketIntelligencePage`, on mount load the user's profile once via `profileService.getProfile()` and store `skills`.
- Pass `profile.skills` into `marketService.generateInsights(role, skills)` so the edge function can compute proper coverage / matched skills / market position score.
- Show a small hint "Comparing against N of your skills" under the input.

### D. No DB / RLS / bucket changes required
- RLS on `profiles` is correct (`auth.uid() = id` for SELECT/INSERT/UPDATE).
- Storage policies on the `resumes` bucket are correct for private access; the bucket stays private and we only switch the frontend to signed URLs.

## Files to change

- `src/pages/ProfileSetup.tsx` — load existing profile, branch insert vs update, add "Back to Dashboard" button.
- `src/services/profileService.ts` — add `getResumeSignedUrl()`.
- `src/pages/Profile.tsx` — use signed URL when opening the resume.
- `src/pages/MarketIntelligencePage.tsx` — load profile skills and pass them into `generateInsights`.

## Out of scope (not changed unless you ask)
- Edge function `generate-market-insights` logic (already accepts `user_skills`; we just need to send them).
- Database schema and storage bucket visibility.
