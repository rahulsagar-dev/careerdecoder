import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHmac, timingSafeEqual } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PLAN_AMOUNTS: Record<string, number> = {
  monthly: 49900,
  yearly: 399900,
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function signaturesMatch(expected: string, received: string) {
  if (!expected || !received || expected.length !== received.length) return false;
  const encoder = new TextEncoder();
  return timingSafeEqual(encoder.encode(expected), encoder.encode(received));
}

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
    const orderId = typeof body.razorpay_order_id === 'string' ? body.razorpay_order_id.trim() : '';
    const paymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id.trim() : '';
    const razorpaySignature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature.trim() : '';

    if (!orderId || !paymentId || !razorpaySignature) {
      return json({ error: 'Missing payment verification fields' }, 400);
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')?.trim();
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')?.trim();
    if (!keyId || !keySecret) return json({ error: 'Razorpay not configured' }, 500);

    const expectedSignature = createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (!signaturesMatch(expectedSignature, razorpaySignature)) {
      return json({ error: 'Payment signature mismatch' }, 400);
    }

    const auth = 'Basic ' + btoa(`${keyId}:${keySecret}`);
    const [orderRes, paymentRes] = await Promise.all([
      fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, { headers: { Authorization: auth } }),
      fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: auth } }),
    ]);

    const orderJson = await orderRes.json();
    const paymentJson = await paymentRes.json();

    if (!orderRes.ok) {
      console.error('Razorpay order lookup failed', orderJson);
      return json({ error: orderJson.error?.description || 'Could not verify Razorpay order' }, 502);
    }
    if (!paymentRes.ok) {
      console.error('Razorpay payment lookup failed', paymentJson);
      return json({ error: paymentJson.error?.description || 'Could not verify Razorpay payment' }, 502);
    }

    const interval = orderJson.notes?.interval === 'yearly' ? 'yearly' : 'monthly';
    const expectedAmount = PLAN_AMOUNTS[interval];
    const paymentStatus = String(paymentJson.status || '');

    if (orderJson.notes?.user_id !== user.id || paymentJson.order_id !== orderId) {
      return json({ error: 'Payment does not belong to this account' }, 400);
    }
    if (orderJson.currency !== 'INR' || paymentJson.currency !== 'INR' || orderJson.amount !== expectedAmount || paymentJson.amount !== expectedAmount) {
      return json({ error: 'Payment amount mismatch' }, 400);
    }
    if (!['authorized', 'captured'].includes(paymentStatus)) {
      return json({ error: 'Payment is not successful yet' }, 400);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (interval === 'yearly') periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1);
    else periodEnd.setUTCDate(periodEnd.getUTCDate() + 30);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await admin.from('payment_events').upsert({
      provider: 'razorpay',
      event_id: paymentId,
      event_type: 'payment.verified',
      user_id: user.id,
      payload: { order: orderJson, payment: paymentJson },
    }, { onConflict: 'provider,event_id', ignoreDuplicates: true });

    const { error: syncErr } = await admin.from('subscriptions').upsert({
      user_id: user.id,
      plan: 'pro',
      status: 'active',
      provider: 'razorpay',
      provider_customer_id: paymentId,
      provider_subscription_id: orderId,
      billing_interval: interval,
      currency: 'inr',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    }, { onConflict: 'user_id' });

    if (syncErr) {
      console.error('Failed to activate subscription', syncErr);
      return json({ error: 'Payment verified, but Pro activation failed. Please contact support.' }, 500);
    }

    return json({ ok: true, plan: 'pro', interval, current_period_end: periodEnd.toISOString() });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});