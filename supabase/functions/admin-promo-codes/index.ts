import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const VALID_TYPES = ["percent", "flat", "free_extension", "free_upgrade"];
const VALID_APPLIES = ["monthly", "yearly", "any"];

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

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", userRes.user.id)
      .maybeSingle();
    if (!profile || !(profile as any).is_admin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "list") {
      const { data, error } = await admin.from("promo_codes").select("*").order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ codes: data });
    }

    if (action === "create") {
      const code = String(body.code ?? "").trim().toUpperCase();
      const discount_type = String(body.discount_type ?? "");
      const discount_value = Math.max(0, Math.floor(Number(body.discount_value ?? 0)));
      const applies_to = String(body.applies_to ?? "any");
      const max_redemptions = body.max_redemptions == null || body.max_redemptions === ""
        ? null
        : Math.max(1, Math.floor(Number(body.max_redemptions)));
      const expires_at = body.expires_at || null;

      if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return json({ error: "Code must be 3-40 chars (A-Z, 0-9, _-)" }, 400);
      if (!VALID_TYPES.includes(discount_type)) return json({ error: "Invalid discount_type" }, 400);
      if (!VALID_APPLIES.includes(applies_to)) return json({ error: "Invalid applies_to" }, 400);
      if (discount_type === "percent" && (discount_value < 1 || discount_value > 100))
        return json({ error: "Percent must be 1-100" }, 400);
      if (discount_type === "flat" && discount_value < 1) return json({ error: "Flat amount required (paise)" }, 400);
      if (discount_type === "free_extension" && discount_value < 1) return json({ error: "Days required" }, 400);

      const { data, error } = await admin.from("promo_codes").insert({
        code,
        discount_type,
        discount_value,
        applies_to,
        max_redemptions,
        expires_at,
        active: true,
        created_by: userRes.user.id,
      }).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ code: data });
    }

    if (action === "update") {
      const id = String(body.id ?? "");
      if (!id) return json({ error: "id required" }, 400);
      const patch: Record<string, unknown> = {};
      if (typeof body.active === "boolean") patch.active = body.active;
      if (body.expires_at !== undefined) patch.expires_at = body.expires_at || null;
      if (body.max_redemptions !== undefined) {
        patch.max_redemptions = body.max_redemptions == null || body.max_redemptions === ""
          ? null
          : Math.max(1, Math.floor(Number(body.max_redemptions)));
      }
      const { data, error } = await admin.from("promo_codes").update(patch).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ code: data });
    }

    if (action === "delete") {
      const id = String(body.id ?? "");
      if (!id) return json({ error: "id required" }, 400);
      const { error } = await admin.from("promo_codes").delete().eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
