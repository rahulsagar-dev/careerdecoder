import { supabase } from "@/integrations/supabase/client";

export const billingService = {
  async createSubscription(interval: "monthly" | "yearly") {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { interval },
    });
    if (error) throw new Error(await getFunctionErrorMessage(error));
    if (data?.error) throw new Error(data.error);
    return data as { order_id: string; amount: number; currency: string; key_id: string; interval: string };
  },

  async verifyPayment(payload: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const { data, error } = await supabase.functions.invoke("verify-razorpay-payment", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: payload,
    });
    if (error) throw new Error(await getFunctionErrorMessage(error));
    if (data?.error) throw new Error(data.error);
    return data as { ok: boolean; plan: "pro"; interval: string; current_period_end: string };
  },

  async cancel() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const { data, error } = await supabase.functions.invoke("cancel-razorpay-subscription", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw new Error(await getFunctionErrorMessage(error));
    if (data?.error) throw new Error(data.error);
    return data;
  },

  async checkUsage(feature: string, increment = true) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const { data, error } = await supabase.functions.invoke("check-usage-limit", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { feature, increment },
    });
    if (error) throw new Error(error.message);
    return data as {
      allowed: boolean;
      remaining: number;
      plan: "free" | "pro";
      limit: number;
      reason?: string;
    };
  },
};

async function getFunctionErrorMessage(error: unknown) {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.clone === "function") {
    const body = await context.clone().json().catch(() => null);
    if (body?.error) return String(body.error);
  }
  return (error as Error)?.message || "Request failed";
}

export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}
