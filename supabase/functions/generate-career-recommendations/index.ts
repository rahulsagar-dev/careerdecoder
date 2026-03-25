import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found. Please complete your profile first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a career counselor AI. Analyze the user's profile and suggest 5-7 relevant career paths.

For each career, calculate a realistic match_score (0-100) based on the overlap between the user's skills and the career's required skills. The formula should be:
match_score = (number of user skills that match required skills / total required skills) * 100

Be specific and realistic. Do not give generic answers.

Return your response by calling the provided function.`;

    const userPrompt = `User Profile:
- Name: ${profile.full_name || "Unknown"}
- Education: ${profile.education || "Not specified"}
- Degree: ${profile.degree || "Not specified"}
- College: ${profile.college || "Not specified"}
- Skills: ${(profile.skills || []).join(", ") || "None"}
- Interests: ${(profile.interests || []).join(", ") || "None"}
- Career Goal: ${profile.career_goal || "Not specified"}`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_careers",
              description: "Return 5-7 career recommendations with match scores and skill analysis",
              parameters: {
                type: "object",
                properties: {
                  careers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        career_title: { type: "string" },
                        match_score: { type: "integer", minimum: 0, maximum: 100 },
                        required_skills: { type: "array", items: { type: "string" } },
                        missing_skills: { type: "array", items: { type: "string" } },
                        description: { type: "string" },
                        salary_range: { type: "string" },
                      },
                      required: ["career_title", "match_score", "required_skills", "missing_skills", "description", "salary_range"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["careers"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_careers" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const careers = parsed.careers;

    // Delete old recommendations
    await supabase.from("career_recommendations").delete().eq("user_id", userId);

    // Insert new recommendations
    const rows = careers.map((c: any) => ({
      user_id: userId,
      career_title: c.career_title,
      match_score: Math.min(100, Math.max(0, Math.round(c.match_score))),
      required_skills: c.required_skills || [],
      missing_skills: c.missing_skills || [],
      description: c.description || "",
      salary_range: c.salary_range || "",
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("career_recommendations")
      .insert(rows)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to store recommendations" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ recommendations: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
