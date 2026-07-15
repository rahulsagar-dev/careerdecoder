// Server-side usage-limit and plan enforcement.
// Called by AI edge functions so limits cannot be bypassed by skipping the client-side gate.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FREE_LIMITS: Record<string, number> = {
  "career-recommendations": 1,
  "skill-analysis": 2,
  "github-analysis": 1,
  "interview-session": 3,
  "resume-analysis": 2,
  "linkedin-analysis": 1,
  "career-report": 0, // Pro-only
};

export type EnforceResult =
  | { ok: true; plan: string }
  | { ok: false; status: number; body: { error: string; reason: string; feature: string; plan: string; limit: number } };

/**
 * Enforce plan + monthly free-tier limits for a feature.
 * Uses the service role client so it cannot be bypassed by the caller.
 *
 * @param userId The authenticated user's id
 * @param feature One of the keys in FREE_LIMITS
 * @param opts.increment when true, atomically increments the counter after passing the check
 */
export async function enforceUsage(
  userId: string,
  feature: keyof typeof FREE_LIMITS | string,
  opts: { increment?: boolean } = {},
): Promise<EnforceResult> {
  const increment = opts.increment !== false;
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan,status")
    .eq("user_id", userId)
    .maybeSingle();

  const plan = sub?.plan ?? "free";
  const isPro = plan === "pro" && sub?.status === "active";

  // Pro users: unlimited on all features (including career-report).
  if (isPro) return { ok: true, plan };

  // Pro-only hard gate.
  if (feature === "career-report") {
    return {
      ok: false,
      status: 402,
      body: { error: "Pro subscription required for this feature.", reason: "pro_only", feature, plan, limit: 0 },
    };
  }

  const limit = FREE_LIMITS[feature] ?? 0;
  const periodStart = new Date();
  periodStart.setUTCDate(1);
  periodStart.setUTCHours(0, 0, 0, 0);
  const periodStartStr = periodStart.toISOString().slice(0, 10);

  const { data: counter } = await admin
    .from("usage_counters")
    .select("id,count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("period_start", periodStartStr)
    .maybeSingle();

  const current = counter?.count ?? 0;
  if (current >= limit) {
    return {
      ok: false,
      status: 402,
      body: {
        error: `Monthly free-tier limit reached for ${feature}. Upgrade to Pro for unlimited access.`,
        reason: "limit_reached",
        feature,
        plan,
        limit,
      },
    };
  }

  if (increment) {
    if (counter) {
      await admin.from("usage_counters").update({ count: current + 1 }).eq("id", counter.id);
    } else {
      await admin
        .from("usage_counters")
        .insert({ user_id: userId, feature, count: 1, period_start: periodStartStr });
    }
  }

  return { ok: true, plan };
}
