## Payments Plan — Stripe + Razorpay with Geo Routing

### Approach

Since your project uses external Supabase (not Lovable Cloud), Lovable's built-in payments won't work. Instead, we'll build a BYOK (bring-your-own-key) setup using edge functions — you keep your current Supabase, and I integrate both providers manually.

**Routing rule:** Detect user location → India goes to Razorpay (INR, UPI, cards, netbanking), everyone else goes to Stripe (USD/EUR, cards). One unified `subscriptions` table keeps state in sync regardless of provider.

---

### 1. Pricing model (Free vs Pro)

| Feature | Free | Pro |
|---|---|---|
| Career Recommendations | 1 generation | Unlimited |
| Resume Analysis | 2 / month | Unlimited |
| Skill Gap Analysis | 2 / month | Unlimited |
| GitHub Analysis | 1 / month | Unlimited |
| Interview Simulator | 3 sessions / month | Unlimited |
| Career Report (PDF export) | ❌ | ✅ |
| Market Intelligence | Basic | Full insights |
| Learning Roadmap | 1 active | Unlimited |

Pricing (suggested — final numbers up to you):
- Stripe: **$9.99/month** or **$79/year** (2 months free)
- Razorpay: **₹499/month** or **₹3999/year**

---

### 2. Database changes (one migration)

New tables:
- **`subscriptions`** — `user_id`, `provider` ('stripe' | 'razorpay'), `provider_customer_id`, `provider_subscription_id`, `plan` ('free' | 'pro'), `status` ('active' | 'canceled' | 'past_due' | 'trialing'), `current_period_end`, `cancel_at_period_end`, timestamps. RLS: user reads own, service_role writes.
- **`usage_counters`** — `user_id`, `feature`, `count`, `period_start` (monthly reset). RLS: user reads own, service_role writes.
- **`payment_events`** — audit log of every webhook event (`provider`, `event_type`, `payload`, `processed_at`). service_role only.

Every user auto-gets a `free` row on signup (via existing profile trigger extension).

---

### 3. Edge functions (6 new)

| Function | Purpose |
|---|---|
| `detect-region` | Reads request IP via CF headers → returns `{ currency, provider }`. Fallback to browser locale. |
| `create-stripe-checkout` | Creates Stripe Checkout Session for Pro monthly/yearly. Returns URL. |
| `create-razorpay-order` | Creates Razorpay Subscription. Returns subscription_id + key for client SDK. |
| `stripe-webhook` | Handles `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`. Signature-verified. |
| `razorpay-webhook` | Handles `subscription.activated/charged/cancelled/halted`. HMAC-verified. |
| `check-usage-limit` | Called before AI-heavy features. Returns `{ allowed, remaining, plan }`. Increments counter. |

All webhooks use service_role internally (never exposed to client). Config: `verify_jwt = false` for webhook endpoints only.

---

### 4. Secrets required (I'll request via secure form)

- `STRIPE_SECRET_KEY` (sk_live_… or sk_test_…)
- `STRIPE_WEBHOOK_SECRET` (whsec_…)
- `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` (price IDs from your Stripe dashboard)
- `RAZORPAY_KEY_ID` (rzp_live_… or rzp_test_…)
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RAZORPAY_PLAN_MONTHLY`, `RAZORPAY_PLAN_YEARLY` (plan IDs)

Publishable Stripe key + Razorpay key_id also stored client-side (safe to expose).

---

### 5. Frontend

New pages/components:
- **`/pricing`** — Free vs Pro comparison table. Auto-shows ₹ prices to Indian visitors, $ to everyone else. "Upgrade to Pro" button routes to the right provider.
- **`/billing`** (in Dashboard) — Current plan, renewal date, "Manage subscription" (Stripe Customer Portal link / Razorpay dashboard link), cancel button.
- **`<UpgradeGate />`** wrapper component — wraps limited features, shows "You've hit your Free limit — Upgrade" modal when `check-usage-limit` returns `allowed: false`.
- **`<PlanBadge />`** in sidebar footer showing Free/Pro status.
- Stripe: redirect to Checkout (hosted page — simplest & PCI-safe).
- Razorpay: embed their JS SDK, open the modal on click, verify payment server-side after success.

New service: `src/services/billingService.ts` — wraps all provider calls + usage checks.

---

### 6. Region detection logic

```text
1. Edge function reads `cf-ipcountry` / `x-vercel-ip-country` header
2. If IN → Razorpay (INR)
3. Else check Accept-Language → if hi-IN/en-IN → Razorpay
4. Else → Stripe (default USD)
5. User can override on /pricing page ("Pay in USD instead")
```

---

### 7. Integration into existing features

Gate these functions with `check-usage-limit` before running:
- `generate-career-recommendations`
- `generate-skill-analysis`
- `analyze-github-profile`
- `interview-chat` (per session start)
- `parse-resume` + `score-resume`
- `generate-career-report` (Pro only, hard gate)

Free users get a friendly upgrade prompt instead of running the AI call.

---

### 8. What you need to do before I build

1. **Create Stripe account** → get secret key + create a Product with monthly/yearly Prices → note the price IDs.
2. **Create Razorpay account** (KYC required for live mode; test mode works immediately) → create a Plan for monthly + yearly → note plan IDs.
3. **Set webhook endpoints** (I'll give you the exact URLs after deploy):
   - Stripe: `https://voydvjkvsathgckzcjgp.supabase.co/functions/v1/stripe-webhook`
   - Razorpay: `https://voydvjkvsathgckzcjgp.supabase.co/functions/v1/razorpay-webhook`
4. Paste all 10 secrets into the secure form I'll open.

---

### 9. Build order (once approved)

1. Migration: `subscriptions`, `usage_counters`, `payment_events` + RLS + free-plan seed trigger
2. Request all secrets
3. Edge functions: `check-usage-limit` + `detect-region` first (unblocks gating)
4. Stripe checkout + webhook
5. Razorpay order + webhook
6. Frontend: `/pricing`, `/billing`, `<UpgradeGate />`, sidebar badge
7. Wire `<UpgradeGate />` into the 6 gated features
8. Test both providers in test mode

Ready to implement when you approve. Want to tweak the pricing or feature-limit split first?
