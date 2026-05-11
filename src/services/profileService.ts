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

const sanitizeProfileData = (profileData: ProfileData): ProfileData => ({
  full_name: profileData.full_name,
  education: profileData.education,
  college: profileData.college,
  degree: profileData.degree,
  graduation_year: profileData.graduation_year,
  skills: profileData.skills || [],
  interests: profileData.interests || [],
  career_goal: profileData.career_goal,
  resume_url: profileData.resume_url,
  github_url: profileData.github_url,
});

const getResumePath = (pathOrUrl: string) => {
  let path = pathOrUrl;
  const marker = "/resumes/";
  const idx = pathOrUrl.indexOf(marker);
  if (idx !== -1) {
    path = pathOrUrl.substring(idx + marker.length).split("?")[0];
  }
  return decodeURIComponent(path);
};

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
      .upsert({ id: user.id, ...sanitizeProfileData(profileData) }, { onConflict: "id" })
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
      .upsert({ id: user.id, ...sanitizeProfileData(profileData) }, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getResumeSignedUrl(pathOrUrl: string): Promise<string> {
    if (!pathOrUrl) throw new Error("No resume on file");
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(getResumePath(pathOrUrl), 300);
    if (error) throw error;
    if (!data?.signedUrl) throw new Error("Failed to create resume link");
    return data.signedUrl;
  },

  async getResumeBlobUrl(pathOrUrl: string): Promise<string> {
    if (!pathOrUrl) throw new Error("No resume on file");
    const { data, error } = await supabase.storage.from("resumes").download(getResumePath(pathOrUrl));
    if (error) throw error;
    return URL.createObjectURL(data);
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
