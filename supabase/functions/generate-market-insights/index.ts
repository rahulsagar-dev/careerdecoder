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

    const { role, user_skills } = await req.json();
    if (!role) {
      return new Response(JSON.stringify({ error: "Missing role" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user skills from profile if not provided
    let skills = user_skills || [];
    if (!skills.length) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("skills")
        .eq("id", user.id)
        .single();
      skills = profile?.skills || [];
    }

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
            content: `You are a career market analyst with deep knowledge of the INDIAN tech industry trends, compensation data (in INR), and hiring patterns. The user has these skills: [${skills.join(", ")}]. Provide realistic, data-driven market insights comparing their profile against the Indian market demands. ALL salary figures MUST be in Indian Rupees (INR / ₹) using LPA (Lakhs Per Annum) format.`,
          },
          {
            role: "user",
            content: `Provide comprehensive market intelligence for the role: "${role}" in the INDIAN job market. The candidate has skills: [${skills.join(", ")}]. Analyze trending vs declining skills, salary ranges (in INR LPA, e.g. "₹8 LPA - ₹18 LPA"), demand/competition levels, growth rate, and provide strategic recommendations comparing the candidate's skills against market needs.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "market_insights",
              description: "Return structured context-aware market intelligence",
              parameters: {
                type: "object",
                properties: {
                  trending_skills: { type: "array", items: { type: "string" }, description: "Top 8-12 trending/in-demand skills for this role" },
                  declining_skills: { type: "array", items: { type: "string" }, description: "3-6 skills losing market relevance for this role" },
                  salary_range: { type: "string", description: "Salary range in Indian Rupees using LPA format, e.g. '₹8 LPA - ₹18 LPA' or '₹12,00,000 - ₹25,00,000'" },
                  demand_level: { type: "string", enum: ["High", "Medium", "Low"], description: "Current market demand" },
                  competition_level: { type: "string", enum: ["High", "Medium", "Low"], description: "Competition among candidates" },
                  role_growth_rate: { type: "number", description: "Annual role growth rate percentage e.g. 15.5" },
                  skill_demand_scores: {
                    type: "object",
                    description: "Map of skill names to demand scores 0-100, include both trending and user's current skills",
                    additionalProperties: { type: "number" },
                  },
                  insights: { type: "string", description: "2-3 paragraph analysis of market trends, growth outlook" },
                  high_impact_skills: { type: "array", items: { type: "string" }, description: "Top 5 skills the user should learn for maximum career impact (skills they DON'T already have)" },
                  strategy_plan: {
                    type: "array",
                    items: { type: "string" },
                    description: "4-6 specific strategic recommendations like 'Learn TypeScript to enter top 20% candidates' or 'Avoid focusing on jQuery (declining demand)'",
                  },
                },
                required: ["trending_skills", "declining_skills", "salary_range", "demand_level", "competition_level", "role_growth_rate", "skill_demand_scores", "insights", "high_impact_skills", "strategy_plan"],
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
      throw new Error("AI request failed");
    }

    const aiData = await aiResponse.json();
    let marketData;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      marketData = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("Failed to parse market data");
    }

    // Compute market position score
    const userSkillsLower = skills.map((s: string) => s.toLowerCase());
    const trendingLower = (marketData.trending_skills || []).map((s: string) => s.toLowerCase());
    const matchedTrending = userSkillsLower.filter((s: string) =>
      trendingLower.some((t: string) => t.includes(s) || s.includes(t))
    );
    const marketPositionScore = trendingLower.length > 0
      ? Math.round((matchedTrending.length / trendingLower.length) * 100)
      : 0;

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
        skill_demand_scores: marketData.skill_demand_scores || {},
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
  } catch (e) {
    console.error("market-insights error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
