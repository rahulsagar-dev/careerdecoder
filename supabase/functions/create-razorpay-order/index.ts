import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userRes, error: userErr } = await supabaseAnon.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const user = userRes.user;

    const body = await req.json().catch(() => ({}));
    const interval = body.interval === 'yearly' ? 'yearly' : 'monthly';
    const plan = interval === 'yearly'
      ? { amount: 399900, label: 'Pro yearly plan' }
      : { amount: 49900, label: 'Pro monthly plan' };

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')?.trim();
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')?.trim();
    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: 'Razorpay not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const isTestKey = keyId.startsWith('rzp_test_');
    const isLiveKey = keyId.startsWith('rzp_live_');
    if (!isTestKey && !isLiveKey) {
      return new Response(JSON.stringify({ error: 'Invalid Razorpay key format' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (plan.amount < 100) {
      return new Response(JSON.stringify({ error: 'Invalid payment amount' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const receipt = `dmc_${interval}_${Date.now()}_${user.id.slice(0, 8)}`;
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${keyId}:${keySecret}`),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: plan.amount,
        currency: 'INR',
        receipt,
        notes: { user_id: user.id, email: user.email ?? '', interval, plan: plan.label },
      }),
    });

    const rzpJson = await rzpRes.json();
    if (!rzpRes.ok) {
      console.error('Razorpay create order failed', rzpJson);
      const razorpayMessage = rzpJson.error?.description || 'Razorpay error';
      const safeMessage = razorpayMessage === 'Authentication failed'
        ? 'Razorpay authentication failed. Check that your Key ID and Key Secret are from the same Test/Live mode.'
        : razorpayMessage;
      return new Response(JSON.stringify({ error: safeMessage }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Store the pending order id so the verification endpoint can match the
    // Razorpay payment back to this authenticated user. Use upsert because
    // older accounts may not have a seeded free subscription row yet.
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
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
      return new Response(JSON.stringify({ error: 'Could not prepare subscription. Please try again.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      order_id: rzpJson.id,
      amount: rzpJson.amount,
      currency: rzpJson.currency,
      key_id: keyId,
      interval,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
