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

  async getResumeSignedUrl(pathOrUrl: string): Promise<string> {
    if (!pathOrUrl) throw new Error("No resume on file");
    let path = pathOrUrl;
    const marker = "/resumes/";
    const idx = pathOrUrl.indexOf(marker);
    if (idx !== -1) path = pathOrUrl.substring(idx + marker.length);
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
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

    // Store the file path (not a public URL) since the bucket is private
    return filePath;
  },
};
