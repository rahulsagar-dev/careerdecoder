
# Promo Code System

Users type a code on `/pricing`, we validate it server-side, then either (a) skip Razorpay and grant Pro directly (100% off / free extension), or (b) create a Razorpay order with the discounted amount. Admins manage codes at `/admin/promo-codes`.

## 1. Database (migration)

**Table `promo_codes`**
- `id uuid pk`
- `code text unique not null` (stored uppercase, e.g. `LAUNCH20`)
- `discount_type text not null` — `percent` | `flat` | `free_extension` | `free_upgrade`
- `discount_value int not null` — percent (1–100), paise for flat, or days for free_extension. Ignored for free_upgrade.
- `applies_to text not null default 'any'` — `monthly` | `yearly` | `any`
- `max_redemptions int null` — null = unlimited
- `redemption_count int not null default 0`
- `expires_at timestamptz null`
- `active boolean not null default true`
- `created_by uuid`, `created_at`, `updated_at`

**Table `promo_redemptions`**
- `id uuid pk`
- `promo_code_id uuid → promo_codes(id)`
- `user_id uuid not null`
- `order_id text null` (Razorpay order id, null for free upgrades)
- `discount_applied_paise int not null default 0`
- `redeemed_at timestamptz default now()`
- **Unique index `(promo_code_id, user_id)`** → enforces one-per-user

Grants + RLS:
- `promo_codes`: `authenticated` SELECT only (needed by validate function via anon-key client). No direct write from client — admins write via edge function using service role. `service_role` ALL.
- `promo_redemptions`: no client access. `service_role` ALL only. RLS enabled with no permissive policies.

## 2. Edge functions

### `validate-promo-code` (new)
Input: `{ code, interval }`. Auth required.
- Look up active code, check expiry, `applies_to`, `redemption_count < max_redemptions`, and no existing redemption for this user.
- Compute base price (₹499 / ₹3999 in paise).
- Return `{ valid, discount_type, discount_value, final_amount_paise, message }`.
- Does NOT record redemption — just previews.

### `create-razorpay-order` (modify)
Accept optional `code` in body.
- Re-validate server-side (never trust client-computed price).
- If `free_upgrade` or `percent=100` or `flat >= price`:
  - Skip Razorpay. Upsert subscription to Pro with `current_period_end = now + (30/365 days)`. Insert `promo_redemptions` row. Increment `redemption_count`. Return `{ free: true }`.
- If `free_extension`:
  - Skip Razorpay. Extend `current_period_end` by `discount_value` days (from later of now / existing end). Insert redemption. Return `{ free: true }`.
- Else create order with discounted amount, stash `code` in order `notes` so verify step can finalize redemption.

### `verify-razorpay-payment` (modify)
- After signature verification succeeds, if order notes contain `promo_code`: insert `promo_redemptions` row and increment `redemption_count` atomically (use a `SECURITY DEFINER` function `redeem_promo(code_id, user_id, order_id, discount_paise)` that does both in one transaction and re-checks max_redemptions to prevent race).

### `admin-promo-codes` (new, admin-only)
- Uses existing `private.is_admin()` gate.
- Actions: `list`, `create`, `update` (toggle active / edit), `delete`.

## 3. Frontend

### `/pricing` (`src/pages/Pricing.tsx`)
- Add input + "Apply" button under the Pro card.
- On apply → call `validate-promo-code` → show discounted price with strikethrough original, plus a green "Code applied" chip and Remove button.
- Pass `code` to `billingService.createSubscription(interval, code)`.
- If response is `{ free: true }` → toast success, refresh subscription, navigate to `/payment-success`. Otherwise open Razorpay as today.

### `billingService.ts`
- `createSubscription(interval, code?)` — forward code.
- New `validatePromo(code, interval)` helper.

### `/admin/promo-codes` (new page)
- Same shell as `/admin/reviews`. Table of codes with columns: code, type, value, applies to, redemptions (`x/max`), expires, active toggle, actions.
- "New code" dialog with fields matching the schema (type dropdown, value input, plan dropdown, expiry datepicker, max redemptions).
- Wire into admin sidebar / `AdminInbox` nav.

## 4. Race + abuse safeguards

- Redemption count and `promo_redemptions` insert happen in one `SECURITY DEFINER` SQL function so two simultaneous payments can't both consume the last slot.
- Unique `(promo_code_id, user_id)` index enforces one-per-user at the DB level even if the check races.
- Codes normalized to uppercase on write and on lookup.
- Discount recomputed server-side inside `create-razorpay-order`; the client's `final_amount` is never trusted.

## 5. Files touched

New:
- `supabase/functions/validate-promo-code/index.ts`
- `supabase/functions/admin-promo-codes/index.ts`
- `src/pages/AdminPromoCodes.tsx`
- Migration for tables + `redeem_promo` function

Modified:
- `supabase/functions/create-razorpay-order/index.ts`
- `supabase/functions/verify-razorpay-payment/index.ts`
- `src/pages/Pricing.tsx`
- `src/services/billingService.ts`
- `src/routes/AppRoutes.tsx` (add `/admin/promo-codes`)

## 6. Out of scope (say if you want them)

- Stacking multiple codes
- Referral / auto-generated per-user codes
- Analytics dashboard for code performance
