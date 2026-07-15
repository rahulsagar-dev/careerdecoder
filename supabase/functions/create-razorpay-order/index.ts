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
    const planId = interval === 'yearly'
      ? Deno.env.get('RAZORPAY_PLAN_YEARLY')
      : Deno.env.get('RAZORPAY_PLAN_MONTHLY');

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    if (!planId || !keyId || !keySecret) {
      return new Response(JSON.stringify({ error: 'Razorpay not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const totalCount = interval === 'yearly' ? 5 : 60; // 5 years or 5 years-worth of months

    const rzpRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${keyId}:${keySecret}`),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        total_count: totalCount,
        customer_notify: 1,
        notes: { user_id: user.id, email: user.email ?? '', interval },
      }),
    });

    const rzpJson = await rzpRes.json();
    if (!rzpRes.ok) {
      console.error('Razorpay create subscription failed', rzpJson);
      return new Response(JSON.stringify({ error: rzpJson.error?.description || 'Razorpay error' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Store pending subscription id so the webhook can match the paid Razorpay
    // subscription back to this authenticated user. Use upsert because older
    // accounts may not have a seeded free subscription row yet.
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error: syncErr } = await admin.from('subscriptions').upsert({
      user_id: user.id,
      plan: 'free',
      status: 'active',
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
      subscription_id: rzpJson.id,
      key_id: keyId,
      interval,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
