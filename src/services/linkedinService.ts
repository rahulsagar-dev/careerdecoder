import { supabase } from "@/integrations/supabase/client";
import { gateFeature } from "./featureGate";

export interface LinkedInSuggestion {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface LinkedInAnalysis {
  id: string;
  user_id: string;
  overall_score: number;
  headline_score: number;
  about_score: number;
  experience_score: number;
  skills_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: LinkedInSuggestion[];
  keyword_gaps: string[];
  parsed_text: string | null;
  target_career: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParsedLinkedIn {
  text: string;
  sections: {
    headline: string;
    about: string;
    experience: string;
    skills: string;
    education: string;
  };
}

const FUNCTIONS_URL = `https://voydvjkvsathgckzcjgp.supabase.co/functions/v1`;

export const linkedinService = {
  async uploadAndParse(file: File): Promise<ParsedLinkedIn> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    await gateFeature("linkedin-analysis");

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${FUNCTIONS_URL}/parse-linkedin`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Failed to parse LinkedIn PDF");
    return data as ParsedLinkedIn;
  },

  async generateAnalysis(parsed: ParsedLinkedIn, targetCareer?: string): Promise<LinkedInAnalysis> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("generate-linkedin-analysis", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { parsedText: parsed.text, sections: parsed.sections, targetCareer },
    });
    if (error) throw new Error(error.message || "Failed to generate analysis");
    if (data?.error) throw new Error(data.error);
    return data.analysis as LinkedInAnalysis;
  },

  async listAnalyses(): Promise<LinkedInAnalysis[]> {
    const { data, error } = await supabase
      .from("linkedin_analysis" as never)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data as unknown as LinkedInAnalysis[]) || [];
  },

  async getLatest(): Promise<LinkedInAnalysis | null> {
    const { data, error } = await supabase
      .from("linkedin_analysis" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data as unknown as LinkedInAnalysis) || null;
  },

  async deleteAnalysis(id: string): Promise<void> {
    const { error } = await supabase.from("linkedin_analysis" as never).delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
