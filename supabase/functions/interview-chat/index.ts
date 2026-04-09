import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { session_id, user_message, mode, role } = await req.json();
    if (!session_id || !user_message || !mode || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify session belongs to user
    const { data: session } = await supabase
      .from("interview_sessions")
      .select("id")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .single();

    if (!session) throw new Error("Session not found");

    // Store user message
    await supabase.from("interview_messages").insert({
      session_id,
      sender: "user",
      message: user_message,
    });

    // Get conversation history
    const { data: messages } = await supabase
      .from("interview_messages")
      .select("sender, message")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true });

    const history = (messages || []).map((m: any) => ({
      role: m.sender === "ai" ? "assistant" : "user",
      content: m.message,
    }));

    const systemPrompts: Record<string, string> = {
      HR: `You are an experienced HR interviewer conducting an interview for a ${role} position. Ask behavioral and personality-based questions. Focus on culture fit, teamwork, conflict resolution, and motivation. Ask one question at a time. Be professional but friendly. Adapt follow-up questions based on the candidate's responses. Do not repeat questions.`,
      Technical: `You are a senior technical interviewer for a ${role} position. Ask deep technical concept questions relevant to the role. Cover algorithms, system design, coding concepts, and domain-specific knowledge. Ask one question at a time. Increase difficulty based on candidate performance. Provide brief acknowledgment before the next question.`,
      Behavioral: `You are a behavioral interview expert conducting a ${role} interview. Use the STAR method (Situation, Task, Action, Result) framework. Ask scenario-based questions about leadership, problem-solving, and decision-making. Ask one question at a time. Probe deeper if answers lack specifics.`,
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompts[mode] || systemPrompts.Technical },
          ...history,
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI request failed");
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    // Store AI message
    await supabase.from("interview_messages").insert({
      session_id,
      sender: "ai",
      message: aiMessage,
    });

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interview-chat error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
