import { supabase } from "@/integrations/supabase/client";

export interface MarketData {
  id: string;
  user_id: string;
  role: string;
  trending_skills: string[];
  salary_range: string;
  demand_level: string;
  insights: string;
  created_at: string;
}

export const marketService = {
  async generateInsights(role: string): Promise<MarketData> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("generate-market-insights", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { role },
    });

    if (error) throw new Error(error.message || "Failed to generate insights");
    if (data?.error) throw new Error(data.error);
    return data.data;
  },

  async getInsights(role?: string): Promise<MarketData[]> {
    let query = supabase.from("market_data").select("*").order("created_at", { ascending: false });
    if (role) query = query.eq("role", role);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as MarketData[];
  },
};
