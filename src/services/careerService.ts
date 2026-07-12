import { supabase } from "@/integrations/supabase/client";
import { gateFeature } from "./featureGate";

export interface CareerRecommendation {
  id: string;
  user_id: string;
  career_title: string;
  match_score: number;
  required_skills: string[];
  missing_skills: string[];
  description: string;
  salary_range: string;
  created_at: string;
}

export interface SkillAnalysis {
  id: string;
  user_id: string;
  total_skills: number;
  matched_skills: number;
  missing_skills: number;
  readiness_score: number;
  skill_distribution: Record<string, number>;
  created_at: string;
}

export const careerService = {
  async generateRecommendations(): Promise<CareerRecommendation[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("generate-career-recommendations", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error) throw new Error(error.message || "Failed to generate recommendations");
    if (data?.error) throw new Error(data.error);
    return data.recommendations;
  },

  async getRecommendations(): Promise<CareerRecommendation[]> {
    const { data, error } = await supabase
      .from("career_recommendations")
      .select("*")
      .order("match_score", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as CareerRecommendation[];
  },

  async getCareerById(id: string): Promise<CareerRecommendation | null> {
    const { data, error } = await supabase
      .from("career_recommendations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as CareerRecommendation;
  },

  async generateSkillAnalysis(): Promise<SkillAnalysis> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("generate-skill-analysis", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error) throw new Error(error.message || "Failed to generate analysis");
    if (data?.error) throw new Error(data.error);
    return data.analysis;
  },

  async getSkillAnalysis(): Promise<SkillAnalysis | null> {
    const { data, error } = await supabase
      .from("skill_analysis")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data as SkillAnalysis | null;
  },
};
