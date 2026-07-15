// Shared guards for AI edge functions:
//   - hashInput(): SHA-256 hash of the sorted request parameters
//   - checkCache(): returns a fresh row if input hash matches and row < ttl old
//   - acquireSlot() / releaseSlot(): prevents duplicate parallel jobs per user+feature
// All helpers use the service role client so they cannot be bypassed by callers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/** Deterministic SHA-256 of any JSON-serializable value (keys sorted). */
export async function hashInput(value: unknown): Promise<string> {
  const stable = JSON.stringify(value, Object.keys(value ?? {}).sort());
  const bytes = new TextEncoder().encode(stable);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Return the most recent row for (user_id, input_hash) if fresh, else null.
 * Callers use this to short-circuit AI calls when inputs haven't changed.
 */
export async function checkCache<T = any>(
  table: string,
  userId: string,
  inputHash: string,
  ttlSeconds = 300,
): Promise<T | null> {
  const { data } = await admin()
    .from(table)
    .select("*")
    .eq("user_id", userId)
    .eq("input_hash", inputHash)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const createdAt = (data as any).created_at ? new Date((data as any).created_at).getTime() : 0;
  if (Date.now() - createdAt > ttlSeconds * 1000) return null;
  return data as T;
}

/**
 * Try to reserve a slot for (user_id, feature). Returns { ok: true } if reserved,
 * or { ok: false, waitSeconds } if another job is already in flight for this user+feature.
 * Slots older than staleAfterSeconds are considered abandoned and reclaimed.
 */
export async function acquireSlot(
  userId: string,
  feature: string,
  staleAfterSeconds = 120,
): Promise<{ ok: true } | { ok: false; waitSeconds: number }> {
  const a = admin();
  const cutoff = new Date(Date.now() - staleAfterSeconds * 1000).toISOString();
  // Clear stale slot if any
  await a.from("active_generations").delete().eq("user_id", userId).eq("feature", feature).lt("started_at", cutoff);
  const { error } = await a.from("active_generations").insert({ user_id: userId, feature });
  if (!error) return { ok: true };
  // Unique-violation → another job is running.
  const { data: existing } = await a
    .from("active_generations")
    .select("started_at")
    .eq("user_id", userId)
    .eq("feature", feature)
    .maybeSingle();
  const startedAt = existing?.started_at ? new Date(existing.started_at).getTime() : Date.now();
  const wait = Math.max(1, staleAfterSeconds - Math.floor((Date.now() - startedAt) / 1000));
  return { ok: false, waitSeconds: wait };
}

export async function releaseSlot(userId: string, feature: string): Promise<void> {
  await admin().from("active_generations").delete().eq("user_id", userId).eq("feature", feature);
}

export function busyResponse(waitSeconds: number, corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({
      error: `You already have a ${"request"} in progress. Please wait ~${waitSeconds}s and try again.`,
      reason: "already_running",
      wait_seconds: waitSeconds,
    }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
