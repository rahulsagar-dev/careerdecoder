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

    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership and get session
    const { data: session } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .single();

    if (!session) throw new Error("Session not found");

    // Get full conversation
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

    const conversation = messages.map((m: any) => `${m.sender === "ai" ? "Interviewer" : "Candidate"}: ${m.message}`).join("\n\n");

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
            content: `You are an expert interview evaluator. Analyze the following interview conversation and provide a detailed evaluation.`,
          },
          {
            role: "user",
            content: `Evaluate this ${session.mode} interview for a ${session.role} position:\n\n${conversation}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "evaluate_interview",
              description: "Provide structured interview evaluation",
              parameters: {
                type: "object",
                properties: {
                  clarity: { type: "number", description: "Clarity score 0-100" },
                  depth: { type: "number", description: "Depth of answers 0-100" },
                  relevance: { type: "number", description: "Relevance to role 0-100" },
                  confidence: { type: "number", description: "Confidence level 0-100" },
                  strengths: { type: "array", items: { type: "string" }, description: "List of strengths shown" },
                  weaknesses: { type: "array", items: { type: "string" }, description: "List of weaknesses" },
                  improvement_areas: { type: "array", items: { type: "string" }, description: "Areas to improve" },
                },
                required: ["clarity", "depth", "relevance", "confidence", "strengths", "weaknesses", "improvement_areas"],
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

    // Compute weighted score
    const score = Math.round(
      0.4 * evaluation.clarity +
      0.3 * evaluation.depth +
      0.2 * evaluation.relevance +
      0.1 * evaluation.confidence
    );

    const feedback = {
      clarity: evaluation.clarity,
      depth: evaluation.depth,
      relevance: evaluation.relevance,
      confidence: evaluation.confidence,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      improvement_areas: evaluation.improvement_areas,
    };

    // Update session
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
