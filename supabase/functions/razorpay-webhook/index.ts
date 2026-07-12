import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const raw = await req.text();
    const signature = req.headers.get('x-razorpay-signature') ?? '';
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;

    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    if (expected !== signature) {
      console.warn('Invalid webhook signature');
      return new Response('invalid signature', { status: 400 });
    }

    const evt = JSON.parse(raw);
    const eventType: string = evt.event;
    const eventId: string | undefined = evt.id || evt.payload?.subscription?.entity?.id;

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const sub = evt.payload?.subscription?.entity;
    const payment = evt.payload?.payment?.entity;
    const userId = sub?.notes?.user_id || payment?.notes?.user_id || null;

    // Log every event (idempotent via unique index on provider+event_id)
    await admin.from('payment_events').insert({
      provider: 'razorpay',
      event_id: eventId,
      event_type: eventType,
      user_id: userId,
      payload: evt,
    }).select().maybeSingle();

    const providerSubId = sub?.id;

    const updateByUser = async (patch: Record<string, unknown>) => {
      if (!userId && !providerSubId) return;
      let q = admin.from('subscriptions').update(patch);
      if (userId) q = q.eq('user_id', userId);
      else q = q.eq('provider_subscription_id', providerSubId!);
      await q;
    };

    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.charged': {
        await updateByUser({
          plan: 'pro',
          status: 'active',
          provider: 'razorpay',
          provider_subscription_id: providerSubId,
          current_period_start: sub?.current_start ? new Date(sub.current_start * 1000).toISOString() : null,
          current_period_end: sub?.current_end ? new Date(sub.current_end * 1000).toISOString() : null,
          cancel_at_period_end: false,
        });
        break;
      }
      case 'subscription.cancelled':
      case 'subscription.completed': {
        await updateByUser({
          plan: 'free',
          status: 'canceled',
          cancel_at_period_end: false,
        });
        break;
      }
      case 'subscription.halted':
      case 'subscription.pending':
      case 'payment.failed': {
        await updateByUser({ status: 'past_due' });
        break;
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Webhook error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
