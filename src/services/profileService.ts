import { supabase } from "@/integrations/supabase/client";

export interface ProfileData {
  full_name?: string;
  education?: string;
  college?: string;
  degree?: string;
  graduation_year?: number;
  skills?: string[];
  interests?: string[];
  career_goal?: string;
  resume_url?: string;
  github_url?: string;
}

export const profileService = {
  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createProfile(profileData: ProfileData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .insert({ id: user.id, ...profileData })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(profileData: ProfileData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadResume(file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/resume.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("resumes")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  },
};
