import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Synonym map for fuzzy matching ──
const SYNONYMS: Record<string, string> = {
  js: "javascript", ts: "typescript", ml: "machine learning",
  ai: "artificial intelligence", "react.js": "react", reactjs: "react",
  "node.js": "nodejs", node: "nodejs", "next.js": "nextjs",
  "vue.js": "vue", vuejs: "vue", "express.js": "express", expressjs: "express",
  "angular.js": "angular", angularjs: "angular", py: "python", cpp: "c++",
  "c sharp": "c#", csharp: "c#", postgres: "postgresql", mongo: "mongodb",
  k8s: "kubernetes", aws: "amazon web services", gcp: "google cloud platform",
  dl: "deep learning", nlp: "natural language processing", cv: "computer vision",
  oop: "object oriented programming", ci: "continuous integration",
  cd: "continuous deployment", "ci/cd": "continuous integration",
  dsa: "data structures", ds: "data structures", html5: "html", css3: "css", scss: "sass",
};

function normalize(skill: string): string {
  const s = skill.toLowerCase().trim();
  return SYNONYMS[s] || s;
}

/** Returns 1 (exact), 0.5 (partial), 0 (none) */
function getSkillMatch(userSkillsNorm: string[], requiredSkillRaw: string): number {
  const req = normalize(requiredSkillRaw);
  if (userSkillsNorm.includes(req)) return 1;
  for (const us of userSkillsNorm) {
    if (us.includes(req) || req.includes(us)) return 0.5;
  }
  return 0;
}

function mapDifficulty(level: string): number {
  switch ((level || "").toLowerCase()) {
    case "advanced": return 3;
    case "intermediate": return 2;
    default: return 1;
  }
}

function mapCategory(cat: string): number {
  switch ((cat || "").toLowerCase()) {
    case "core": return 3;
    case "secondary": return 2;
    default: return 1;
  }
}

interface StructuredSkill {
  name: string;
  category: string;
  difficulty: string;
  is_critical: boolean;
}

interface LLMCareer {
  career_title: string;
  description: string;
  salary_range: string;
  required_skills: StructuredSkill[];
}

interface SkillGapDetail {
  name: string;
  gap_score: number;
  priority: string;
  impact_weight: number;
  category: string;
  difficulty: string;
}

function computeScore(userSkills: string[], career: LLMCareer) {
  const userNorm = userSkills.map(normalize);
  let totalWeight = 0;
  let matchedWeight = 0;
  let categoryTotal = 0;
  let categoryMatched = 0;
  let penalty = 0;
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const skillGapDetails: SkillGapDetail[] = [];

  for (const skill of career.required_skills) {
    const dw = mapDifficulty(skill.difficulty);
    const cw = mapCategory(skill.category);
    totalWeight += dw;
    categoryTotal += cw;

    const matchScore = getSkillMatch(userNorm, skill.name);

    // Gap score
    let gapScore: number;
    if (matchScore === 1) gapScore = 0;
    else if (matchScore >= 0.5) gapScore = 0.5;
    else gapScore = 1;

    const impact = gapScore * dw * cw;
    let priority: string;
    if (impact >= 2.5) priority = "critical";
    else if (impact >= 1.2) priority = "important";
    else priority = "optional";

    skillGapDetails.push({
      name: skill.name,
      gap_score: gapScore,
      priority,
      impact_weight: Math.round(impact * 100) / 100,
      category: skill.category,
      difficulty: skill.difficulty,
    });

    if (matchScore > 0) {
      matchedWeight += dw * matchScore;
      categoryMatched += cw;
      matchedSkills.push(skill.name);
    } else {
      missingSkills.push(skill.name);
      if (skill.is_critical) penalty += 10;
    }
  }

  const skillMatch = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;
  const categoryWeight = categoryTotal > 0 ? (categoryMatched / categoryTotal) * 100 : 0;
  const criticalPenalty = Math.min(penalty, 30);

  const raw = (0.5 * skillMatch) + (0.2 * skillMatch) + (0.2 * categoryWeight) - (0.1 * criticalPenalty);
  const finalScore = Math.min(100, Math.max(0, Math.round(raw)));

  return { finalScore, matchedSkills, missingSkills, skillGapDetails };
}

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("*").eq("id", userId).single();

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

For each career, return structured skill data. Do NOT compute match_score — it will be calculated server-side.

Each required_skill must include:
- name: skill name (use standard naming: "React" not "reactjs")
- category: "core", "secondary", or "optional"
- difficulty: "beginner", "intermediate", or "advanced"
- is_critical: true if this skill is absolutely essential for the role

Be specific and realistic. Return your response by calling the provided function.`;

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
        tools: [{
          type: "function",
          function: {
            name: "suggest_careers",
            description: "Return 5-7 career recommendations with structured skill data",
            parameters: {
              type: "object",
              properties: {
                careers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      career_title: { type: "string" },
                      description: { type: "string" },
                      salary_range: { type: "string" },
                      required_skills: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            category: { type: "string", enum: ["core", "secondary", "optional"] },
                            difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                            is_critical: { type: "boolean" },
                          },
                          required: ["name", "category", "difficulty", "is_critical"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["career_title", "description", "salary_range", "required_skills"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["careers"],
              additionalProperties: false,
            },
          },
        }],
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
    const careers: LLMCareer[] = parsed.careers;
    const userSkills: string[] = profile.skills || [];

    // ── Compute scores & gap details server-side ──
    const rows = careers.map((c) => {
      const { finalScore, matchedSkills, missingSkills } = computeScore(userSkills, c);
      return {
        user_id: userId,
        career_title: c.career_title,
        match_score: finalScore,
        required_skills: c.required_skills.map((s) => s.name),
        missing_skills: missingSkills,
        description: c.description || "",
        salary_range: c.salary_range || "",
      };
    });

    rows.sort((a, b) => b.match_score - a.match_score);

    await supabase.from("career_recommendations").delete().eq("user_id", userId);

    const { data: inserted, error: insertError } = await supabase
      .from("career_recommendations").insert(rows).select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to store recommendations" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build extended response with skill_gap_details per career
    const extendedRecommendations = (inserted || []).map((rec: any, i: number) => {
      const career = careers[i];
      if (!career) return rec;
      const { matchedSkills, skillGapDetails } = computeScore(userSkills, career);
      return {
        ...rec,
        matched_skills: matchedSkills,
        skill_gap_details: skillGapDetails,
      };
    });

    return new Response(JSON.stringify({ recommendations: extendedRecommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
