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

    const { role } = await req.json();
    if (!role) {
      return new Response(JSON.stringify({ error: "Missing role" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a career market analyst with access to current industry trends. Provide realistic, data-driven market insights.",
          },
          {
            role: "user",
            content: `Provide current market intelligence for the role: "${role}". Include trending skills, salary ranges, demand level, and actionable insights.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "market_insights",
              description: "Return structured market intelligence data",
              parameters: {
                type: "object",
                properties: {
                  trending_skills: { type: "array", items: { type: "string" }, description: "Top 8-12 trending skills for this role" },
                  salary_range: { type: "string", description: "Salary range like '$80,000 - $140,000'" },
                  demand_level: { type: "string", enum: ["High", "Medium", "Low"], description: "Current market demand" },
                  insights: { type: "string", description: "2-3 paragraph analysis of market trends, growth outlook, and advice" },
                },
                required: ["trending_skills", "salary_range", "demand_level", "insights"],
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
        salary_range: marketData.salary_range,
        demand_level: marketData.demand_level,
        insights: marketData.insights,
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
