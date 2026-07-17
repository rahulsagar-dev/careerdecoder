// Shared promo-code validation used by validate-promo-code and create-razorpay-order.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export const PLAN_PRICE_PAISE: Record<"monthly" | "yearly", number> = {
  monthly: 49900,
  yearly: 399900,
};

export interface PromoCodeRow {
  id: string;
  code: string;
  discount_type: "percent" | "flat" | "free_extension" | "free_upgrade";
  discount_value: number;
  applies_to: "monthly" | "yearly" | "any";
  max_redemptions: number | null;
  redemption_count: number;
  expires_at: string | null;
  active: boolean;
}

export interface PromoResolution {
  ok: true;
  code: PromoCodeRow;
  interval: "monthly" | "yearly";
  base_amount_paise: number;
  final_amount_paise: number;
  discount_paise: number;
  is_free: boolean;
  extension_days: number;
}

export type PromoError = { ok: false; status: number; error: string };

export async function resolvePromoCode(
  admin: SupabaseClient,
  rawCode: string,
  interval: "monthly" | "yearly",
  userId: string,
): Promise<PromoResolution | PromoError> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, status: 400, error: "Enter a code" };

  const { data, error } = await admin
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) return { ok: false, status: 500, error: "Could not check code" };
  if (!data || !data.active) return { ok: false, status: 404, error: "Code not found" };

  const row = data as PromoCodeRow;
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, status: 410, error: "This code has expired" };
  }
  if (row.applies_to !== "any" && row.applies_to !== interval) {
    return { ok: false, status: 400, error: `Code only applies to ${row.applies_to} plans` };
  }
  if (row.max_redemptions !== null && row.redemption_count >= row.max_redemptions) {
    return { ok: false, status: 410, error: "This code has been fully redeemed" };
  }

  const { data: existing } = await admin
    .from("promo_redemptions")
    .select("id")
    .eq("promo_code_id", row.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return { ok: false, status: 409, error: "You've already used this code" };

  const base = PLAN_PRICE_PAISE[interval];
  let discount = 0;
  let extensionDays = 0;
  let isFree = false;

  switch (row.discount_type) {
    case "percent": {
      const pct = Math.max(0, Math.min(100, row.discount_value));
      discount = Math.floor((base * pct) / 100);
      if (pct >= 100) isFree = true;
      break;
    }
    case "flat": {
      discount = Math.max(0, Math.min(base, row.discount_value));
      if (discount >= base) isFree = true;
      break;
    }
    case "free_extension":
      extensionDays = Math.max(1, row.discount_value);
      isFree = true;
      break;
    case "free_upgrade":
      discount = base;
      isFree = true;
      break;
  }

  const final = isFree && row.discount_type !== "free_extension" ? 0 : base - discount;

  return {
    ok: true,
    code: row,
    interval,
    base_amount_paise: base,
    final_amount_paise: final,
    discount_paise: discount,
    is_free: isFree,
    extension_days: extensionDays,
  };
}

export function makeAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
