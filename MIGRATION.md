# Career Decoder — Project Transfer / Downgrade Checklist

Use this when moving the project to a cheaper Lovable account (or a new owner) without breaking the live site at **careerdecoder.work**.

Do the steps **in order**. Don't skip. Tick each box as you go.

---

## 0. Before you start (5 min)

- [ ] You know the login for **both** Lovable accounts (source + destination).
- [ ] You know the login for the **Supabase** project (`voydvjkvsathgckzcjgp`).
- [ ] You know the login for the **domain registrar** where `careerdecoder.work` is registered.
- [ ] You know the login for the **Razorpay** dashboard.
- [ ] You're on a desktop, not mobile.

---

## 1. Snapshot the current setup (10 min)

Write these down in a notes file so you can restore them if anything breaks.

- [ ] Supabase project ref: `voydvjkvsathgckzcjgp`
- [ ] Custom domains: `careerdecoder.work`, `www.careerdecoder.work`
- [ ] Published URL (Lovable subdomain): `https://decode-my-career.lovable.app`
- [ ] Razorpay **Live** Key ID (starts with `rzp_live_`): ____________________
- [ ] Razorpay Webhook URL currently configured in Razorpay dashboard: ____________________
- [ ] List of Supabase Edge Function secrets (names only, not values) — screenshot the Functions → Secrets page.
- [ ] Screenshot the DNS records at your registrar for `careerdecoder.work` (A / CNAME / TXT).

---

## 2. Back up the database (10 min)

Even though Supabase stays put, take a backup before touching anything.

- [ ] Supabase Dashboard → **Database → Backups** → confirm a recent daily backup exists.
- [ ] SQL Editor → run and save results:
  ```sql
  select count(*) from public.profiles;
  select count(*) from public.subscriptions where status = 'active';
  select count(*) from public.reviews where status = 'approved';
  select count(*) from public.promo_codes where active = true;
  ```
- [ ] Save those counts. You'll compare them after transfer.

---

## 3. Transfer the Lovable project (5 min)

- [ ] In the **source** Lovable account, open the project.
- [ ] Project settings → **Transfer project** → enter the destination account's email.
- [ ] Log into the **destination** account → accept the transfer.
- [ ] Confirm the project now appears in the destination account.

**Supabase does NOT move.** It stays linked by project ref. Nothing to do there.

---

## 4. Re-check Supabase link (5 min)

In the destination Lovable account:

- [ ] Open the project → verify the Supabase panel still shows project ref `voydvjkvsathgckzcjgp`.
- [ ] Verify all Edge Function secrets are still present (they should be — they live on Supabase, not Lovable):
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
  - `LOVABLE_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (auto)
  - `SUPABASE_URL` (auto)
  - `SUPABASE_ANON_KEY` (auto)
- [ ] If any are missing, re-add from your notes in step 1.

---

## 5. Republish from the destination account (5 min)

- [ ] Click **Publish** in the destination account.
- [ ] Wait for the build to finish (~1–2 min).
- [ ] Open the new Lovable subdomain preview → confirm the site loads and you can log in.

**Do NOT touch the custom domain yet.** `careerdecoder.work` still points to the old published URL.

---

## 6. Move the custom domain (15 min — the risky bit)

You have two options. **Option A is safer.**

### Option A — Zero-downtime (recommended)

- [ ] In destination Lovable → **Domains** → add `careerdecoder.work` and `www.careerdecoder.work`. It will show "pending DNS".
- [ ] Lovable will show you **new** DNS target values (A record IP or CNAME target). Write them down.
- [ ] Go to your domain registrar → DNS settings for `careerdecoder.work`.
- [ ] Update the `@` (root) and `www` records to point to the **new** Lovable targets.
- [ ] Lower TTL to 300 seconds first if it isn't already, so propagation is fast.
- [ ] Wait 5–15 minutes. Refresh Lovable's Domains page until it shows **Verified** + **SSL issued**.
- [ ] In the **source** account (old one), remove the custom domain from that project so it releases the claim.

### Option B — If Lovable refuses to add the same domain to two projects

- [ ] In the **source** account → Domains → **remove** `careerdecoder.work` and `www.careerdecoder.work`.
- [ ] Immediately in the **destination** account → Domains → **add** them back.
- [ ] Update DNS at the registrar to the new targets Lovable shows.
- [ ] Site is offline for 5–30 min while DNS + SSL propagate. This is normal.

---

## 7. Update Razorpay webhook (5 min)

The webhook URL points at a Supabase Edge Function, so it **does not change** — but verify anyway.

- [ ] Razorpay Dashboard → Settings → Webhooks.
- [ ] Confirm the URL is:
  `https://voydvjkvsathgckzcjgp.supabase.co/functions/v1/razorpay-webhook`
- [ ] Confirm it's **Active** and events include: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.failed`.

---

## 8. Update Supabase Auth redirect URLs (5 min)

Nothing changes here either, but verify:

- [ ] Supabase Dashboard → **Authentication → URL Configuration**.
- [ ] **Site URL**: `https://careerdecoder.work`
- [ ] **Redirect URLs** include:
  - `https://careerdecoder.work/**`
  - `https://www.careerdecoder.work/**`
  - `http://localhost:8080/**` (for local dev, optional)

---

## 9. Smoke test the live site (15 min)

Open `https://careerdecoder.work` in an **incognito window** and run through:

- [ ] Homepage loads, reviews marquee shows (if ≥6 approved reviews).
- [ ] Sign up with a throwaway email → verification email arrives → clicking it opens the live site (not `localhost`).
- [ ] Log in with an existing account.
- [ ] Dashboard loads user data.
- [ ] Upload a resume → analysis runs.
- [ ] Open `/pricing` → apply a test promo code → confirm discount shows.
- [ ] Do a ₹1 Razorpay test payment (create a temp 99%-off code) → confirm Pro activates → cancel it after.
- [ ] Open `/admin/reviews` and `/admin/promo-codes` (must be logged in as admin).
- [ ] Open `/admin/inbox` → confirm bug reports + support tickets load.

---

## 10. Downgrade the Lovable plan (2 min)

Only after **everything above is green**:

- [ ] Destination Lovable account → **Billing** → switch to the cheaper plan.
- [ ] Confirm the site at `careerdecoder.work` still loads after the plan change.

---

## 11. Post-migration cleanup (5 min)

- [ ] Re-run the SQL counts from step 2. They should match.
- [ ] Delete the throwaway signup account from Supabase → Auth → Users.
- [ ] Delete the temp 99%-off promo code from `/admin/promo-codes`.
- [ ] Raise DNS TTL back to 3600 seconds at the registrar.
- [ ] Update this file with the date of migration: **Migrated on: ____________**

---

## If something goes wrong

| Symptom | Fix |
|---|---|
| Site shows Lovable's default page | DNS still propagating. Wait 30 min. Check `dig careerdecoder.work` from terminal. |
| SSL error / "not secure" | Lovable hasn't issued the cert yet. Wait 15 min after DNS verifies. |
| Users can't log in | Check Supabase Auth **Site URL** matches the live domain exactly (no trailing slash). |
| Verify email link goes to `localhost` | Same fix — Supabase Auth Site URL. |
| Razorpay payments fail with 502 | Edge function secrets missing. Re-add `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` in Supabase → Functions → Secrets. |
| Webhook not firing | Razorpay dashboard → Webhooks → check delivery logs. Re-save the webhook secret in Supabase. |
| Admin pages 403 | Your `profiles.is_admin` flag didn't survive — re-run `update public.profiles set is_admin = true where id = '<your-user-id>';` |

---

**Rule of thumb:** if the smoke test in step 9 fails, do NOT downgrade the plan yet. Fix first, downgrade after.
