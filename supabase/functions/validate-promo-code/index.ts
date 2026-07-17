import { createClient } from "npm:@supabase/supabase-js@2";
import { makeAdminClient, resolvePromoCode } from "../_shared/promo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes } = await anon.auth.getUser();
    if (!userRes.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code : "";
    const interval = body.interval === "yearly" ? "yearly" : "monthly";

    const result = await resolvePromoCode(makeAdminClient(), code, interval, userRes.user.id);
    if (!result.ok) return json({ valid: false, error: result.error }, result.status);

    return json({
      valid: true,
      code: result.code.code,
      discount_type: result.code.discount_type,
      discount_value: result.code.discount_value,
      base_amount_paise: result.base_amount_paise,
      final_amount_paise: result.final_amount_paise,
      discount_paise: result.discount_paise,
      is_free: result.is_free,
      extension_days: result.extension_days,
    });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
