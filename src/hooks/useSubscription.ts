import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface SubscriptionInfo {
  plan: "free" | "pro";
  status: string;
  isActive: boolean;
  isPro: boolean;
  loading: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  provider: string | null;
  billingInterval: string | null;
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionInfo {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<SubscriptionInfo, "refresh">>({
    plan: "free",
    status: "active",
    isActive: false,
    isPro: false,
    loading: true,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    provider: null,
    billingInterval: null,
  });

  const load = useCallback(async () => {
    console.log("[billing-subscription-load:start]", {
      hasUser: Boolean(user),
      userId: user?.id ?? null,
    });
    if (!user) {
      console.log("[billing-subscription-load:skip] no user");
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const { data, error, status } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    console.log("[billing-subscription-load:result]", {
      status,
      errorCode: error?.code ?? null,
      errorMessage: error?.message ?? null,
      hasData: Boolean(data),
      userId: user.id,
    });
    if (error) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const plan = (data?.plan ?? "free") as "free" | "pro";
    const status = data?.status ?? "active";
    setState({
      plan,
      status,
      isActive: status === "active",
      isPro: plan === "pro" && status === "active",
      loading: false,
      currentPeriodEnd: data?.current_period_end ?? null,
      cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
      provider: data?.provider ?? null,
      billingInterval: data?.billing_interval ?? null,
    });
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
