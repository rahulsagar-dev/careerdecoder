import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import { enforceUsage } from "../_shared/enforceUsage.ts";

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

    const gate = await enforceUsage(user.id, "career-report", { increment: false });
    if (!gate.ok) return new Response(JSON.stringify(gate.body), { status: gate.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });


    // Fetch all user data
    const [profileRes, careersRes, skillRes, roadmapRes, resumeRes, githubRes, marketRes] = await Promise.allSettled([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("career_recommendations").select("*").eq("user_id", user.id).order("match_score", { ascending: false }).limit(5),
      supabase.from("skill_analysis").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("learning_roadmaps").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("resume_analysis").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("github_analysis").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("market_data").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const profile = profileRes.status === "fulfilled" ? profileRes.value.data : null;
    const careers = careersRes.status === "fulfilled" ? (careersRes.value.data || []) : [];
    const skillAnalysis = skillRes.status === "fulfilled" ? skillRes.value.data : null;
    const roadmap = roadmapRes.status === "fulfilled" ? roadmapRes.value.data : null;
    const resume = resumeRes.status === "fulfilled" ? resumeRes.value.data : null;
    const github = githubRes.status === "fulfilled" ? githubRes.value.data : null;
    const market = marketRes.status === "fulfilled" ? marketRes.value.data : null;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Compute final readiness score
    const skillsScore = skillAnalysis?.readiness_score ?? 0;
    const resumeScore = resume?.ats_score ?? 0;
    const githubScore = github?.portfolio_score ?? 0;
    const marketScore = market?.market_position_score ?? 0;
    const projectScore = roadmap ? roadmap.progress : 0;

    const finalScore = Math.round(
      0.25 * skillsScore + 0.20 * resumeScore + 0.20 * githubScore + 0.20 * marketScore + 0.15 * projectScore
    );

    // Build context for AI
    const contextData = {
      profile: profile ? { name: profile.full_name, degree: profile.degree, college: profile.college, career_goal: profile.career_goal, skills: profile.skills } : null,
      top_careers: careers.slice(0, 3).map((c: any) => ({ title: c.career_title, score: c.match_score, missing: c.missing_skills })),
      skill_gap: skillAnalysis ? { readiness: skillAnalysis.readiness_score, matched: skillAnalysis.matched_skills, missing: skillAnalysis.missing_skills } : null,
      resume: resume ? { ats_score: resume.ats_score, strengths: resume.strengths, weaknesses: resume.weaknesses } : null,
      github: github ? { score: github.portfolio_score, strengths: github.strengths, weaknesses: github.weaknesses } : null,
      market: market ? { position: market.market_position_score, demand: market.demand_level, trending: market.trending_skills } : null,
      final_score: finalScore,
    };

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
            content: "You are a senior career counselor writing a comprehensive, recruiter-level career readiness report. Be specific, actionable, and personalized. No generic platitudes.",
          },
          {
            role: "user",
            content: `Generate a comprehensive career readiness report based on this data: ${JSON.stringify(contextData)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "career_report",
              description: "Generate a structured career readiness report",
              parameters: {
                type: "object",
                properties: {
                  report_summary: { type: "string", description: "2-3 sentence executive summary of the candidate" },
                  career_fit: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        career: { type: "string" },
                        fit_reason: { type: "string" },
                        score: { type: "number" },
                      },
                      required: ["career", "fit_reason", "score"],
                    },
                    description: "Top 3 career fits with reasons",
                  },
                  skill_gap_summary: { type: "string", description: "Analysis of skill gaps and learning priorities" },
                  market_analysis: { type: "string", description: "Market position analysis and outlook" },
                  portfolio_review: { type: "string", description: "Resume + GitHub portfolio assessment" },
                  action_plan: {
                    type: "object",
                    properties: {
                      short_term: { type: "array", items: { type: "string" }, description: "1-3 month actions" },
                      mid_term: { type: "array", items: { type: "string" }, description: "3-6 month actions" },
                      long_term: { type: "array", items: { type: "string" }, description: "6-12 month actions" },
                    },
                    required: ["short_term", "mid_term", "long_term"],
                  },
                },
                required: ["report_summary", "career_fit", "skill_gap_summary", "market_analysis", "portfolio_review", "action_plan"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "career_report" } },
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI error:", aiResponse.status, await aiResponse.text());
      throw new Error("AI request failed");
    }

    const aiData = await aiResponse.json();
    let report;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      report = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("Failed to parse report data");
    }

    return new Response(JSON.stringify({
      report,
      scores: {
        skills: skillsScore,
        resume: resumeScore,
        github: githubScore,
        market: marketScore,
        projects: projectScore,
        final: finalScore,
      },
      raw: contextData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("career-report error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
