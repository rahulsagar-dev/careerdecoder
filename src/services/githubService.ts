import { supabase } from "@/integrations/supabase/client";
import { gateFeature } from "./featureGate";

export interface GithubAnalysis {
  id: string;
  user_id: string;
  github_url: string;
  total_repos: number;
  total_commits: number;
  languages: string[];
  portfolio_score: number;
  strengths: string[];
  weaknesses: string[];
  created_at: string;
}

export interface RepoAnalysis {
  id: string;
  analysis_id: string;
  repo_name: string;
  description: string;
  stars: number;
  forks: number;
  primary_language: string;
  commit_count: number;
  complexity_score: number;
  strengths: string[];
  weaknesses: string[];
  created_at: string;
}

export const githubService = {
  async analyzeGithubProfile(githubUrl?: string): Promise<{ analysis: GithubAnalysis; repos: RepoAnalysis[] }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("analyze-github-profile", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: githubUrl ? { github_url: githubUrl } : {},
    });

    if (error) throw new Error(error.message || "Failed to analyze GitHub profile");
    if (data?.error) throw new Error(data.error);
    return { analysis: data.analysis, repos: data.repos };
  },

  async getGithubAnalysis(): Promise<GithubAnalysis | null> {
    const { data, error } = await supabase
      .from("github_analysis")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data as GithubAnalysis | null;
  },

  async getRepoAnalysis(analysisId: string): Promise<RepoAnalysis[]> {
    const { data, error } = await supabase
      .from("repo_analysis")
      .select("*")
      .eq("analysis_id", analysisId)
      .order("stars", { ascending: false });

    if (error) return [];
    return (data || []) as RepoAnalysis[];
  },
};
