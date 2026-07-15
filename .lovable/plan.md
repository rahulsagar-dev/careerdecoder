# Plan v2: Resilience Without Quality Loss (Critiques Addressed)

## Decision (unchanged)
- **No model downgrades.** Keep current Gemini models.
- **No Groq.** Same reasons.

## Corrections From v1

| v1 said | Reality | v2 does |
|---|---|---|
| 60s cooldown by user_id | Would serve stale data after a resume/profile edit | Cooldown keyed on **input hash**, not user_id alone |
| "~500-1000 concurrent users" | Made-up number, unverified | Removed. Capacity is unknown until measured. |
| One retry after 3s | Fails under sustained rate-limit | Retry once → then queue expensive jobs OR show honest "busy" message for interactive ones |
| Credit alert | Requires you to be awake | **Auto top-up** (Pro/Business only) — confirmed available in Lovable docs |
| — | Multi-account abuse not covered | Add signup CAPTCHA + email verification gate before AI unlocks |
| — | Supabase concurrency limit unknown | Add per-user dedup + monitor logs; escalate to bigger Cloud instance if hit |

## What Will Change

### 1. Input-hash cooldown (not user_id cooldown)
- Add an `input_hash TEXT` column to `career_recommendations`, `skill_analysis`, `market_data`, `career_reports`, `resume_analysis`, `linkedin_analysis`.
- Before calling the AI, compute `SHA-256(JSON.stringify(sortedInputs))` server-side.
- If a row exists with the same `input_hash` for this user AND is < 5 minutes old → return it, skip the AI call.
- If input hash differs (user edited profile, uploaded new resume) → always regenerate. No staleness.
- Result: blocks double-click spam and refresh loops, never blocks a legitimate re-run.

### 2. Two-tier failure handling
- **Interactive features** (`interview-chat`, `evaluate-interview`, `parse-resume`): retry once at 3s → if still 429/5xx, show "AI service is busy, please try again in a minute." No queuing — user is actively waiting.
- **Expensive async features** (`generate-career-report`, `generate-market-insights`): on second failure, insert into a new `pending_generations` table with status=queued. A follow-up run (cron or on next login) picks them up. UI shows "We'll notify you when ready."
- Shared handler in `src/services/featureGate.ts` — extend existing `handleFeatureError`.

### 3. Auto top-up (Pro/Business) or alert (Free)
- I can't set this from code — it's a workspace setting in **Settings → Plans & credit usage**.
- Recommended config: threshold at 30% of monthly grant, top-up amount = 1 month of expected spend, monthly spend cap = 3× monthly grant (hard ceiling so a runaway bug can't empty your card).
- On Free plan: fall back to a balance-notification limit (I can set this via credit tools).

### 4. Signup abuse prevention
- Add **Cloudflare Turnstile** (free, no vendor lock-in) to the signup form. Verifies human before Supabase `signUp` is called.
- Add **email verification gate**: `profiles.email_verified` boolean; edge functions reject AI calls if false. Supabase already sends verification emails — just enforce it server-side.
- Optional (later): IP-based signup rate limit in a `pre-signup` edge function — max 3 signups per IP per hour.

### 5. Concurrency dedup + observability
- Add a lightweight `active_generations` table: `(user_id, feature, started_at)` with a 2-min TTL.
- Edge function checks before starting: if a row exists for this user+feature and started < 2 min ago, return 429 immediately with "Already generating, please wait." Prevents a single user from spawning parallel identical jobs.
- Monitor via edge function logs; if we see repeated 5xx from Supabase (not Gemini), the fix is a bigger Cloud instance, not code.

## Order Of Work (if you approve)

1. Input-hash cooldown (biggest correctness fix — removes the v1 bug).
2. Concurrency dedup (`active_generations`).
3. Signup CAPTCHA + email verification gate.
4. Two-tier failure handling with `pending_generations` queue.
5. You configure auto top-up in Settings (5 min, one-time).

## Explicitly NOT Doing

- Model changes.
- Prompt changes.
- Groq / second AI provider.
- Guessing capacity numbers.
- Anything requiring me to know Supabase's private per-plan concurrency limit.

## What I Cannot Guarantee

- Exact concurrent-user capacity — depends on your Gemini tier and Supabase plan, both of which Lovable does not publish per-project.
- Zero 429s under a viral spike — the queue+message pattern makes them survivable, not impossible.
- That auto top-up is available on your specific plan — verify in Settings before relying on it.
