import { supabase } from "@/integrations/supabase/client";

export interface LearningRoadmap {
  id: string;
  user_id: string;
  career_title: string;
  total_steps: number;
  completed_steps: number;
  progress: number;
  created_at: string;
}

export interface RoadmapStep {
  id: string;
  roadmap_id: string;
  step_order: number;
  title: string;
  description: string;
  resources: string[];
  estimated_time: string;
  status: string;
  created_at: string;
}

export const roadmapService = {
  async generateRoadmap(careerTitle: string, missingSkills: string[] = []) {
    const { data, error } = await supabase.functions.invoke("generate-learning-roadmap", {
      body: { career_title: careerTitle, missing_skills: missingSkills },
    });
    if (error) throw new Error(error.message || "Failed to generate roadmap");
    if (data?.error) throw new Error(data.error);
    return data as { roadmap: LearningRoadmap; steps: RoadmapStep[] };
  },

  async getRoadmap(): Promise<LearningRoadmap | null> {
    const { data, error } = await supabase
      .from("learning_roadmaps")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as LearningRoadmap | null;
  },

  async getStepsByRoadmap(roadmapId: string): Promise<RoadmapStep[]> {
    const { data, error } = await supabase
      .from("roadmap_steps")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .order("step_order", { ascending: true });
    if (error) throw error;
    return (data || []) as RoadmapStep[];
  },

  async updateStepStatus(stepId: string, status: string, roadmapId: string) {
    const { error } = await supabase
      .from("roadmap_steps")
      .update({ status })
      .eq("id", stepId);
    if (error) throw error;

    // Recalculate progress
    const steps = await this.getStepsByRoadmap(roadmapId);
    const completed = steps.filter((s) => s.status === "completed").length;
    const progress = Math.round((completed / steps.length) * 100);

    await supabase
      .from("learning_roadmaps")
      .update({ completed_steps: completed, progress })
      .eq("id", roadmapId);

    return { completed, progress };
  },
};
