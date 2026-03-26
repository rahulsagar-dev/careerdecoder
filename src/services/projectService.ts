import { supabase } from "@/integrations/supabase/client";

export interface ProjectSuggestion {
  id: string;
  user_id: string;
  title: string;
  description: string;
  difficulty: string;
  skills_covered: string[];
  estimated_time: string;
  project_link: string | null;
  created_at: string;
}

export const projectService = {
  async generateProjects(missingSkills: string[] = [], careerTitle: string = "") {
    const { data, error } = await supabase.functions.invoke("generate-project-suggestions", {
      body: { missing_skills: missingSkills, career_title: careerTitle },
    });
    if (error) throw new Error(error.message || "Failed to generate projects");
    if (data?.error) throw new Error(data.error);
    return data.projects as ProjectSuggestion[];
  },

  async getProjects(): Promise<ProjectSuggestion[]> {
    const { data, error } = await supabase
      .from("project_suggestions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as ProjectSuggestion[];
  },
};
