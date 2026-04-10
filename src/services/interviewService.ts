import { supabase } from "@/integrations/supabase/client";

export interface InterviewSession {
  id: string;
  user_id: string;
  mode: string;
  role: string;
  score: number;
  feedback: any;
  created_at: string;
}

export interface InterviewMessage {
  id: string;
  session_id: string;
  sender: string;
  message: string;
  created_at: string;
}

export interface InterviewChatResponse {
  message: string;
  difficulty_level: string;
  topic: string;
  is_follow_up: boolean;
  question_number: number;
}

export const interviewService = {
  async createSession(mode: string, role: string): Promise<InterviewSession> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("interview_sessions")
      .insert({ user_id: session.user.id, mode, role })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as InterviewSession;
  },

  async sendMessage(sessionId: string, userMessage: string, mode: string, role: string): Promise<InterviewChatResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("interview-chat", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { session_id: sessionId, user_message: userMessage, mode, role },
    });

    if (error) throw new Error(error.message || "Failed to send message");
    if (data?.error) throw new Error(data.error);
    return {
      message: data.message,
      difficulty_level: data.difficulty_level || "easy",
      topic: data.topic || "",
      is_follow_up: data.is_follow_up || false,
      question_number: data.question_number || 0,
    };
  },

  async evaluateInterview(sessionId: string): Promise<{ score: number; feedback: any }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("evaluate-interview", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { session_id: sessionId },
    });

    if (error) throw new Error(error.message || "Failed to evaluate");
    if (data?.error) throw new Error(data.error);
    return { score: data.score, feedback: data.feedback };
  },

  async getMessages(sessionId: string): Promise<InterviewMessage[]> {
    const { data, error } = await supabase
      .from("interview_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as InterviewMessage[];
  },

  async getSessions(): Promise<InterviewSession[]> {
    const { data, error } = await supabase
      .from("interview_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as InterviewSession[];
  },
};
