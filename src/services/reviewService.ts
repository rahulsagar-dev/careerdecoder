import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  user_id: string;
  name: string;
  role: string | null;
  avatar_initials: string;
  rating: number;
  quote: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  approved_at: string | null;
}

export const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const shortDisplayName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return fullName;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

export const reviewService = {
  async getApproved(): Promise<Review[]> {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("status", "approved")
      .order("approved_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Review[];
  },

  async getMine(userId: string): Promise<Review | null> {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as Review | null;
  },

  async submit(payload: {
    user_id: string;
    name: string;
    role: string | null;
    rating: number;
    quote: string;
  }): Promise<Review> {
    const row = {
      ...payload,
      avatar_initials: initialsFromName(payload.name),
      status: "pending" as const,
      approved_at: null,
    };
    const { data, error } = await supabase
      .from("reviews")
      .upsert(row, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw error;
    return data as Review;
  },

  async listAll(): Promise<Review[]> {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Review[];
  },

  async setStatus(id: string, status: "approved" | "rejected" | "pending"): Promise<void> {
    const update = {
      status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from("reviews").update(update).eq("id", id);
    if (error) throw error;
  },

  async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (error) return false;
    return !!(data as { is_admin?: boolean } | null)?.is_admin;
  },
};
