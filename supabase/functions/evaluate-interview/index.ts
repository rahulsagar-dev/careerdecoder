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
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: session } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .single();

    if (!session) throw new Error("Session not found");

    const { data: messages } = await supabase
      .from("interview_messages")
      .select("sender, message")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true });

    if (!messages || messages.length < 2) {
      return new Response(JSON.stringify({ error: "Not enough conversation to evaluate" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const conversation = messages.map((m: any) =>
      `${m.sender === "ai" ? "Interviewer" : "Candidate"}: ${m.message}`
    ).join("\n\n");

    const weakTopics = session.weak_topics || [];
    const topicsCovered = session.topics_covered || [];

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
          {
            role: "system",
            content: `You are an expert interview evaluator. Analyze the interview conversation thoroughly. The candidate interviewed for a ${session.role} position in ${session.mode} mode. Topics covered: ${topicsCovered.join(", ") || "various"}. Detected weak areas during session: ${weakTopics.join(", ") || "none"}.

Evaluate across 5 dimensions. Be honest and specific — reference actual answers from the conversation.`,
          },
          {
            role: "user",
            content: `Evaluate this interview:\n\n${conversation}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "evaluate_interview",
              description: "Provide structured interview evaluation with 5 dimensions",
              parameters: {
                type: "object",
                properties: {
                  clarity: { type: "number", description: "Clarity and structure of answers 0-100" },
                  technical_depth: { type: "number", description: "Depth of technical/domain knowledge 0-100" },
                  problem_solving: { type: "number", description: "Logical thinking and approach to problems 0-100" },
                  communication: { type: "number", description: "Flow, articulation, grammar 0-100" },
                  confidence: { type: "number", description: "Certainty, decisiveness in answers 0-100" },
                  strengths: { type: "array", items: { type: "string" }, description: "3-5 specific strengths demonstrated, referencing actual answers" },
                  weaknesses: { type: "array", items: { type: "string" }, description: "3-5 specific weaknesses, referencing actual answers" },
                  missed_concepts: { type: "array", items: { type: "string" }, description: "Topics the candidate failed, skipped, or explained incorrectly" },
                  improvement_plan: { type: "array", items: { type: "string" }, description: "5-7 specific, actionable steps to improve (e.g., 'Practice explaining REST API design patterns', 'Study system design fundamentals')" },
                },
                required: ["clarity", "technical_depth", "problem_solving", "communication", "confidence", "strengths", "weaknesses", "missed_concepts", "improvement_plan"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "evaluate_interview" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI eval error:", aiResponse.status, errText);
      throw new Error("AI evaluation failed");
    }

    const aiData = await aiResponse.json();
    let evaluation;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      evaluation = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("Failed to parse evaluation");
    }

    // New weighted scoring: 25% clarity, 25% depth, 20% problem_solving, 15% communication, 15% confidence
    const score = Math.round(
      0.25 * evaluation.clarity +
      0.25 * evaluation.technical_depth +
      0.20 * evaluation.problem_solving +
      0.15 * evaluation.communication +
      0.15 * evaluation.confidence
    );

    const feedback = {
      clarity: evaluation.clarity,
      technical_depth: evaluation.technical_depth,
      problem_solving: evaluation.problem_solving,
      communication: evaluation.communication,
      confidence: evaluation.confidence,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      missed_concepts: evaluation.missed_concepts,
      improvement_plan: evaluation.improvement_plan,
    };

    await supabase
      .from("interview_sessions")
      .update({ score, feedback })
      .eq("id", session_id);

    return new Response(JSON.stringify({ score, feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-interview error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
