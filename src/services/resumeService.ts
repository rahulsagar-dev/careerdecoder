import { supabase } from "@/integrations/supabase/client";
import { gateFeature } from "./featureGate";

export interface ResumeExperience {
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface ResumeProject {
  title: string;
  description: string;
  technologies: string[];
}

export interface ParsedResume {
  extracted_skills: string[];
  tech_stack: string[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
}

export interface ResumeAnalysis {
  id: string;
  user_id: string;
  extracted_skills: string[];
  extracted_experience: ResumeExperience[];
  extracted_projects: ResumeProject[];
  tech_stack: string[];
  ats_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  created_at: string;
}

export const resumeService = {
  async parseResume(): Promise<ParsedResume> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("parse-resume", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error) throw new Error(error.message || "Failed to parse resume");
    if (data?.error) throw new Error(data.error);
    return data.parsed;
  },

  async scoreResume(
    parsedData: ParsedResume,
    careerTitle: string,
    requiredSkills: string[],
    missingSkills: string[],
  ): Promise<ResumeAnalysis> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("score-resume", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {
        parsed_data: parsedData,
        career_title: careerTitle,
        required_skills: requiredSkills,
        missing_skills: missingSkills,
      },
    });

    if (error) throw new Error(error.message || "Failed to score resume");
    if (data?.error) throw new Error(data.error);
    return data.analysis as ResumeAnalysis;
  },

  async getResumeAnalysis(): Promise<ResumeAnalysis | null> {
    const { data, error } = await supabase
      .from("resume_analysis")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data as unknown as ResumeAnalysis | null;
  },

  async updateProfileSkillsFromResume(newSkills: string[]): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    // Get current profile skills
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills")
      .eq("id", session.user.id)
      .single();

    const currentSkills = (profile?.skills || []) as string[];
    const currentLower = currentSkills.map((s) => s.toLowerCase());

    // Merge without duplicates
    const merged = [...currentSkills];
    for (const skill of newSkills) {
      if (!currentLower.includes(skill.toLowerCase())) {
        merged.push(skill);
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ skills: merged })
      .eq("id", session.user.id);

    if (error) throw new Error(error.message);
  },
};
