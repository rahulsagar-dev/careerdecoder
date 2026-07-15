import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceUsage } from "../_shared/enforceUsage.ts";

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

    const gate = await enforceUsage(userId, "linkedin-analysis", { increment: true });
    if (!gate.ok) return new Response(JSON.stringify(gate.body), { status: gate.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const parsedText: string = (body.parsedText || "").toString();
    const sections = body.sections || {};
    let targetCareer: string = (body.targetCareer || "").toString();

    if (!parsedText || parsedText.length < 50) {
      return new Response(JSON.stringify({ error: "Missing parsed LinkedIn text" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auto-resolve target career if not provided
    if (!targetCareer) {
      const { data: careers } = await supabase
        .from("career_recommendations")
        .select("career_title, match_score")
        .eq("user_id", userId)
        .order("match_score", { ascending: false })
        .limit(1);
      targetCareer = careers?.[0]?.career_title || "General";
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const systemPrompt = `You are an expert LinkedIn profile reviewer and career coach. Analyze the LinkedIn profile text below and produce a structured evaluation tailored to the user's target career: "${targetCareer}".

RULES:
- Score each dimension 0-100 based ONLY on what appears in the profile.
- Be specific and actionable. Reference actual content when possible.
- Do not invent skills or experience not shown.
- Suggestions must be concrete rewrites or additions, not generic advice.
- keyword_gaps: list keywords/skills expected for the target career that are missing from the profile.`;

    const userPrompt = `TARGET CAREER: ${targetCareer}

LINKEDIN PROFILE TEXT:
${parsedText.slice(0, 14000)}

SECTIONS (best-effort split):
Headline: ${(sections.headline || "").slice(0, 500)}
About: ${(sections.about || "").slice(0, 2000)}
Experience: ${(sections.experience || "").slice(0, 3000)}
Skills: ${(sections.skills || "").slice(0, 1000)}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "linkedin_analysis",
            description: "Structured LinkedIn profile analysis",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "number" },
                headline_score: { type: "number" },
                about_score: { type: "number" },
                experience_score: { type: "number" },
                skills_score: { type: "number" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["title", "description", "priority"],
                  },
                },
                keyword_gaps: { type: "array", items: { type: "string" } },
              },
              required: ["overall_score", "headline_score", "about_score", "experience_score", "skills_score", "strengths", "weaknesses", "suggestions", "keyword_gaps"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "linkedin_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI processing failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI failed to produce structured output" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const analysis = JSON.parse(toolCall.function.arguments);

    // Insert as service role (bypass RLS for the write) but scope to userId
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: row, error: insertErr } = await admin
      .from("linkedin_analysis")
      .insert({
        user_id: userId,
        overall_score: Math.round(analysis.overall_score || 0),
        headline_score: Math.round(analysis.headline_score || 0),
        about_score: Math.round(analysis.about_score || 0),
        experience_score: Math.round(analysis.experience_score || 0),
        skills_score: Math.round(analysis.skills_score || 0),
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        suggestions: analysis.suggestions || [],
        keyword_gaps: analysis.keyword_gaps || [],
        parsed_text: parsedText.slice(0, 20000),
        target_career: targetCareer,
      })
      .select("*")
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to save analysis" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ analysis: row }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
