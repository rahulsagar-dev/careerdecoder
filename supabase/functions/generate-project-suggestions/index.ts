import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceUsage } from "../_shared/enforceUsage.ts";
import { acquireSlot, releaseSlot, busyResponse } from "../_shared/aiGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const gate = await enforceUsage(userId, "project-suggestions", { increment: false });
    if (!gate.ok) {
      return new Response(JSON.stringify(gate.body), { status: gate.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const slot = await acquireSlot(userId, "project-suggestions");
    if (!slot.ok) return busyResponse(slot.waitSeconds, corsHeaders);

    try {


    const { missing_skills, career_title } = await req.json();

    if (career_title !== undefined && (typeof career_title !== "string" || career_title.length > 200)) {
      return new Response(JSON.stringify({ error: "career_title must be a string up to 200 characters" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (missing_skills !== undefined && (!Array.isArray(missing_skills) || missing_skills.length > 50 || missing_skills.some((s: unknown) => typeof s !== "string" || s.length > 100))) {
      return new Response(JSON.stringify({ error: "missing_skills must be an array of up to 50 strings (each up to 100 chars)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const systemPrompt = `You are a project mentor AI. Suggest 4-6 portfolio-worthy projects that directly address skill gaps for someone pursuing a career as "${career_title || "software developer"}".

Rules:
- Projects must be specific and portfolio-worthy
- Avoid generic ideas like "todo app" or "calculator"
- Each project should teach multiple skills from the missing skills list
- Difficulty must be realistic (Beginner, Intermediate, Advanced)
- Include estimated completion time

Return your response by calling the provided function.`;

    const userPrompt = `Profile:
- Current Skills: ${(profile?.skills || []).join(", ") || "None"}
- Career Target: ${career_title || profile?.career_goal || "Not specified"}
- Missing Skills: ${(missing_skills || []).join(", ") || "Not specified"}

Suggest 4-6 meaningful projects to build these missing skills.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_projects",
            description: "Return 4-6 project suggestions with details",
            parameters: {
              type: "object",
              properties: {
                projects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      difficulty: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] },
                      skills_covered: { type: "array", items: { type: "string" } },
                      estimated_time: { type: "string" },
                    },
                    required: ["title", "description", "difficulty", "skills_covered", "estimated_time"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["projects"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_projects" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: aiResponse.status === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const projects = parsed.projects;

    // Delete old suggestions
    await supabase.from("project_suggestions").delete().eq("user_id", userId);

    // Insert new
    const rows = projects.map((p: any) => ({
      user_id: userId,
      title: p.title,
      description: p.description,
      difficulty: p.difficulty,
      skills_covered: p.skills_covered || [],
      estimated_time: p.estimated_time,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("project_suggestions")
      .insert(rows)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to store projects" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await enforceUsage(userId, "project-suggestions", { increment: true });

    return new Response(JSON.stringify({ projects: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    } finally {
      await releaseSlot(userId, "project-suggestions");
    }
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
