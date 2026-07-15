import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import { enforceUsage } from "../_shared/enforceUsage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- Skill normalization ----------
const SKILL_SYNONYMS: Record<string, string> = {
  "js": "javascript",
  "ecmascript": "javascript",
  "ts": "typescript",
  "reactjs": "react",
  "react.js": "react",
  "nextjs": "next.js",
  "node": "node.js",
  "nodejs": "node.js",
  "py": "python",
  "golang": "go",
  "k8s": "kubernetes",
  "tf": "terraform",
  "postgres": "postgresql",
  "ml": "machine learning",
  "dl": "deep learning",
  "nlp": "natural language processing",
  "cv": "computer vision",
  "gcp": "google cloud",
  "aws cloud": "aws",
  "tailwindcss": "tailwind",
  "rest api": "rest",
  "restful": "rest",
  "html/css": "html css",
  "css/html": "html css",
  "oops": "object oriented programming",
  "oop": "object oriented programming",
  "object-oriented programming": "object oriented programming",
  "data viz": "data visualization",
  "visualisation": "visualization",
};

const normalize = (s: string) =>
  (SKILL_SYNONYMS[s.trim().toLowerCase()] || s.trim().toLowerCase())
    .replace(/[^a-z0-9+.# ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const fuzzyMatch = (a: string, b: string) => {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 3 && b.length >= 3 && (a.includes(b) || b.includes(a))) return true;
  const aTokens = new Set(a.split(" ").filter((token) => token.length >= 3));
  const bTokens = b.split(" ").filter((token) => token.length >= 3);
  if (bTokens.some((token) => aTokens.has(token))) return true;
  return false;
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

    const { role, user_skills } = await req.json();
    if (!role || typeof role !== "string" || role.trim().length < 2 || role.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid role (2-100 characters required)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (user_skills !== undefined && (!Array.isArray(user_skills) || user_skills.length > 100 || user_skills.some((s: unknown) => typeof s !== "string" || s.length > 100))) {
      return new Response(JSON.stringify({ error: "Invalid user_skills (max 100 items, each up to 100 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profile (skills + experience for context)
    let skills: string[] = Array.isArray(user_skills) ? user_skills : [];
    let experienceLevel = "entry";
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills")
      .eq("id", user.id)
      .single();
    if (!skills.length) skills = profile?.skills || [];
    if (profile?.experience_level) experienceLevel = profile.experience_level;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a senior market analyst specializing in the INDIAN tech job market (NCR, Bangalore, Hyderabad, Pune, Chennai, Mumbai). You have access to current hiring trends from Naukri, LinkedIn India, Instahyre, and Cutshort. ALL salary figures MUST be in Indian Rupees (₹) using LPA (Lakhs Per Annum) format. Be realistic and data-driven — Indian salaries differ significantly from US figures (do NOT use US numbers). Calibrate to the candidate experience level: "${experienceLevel}".`,
          },
          {
            role: "user",
            content: `Generate comprehensive market intelligence for "${role}" in India.

Candidate skills: [${skills.join(", ") || "none provided"}]
Experience: ${experienceLevel}

Requirements:
1. Trending skills (10-12) MUST be specific and currently in demand for THIS role in India 2025-2026.
2. Declining skills (3-5) — actually losing relevance for this role.
3. Salary ranges in ₹ LPA — provide realistic India bands by experience tier.
4. skill_demand_scores: rate 0-100 for each trending skill AND each user skill (so we can compare).
5. Include top hiring cities and top hiring companies in India for this role.
6. high_impact_skills: 5 skills the user does NOT have but should learn (highest ROI).
7. strategy_plan: 5-6 specific, actionable steps tied to the candidate's gap.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "market_insights",
              description: "Structured Indian-market intelligence for a role",
              parameters: {
                type: "object",
                properties: {
                  trending_skills: { type: "array", items: { type: "string" }, description: "10-12 trending skills (specific tech/tools, not categories)" },
                  declining_skills: { type: "array", items: { type: "string" }, description: "3-5 declining skills" },
                  salary_range: { type: "string", description: "Overall realistic India salary band, e.g. '₹6 LPA - ₹22 LPA'" },
                  salary_by_experience: {
                    type: "object",
                    description: "Salary bands by tier in ₹ LPA",
                    properties: {
                      entry: { type: "string", description: "0-2 yrs, e.g. '₹4 LPA - ₹8 LPA'" },
                      mid: { type: "string", description: "3-6 yrs" },
                      senior: { type: "string", description: "7+ yrs" },
                    },
                    required: ["entry", "mid", "senior"],
                    additionalProperties: false,
                  },
                  demand_level: { type: "string", enum: ["High", "Medium", "Low"] },
                  competition_level: { type: "string", enum: ["High", "Medium", "Low"] },
                  role_growth_rate: { type: "number", description: "Annual role growth %, realistic India figure 5-30" },
                  skill_demand_scores: {
                    type: "object",
                    description: "Skill name → 0-100 demand score. Include trending skills AND user skills.",
                    additionalProperties: { type: "number" },
                  },
                  top_hiring_cities: { type: "array", items: { type: "string" }, description: "5 Indian cities hiring most for this role" },
                  top_hiring_companies: { type: "array", items: { type: "string" }, description: "8 companies actively hiring this role in India" },
                  insights: { type: "string", description: "2-3 paragraph market analysis specific to India" },
                  high_impact_skills: { type: "array", items: { type: "string" }, description: "5 skills user does NOT have but should learn" },
                  strategy_plan: { type: "array", items: { type: "string" }, description: "5-6 specific, actionable strategic recommendations" },
                },
                required: ["trending_skills", "declining_skills", "salary_range", "salary_by_experience", "demand_level", "competition_level", "role_growth_rate", "skill_demand_scores", "top_hiring_cities", "top_hiring_companies", "insights", "high_impact_skills", "strategy_plan"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "market_insights" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
      if (aiResponse.status === 402) throw new Error("AI credits exhausted. Please add credits in Lovable AI settings.");
      throw new Error(`AI request failed (${aiResponse.status})`);
    }

    const aiData = await aiResponse.json();
    let marketData: any;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) throw new Error("No tool call in AI response");
      marketData = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Parse error:", e, JSON.stringify(aiData).slice(0, 500));
      throw new Error("Failed to parse market data from AI");
    }

    // ---------- Deterministic weighted Market Position Score ----------
    // Blend: 70% weighted-by-demand skill coverage + 30% raw coverage
    const userNorm = skills.map(normalize).filter(Boolean);
    const trendingNorm = (marketData.trending_skills || []).map(normalize);
    const decliningNorm = (marketData.declining_skills || []).map(normalize);
    const demandScores: Record<string, number> = marketData.skill_demand_scores || {};

    const totalDemandWeight = trendingNorm.reduce((sum: number, s: string) => {
      // Find demand score for this trending skill (case-insensitive lookup)
      const key = Object.keys(demandScores).find((k) => normalize(k) === s);
      return sum + (key ? Math.max(0, Math.min(100, demandScores[key])) : 50);
    }, 0);

    const matchedDemandWeight = trendingNorm.reduce((sum: number, t: string) => {
      const isMatched = userNorm.some((u: string) => fuzzyMatch(u, t));
      if (!isMatched) return sum;
      const key = Object.keys(demandScores).find((k) => normalize(k) === t);
      return sum + (key ? Math.max(0, Math.min(100, demandScores[key])) : 50);
    }, 0);

    const weightedCoverage = totalDemandWeight > 0
      ? (matchedDemandWeight / totalDemandWeight) * 100
      : 0;

    const matchedCount = trendingNorm.filter((t: string) =>
      userNorm.some((u: string) => fuzzyMatch(u, t))
    ).length;
    const rawCoverage = trendingNorm.length > 0 ? (matchedCount / trendingNorm.length) * 100 : 0;

    // Penalty for declining skills the user still emphasizes
    const decliningHits = userNorm.filter((u: string) =>
      decliningNorm.some((d: string) => fuzzyMatch(u, d))
    ).length;
    const decliningPenalty = Math.min(15, decliningHits * 5);

    let marketPositionScore = Math.round(weightedCoverage * 0.7 + rawCoverage * 0.3 - decliningPenalty);
    marketPositionScore = Math.max(0, Math.min(100, marketPositionScore));

    // ---------- Skill gap with priority ----------
    const skillGaps = trendingNorm
      .map((t: string, i: number) => {
        const original = marketData.trending_skills[i];
        const matched = userNorm.some((u: string) => fuzzyMatch(u, t));
        if (matched) return null;
        const key = Object.keys(demandScores).find((k) => normalize(k) === t);
        const score = key ? demandScores[key] : 50;
        const priority = score >= 80 ? "Critical" : score >= 60 ? "High" : "Medium";
        return { skill: original, demand_score: score, priority };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.demand_score - a.demand_score)
      .slice(0, 8);

    // Delete old data for this role/user, insert new
    await supabase
      .from("market_data")
      .delete()
      .eq("user_id", user.id)
      .eq("role", role);

    const { data: inserted, error: insertError } = await supabase
      .from("market_data")
      .insert({
        user_id: user.id,
        role,
        trending_skills: marketData.trending_skills,
        declining_skills: marketData.declining_skills || [],
        salary_range: marketData.salary_range,
        demand_level: marketData.demand_level,
        competition_level: marketData.competition_level || "Medium",
        role_growth_rate: marketData.role_growth_rate || 0,
        skill_demand_scores: {
          ...(marketData.skill_demand_scores || {}),
          __meta__: {
            salary_by_experience: marketData.salary_by_experience,
            top_hiring_cities: marketData.top_hiring_cities || [],
            top_hiring_companies: marketData.top_hiring_companies || [],
            skill_gaps: skillGaps,
            matched_skills: trendingNorm.filter((t: string) =>
              userNorm.some((u: string) => fuzzyMatch(u, t))
            ),
            experience_level: experienceLevel,
          },
        },
        insights: marketData.insights,
        market_position_score: marketPositionScore,
        high_impact_skills: marketData.high_impact_skills || [],
        strategy_plan: marketData.strategy_plan || [],
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    return new Response(JSON.stringify({ data: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("market-insights error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
