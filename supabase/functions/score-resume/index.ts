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

    const { parsed_data, career_title, required_skills, missing_skills } = await req.json();

    if (!parsed_data) {
      return new Response(JSON.stringify({ error: "No parsed resume data provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume evaluator. Score the resume based on these weighted criteria:
- Keyword Match (30%): How well do the resume skills match the required skills for the target career?
- Formatting & Structure (25%): Does the resume have clear sections, proper organization?
- Impact Metrics (25%): Does the resume include quantified achievements (%, numbers, results)?
- Action Verbs (20%): Does it use strong action verbs (Built, Developed, Led, Optimized, Designed)?

Provide honest, specific, and actionable feedback. Do not inflate scores.`;

    const userPrompt = `Evaluate this resume for the career: "${career_title || "General"}"

Resume Skills: ${JSON.stringify(parsed_data.extracted_skills || [])}
Tech Stack: ${JSON.stringify(parsed_data.tech_stack || [])}
Experience: ${JSON.stringify(parsed_data.experience || [])}
Projects: ${JSON.stringify(parsed_data.projects || [])}

Required Skills for Career: ${JSON.stringify(required_skills || [])}
Currently Missing Skills: ${JSON.stringify(missing_skills || [])}

Score the resume (0-100) and provide strengths, weaknesses, and suggestions.`;

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
              name: "score_resume",
              description: "Return ATS score and feedback for the resume",
              parameters: {
                type: "object",
                properties: {
                  ats_score: {
                    type: "integer",
                    description: "Overall ATS compatibility score 0-100",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "Resume strengths (3-5 items)",
                  },
                  weaknesses: {
                    type: "array",
                    items: { type: "string" },
                    description: "Resume weaknesses (3-5 items)",
                  },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Actionable improvement suggestions (3-6 items)",
                  },
                },
                required: ["ats_score", "strengths", "weaknesses", "suggestions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "score_resume" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
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
      return new Response(JSON.stringify({ error: "AI scoring failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI failed to produce score" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scored = JSON.parse(toolCall.function.arguments);
    const atsScore = Math.max(0, Math.min(100, scored.ats_score || 0));

    // Delete old analysis
    await supabase.from("resume_analysis").delete().eq("user_id", userId);

    // Insert new analysis
    const { data: analysis, error: insertError } = await supabase
      .from("resume_analysis")
      .insert({
        user_id: userId,
        extracted_skills: parsed_data.extracted_skills || [],
        extracted_experience: parsed_data.experience || [],
        extracted_projects: parsed_data.projects || [],
        tech_stack: parsed_data.tech_stack || [],
        ats_score: atsScore,
        strengths: scored.strengths || [],
        weaknesses: scored.weaknesses || [],
        suggestions: scored.suggestions || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to store analysis" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
