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
  const { user, loading: authLoading } = useAuth();
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
    if (authLoading) {
      setState((s) => ({ ...s, loading: true }));
      return;
    }

    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const plan = (data?.plan ?? "free") as "free" | "pro";
    const status = data?.status ?? "active";
    const currentPeriodEnd = data?.current_period_end ?? null;
    const periodActive = !currentPeriodEnd || new Date(currentPeriodEnd).getTime() > Date.now();
    const isActive = status === "active" && periodActive;
    setState({
      plan,
      status,
      isActive,
      isPro: plan === "pro" && isActive,
      loading: false,
      currentPeriodEnd,
      cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
      provider: data?.provider ?? null,
      billingInterval: data?.billing_interval ?? null,
    });
  }, [authLoading, user]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
