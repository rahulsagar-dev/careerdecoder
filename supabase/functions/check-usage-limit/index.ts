import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Monthly limits for Free plan. Pro is unlimited. Report is Pro-only.
const FREE_LIMITS: Record<string, number> = {
  'career-recommendations': 1,
  'skill-analysis': 2,
  'github-analysis': 1,
  'interview-session': 3,
  'resume-analysis': 2,
  'career-report': 0, // Pro-only
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
    const { data: userRes } = await supabaseAnon.auth.getUser();
    if (!userRes.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = userRes.user.id;

    const { feature, increment = true } = await req.json().catch(() => ({}));
    if (!feature || typeof feature !== 'string') {
      return new Response(JSON.stringify({ error: 'feature required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: sub } = await admin
      .from('subscriptions')
      .select('plan,status')
      .eq('user_id', userId)
      .maybeSingle();

    const plan = sub?.plan ?? 'free';
    const isPro = plan === 'pro' && sub?.status === 'active';

    if (isPro && feature !== 'career-report') {
      return new Response(JSON.stringify({ allowed: true, remaining: -1, plan, limit: -1 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (feature === 'career-report' && !isPro) {
      return new Response(JSON.stringify({ allowed: false, remaining: 0, plan, limit: 0, reason: 'pro_only' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (isPro && feature === 'career-report') {
      return new Response(JSON.stringify({ allowed: true, remaining: -1, plan, limit: -1 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const limit = FREE_LIMITS[feature] ?? 0;
    const periodStart = new Date();
    periodStart.setUTCDate(1);
    periodStart.setUTCHours(0, 0, 0, 0);
    const periodStartStr = periodStart.toISOString().slice(0, 10);

    const { data: counter } = await admin
      .from('usage_counters')
      .select('id,count')
      .eq('user_id', userId)
      .eq('feature', feature)
      .eq('period_start', periodStartStr)
      .maybeSingle();

    const current = counter?.count ?? 0;
    if (current >= limit) {
      return new Response(JSON.stringify({ allowed: false, remaining: 0, plan, limit, reason: 'limit_reached' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (increment) {
      if (counter) {
        await admin.from('usage_counters').update({ count: current + 1 }).eq('id', counter.id);
      } else {
        await admin.from('usage_counters').insert({ user_id: userId, feature, count: 1, period_start: periodStartStr });
      }
    }

    return new Response(JSON.stringify({ allowed: true, remaining: limit - current - (increment ? 1 : 0), plan, limit }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
