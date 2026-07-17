import { createClient } from 'npm:@supabase/supabase-js@2';
import { resolvePromoCode, PLAN_PRICE_PAISE } from '../_shared/promo.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes, error: userErr } = await supabaseAnon.auth.getUser();
    if (userErr || !userRes.user) return json({ error: 'Unauthorized' }, 401);
    const user = userRes.user;

    const body = await req.json().catch(() => ({}));
    const interval = body.interval === 'yearly' ? 'yearly' : 'monthly';
    const rawCode = typeof body.code === 'string' ? body.code.trim() : '';

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let finalAmount = PLAN_PRICE_PAISE[interval];
    let promo: Awaited<ReturnType<typeof resolvePromoCode>> | null = null;
    if (rawCode) {
      promo = await resolvePromoCode(admin, rawCode, interval, user.id);
      if (!promo.ok) return json({ error: promo.error }, promo.status);
      finalAmount = promo.final_amount_paise;
    }

    // Free path: skip Razorpay entirely.
    if (promo && promo.ok && promo.is_free) {
      const now = new Date();

      // Read current subscription to correctly extend period.
      const { data: existingSub } = await admin
        .from('subscriptions')
        .select('current_period_end,plan,status')
        .eq('user_id', user.id)
        .maybeSingle();
      const existingEnd = existingSub?.current_period_end
        ? new Date(existingSub.current_period_end)
        : null;
      const baseStart = existingEnd && existingEnd > now ? existingEnd : now;
      const periodEnd = new Date(baseStart);
      if (promo.code.discount_type === 'free_extension') {
        periodEnd.setUTCDate(periodEnd.getUTCDate() + promo.extension_days);
      } else if (interval === 'yearly') {
        periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1);
      } else {
        periodEnd.setUTCDate(periodEnd.getUTCDate() + 30);
      }

      const { data: redeemOk, error: redeemErr } = await admin
        .rpc('redeem_promo', {
          _code_id: promo.code.id,
          _user_id: user.id,
          _order_id: `free_${Date.now()}_${user.id.slice(0, 8)}`,
          _discount_paise: promo.discount_paise,
        });
      if (redeemErr || redeemOk === false) {
        console.error('redeem_promo failed', redeemErr);
        return json({ error: 'Could not redeem code. Please try again.' }, 409);
      }

      const { error: syncErr } = await admin.from('subscriptions').upsert({
        user_id: user.id,
        plan: 'pro',
        status: 'active',
        provider: 'razorpay',
        billing_interval: interval,
        currency: 'inr',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      }, { onConflict: 'user_id' });
      if (syncErr) {
        console.error('Failed to activate free Pro', syncErr);
        return json({ error: 'Could not activate Pro. Please contact support.' }, 500);
      }

      return json({
        free: true,
        plan: 'pro',
        interval,
        current_period_end: periodEnd.toISOString(),
        code: promo.code.code,
      });
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')?.trim();
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')?.trim();
    if (!keyId || !keySecret) return json({ error: 'Razorpay not configured' }, 500);

    const isTestKey = keyId.startsWith('rzp_test_');
    const isLiveKey = keyId.startsWith('rzp_live_');
    if (!isTestKey && !isLiveKey) return json({ error: 'Invalid Razorpay key format' }, 500);

    if (finalAmount < 100) return json({ error: 'Invalid payment amount' }, 400);

    const receipt = `dmc_${interval}_${Date.now()}_${user.id.slice(0, 8)}`;
    const notes: Record<string, string> = {
      user_id: user.id,
      email: user.email ?? '',
      interval,
      plan: interval === 'yearly' ? 'Pro yearly plan' : 'Pro monthly plan',
    };
    if (promo && promo.ok) {
      notes.promo_code_id = promo.code.id;
      notes.promo_code = promo.code.code;
      notes.discount_paise = String(promo.discount_paise);
    }

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${keyId}:${keySecret}`),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: finalAmount,
        currency: 'INR',
        receipt,
        notes,
      }),
    });

    const rzpJson = await rzpRes.json();
    if (!rzpRes.ok) {
      console.error('Razorpay create order failed', rzpJson);
      const razorpayMessage = rzpJson.error?.description || 'Razorpay error';
      const safeMessage = razorpayMessage === 'Authentication failed'
        ? 'Razorpay authentication failed. Check that your Key ID and Key Secret are from the same Test/Live mode.'
        : razorpayMessage;
      return json({ error: safeMessage }, 502);
    }

    const { error: syncErr } = await admin.from('subscriptions').upsert({
      user_id: user.id,
      plan: 'free',
      status: 'incomplete',
      provider: 'razorpay',
      provider_subscription_id: rzpJson.id,
      billing_interval: interval,
      currency: 'inr',
    }, { onConflict: 'user_id' });

    if (syncErr) {
      console.error('Failed to sync pending subscription', syncErr);
      return json({ error: 'Could not prepare subscription. Please try again.' }, 500);
    }

    return json({
      order_id: rzpJson.id,
      amount: rzpJson.amount,
      currency: rzpJson.currency,
      key_id: keyId,
      interval,
      discount_paise: promo && promo.ok ? promo.discount_paise : 0,
      code: promo && promo.ok ? promo.code.code : null,
    });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
