import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Synonym map ──
const SYNONYMS: Record<string, string> = {
  js: "javascript", ts: "typescript", ml: "machine learning",
  ai: "artificial intelligence", "react.js": "react", reactjs: "react",
  "node.js": "nodejs", node: "nodejs", "next.js": "nextjs",
  "vue.js": "vue", vuejs: "vue", "express.js": "express", expressjs: "express",
  "angular.js": "angular", angularjs: "angular", py: "python", cpp: "c++",
  "c sharp": "c#", csharp: "c#", postgres: "postgresql", mongo: "mongodb",
  k8s: "kubernetes", aws: "amazon web services", gcp: "google cloud platform",
  dl: "deep learning", nlp: "natural language processing", cv: "computer vision",
  dsa: "data structures", ds: "data structures", html5: "html", css3: "css", scss: "sass",
};

function normalize(skill: string): string {
  const s = skill.toLowerCase().trim();
  return SYNONYMS[s] || s;
}

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

// Skill categorization keywords
const SKILL_CATEGORIES: Record<string, string[]> = {
  "Programming": ["python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab"],
  "Web Development": ["react", "angular", "vue", "html", "css", "nodejs", "express", "django", "flask", "nextjs", "tailwind", "bootstrap"],
  "Data Science": ["pandas", "numpy", "scipy", "matplotlib", "jupyter", "data analysis", "statistics", "data visualization", "tableau", "power bi"],
  "AI/ML": ["machine learning", "deep learning", "tensorflow", "pytorch", "natural language processing", "computer vision", "neural networks", "artificial intelligence", "llm", "transformers"],
  "Cloud & DevOps": ["amazon web services", "azure", "google cloud platform", "docker", "kubernetes", "continuous integration", "terraform", "jenkins", "linux", "git"],
  "Databases": ["sql", "mongodb", "postgresql", "mysql", "redis", "firebase", "dynamodb", "elasticsearch"],
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

    const { data: profile } = await supabase.from("profiles").select("skills").eq("id", userId).single();
    const userSkills: string[] = profile?.skills || [];
    const userNorm = userSkills.map(normalize);

    // Use LLM to get structured skill requirements for the user's top career
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Fetch career recommendations
    const { data: recommendations } = await supabase
      .from("career_recommendations")
      .select("career_title, required_skills, missing_skills, match_score")
      .eq("user_id", userId)
      .order("match_score", { ascending: false });

    if (!recommendations || recommendations.length === 0) {
      return new Response(JSON.stringify({ error: "No career recommendations found. Generate recommendations first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ask LLM to classify the skills with category/difficulty/criticality
    let structuredSkills: Array<{ name: string; category: string; difficulty: string; is_critical: boolean }> = [];

    if (LOVABLE_API_KEY) {
      const allRequiredSkills = new Set<string>();
      for (const rec of recommendations) {
        for (const s of (rec.required_skills || [])) allRequiredSkills.add(s);
      }

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
              content: `You are a skill classification AI. For each skill provided, classify it with:
- category: "core", "secondary", or "optional" (relative to the target careers)
- difficulty: "beginner", "intermediate", or "advanced"
- is_critical: true if absolutely essential for the careers

Target careers: ${recommendations.map(r => r.career_title).join(", ")}

Return structured data by calling the provided function.`,
            },
            {
              role: "user",
              content: `Classify these skills: ${[...allRequiredSkills].join(", ")}`,
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "classify_skills",
              description: "Return classified skills",
              parameters: {
                type: "object",
                properties: {
                  skills: {
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
                required: ["skills"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "classify_skills" } },
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const parsed = JSON.parse(toolCall.function.arguments);
          structuredSkills = parsed.skills || [];
        }
      }
    }

    // ── Compute weighted gap analysis ──
    let totalImpact = 0;
    let maxPossibleImpact = 0;
    let criticalCount = 0;
    let importantCount = 0;
    let optionalCount = 0;
    let matchedCount = 0;
    let missingCount = 0;

    const skillGapDetails: Array<{
      name: string;
      gap_score: number;
      priority: string;
      impact_weight: number;
      category: string;
      difficulty: string;
    }> = [];

    const processedSkills = new Set<string>();

    for (const skill of structuredSkills) {
      const normName = normalize(skill.name);
      if (processedSkills.has(normName)) continue;
      processedSkills.add(normName);

      const matchScore = getSkillMatch(userNorm, skill.name);
      const dw = mapDifficulty(skill.difficulty);
      const cw = mapCategory(skill.category);

      let gapScore: number;
      if (matchScore === 1) gapScore = 0;
      else if (matchScore >= 0.5) gapScore = 0.5;
      else gapScore = 1;

      const impact = gapScore * dw * cw;
      const maxImpact = 1 * dw * cw; // worst case gap
      totalImpact += impact;
      maxPossibleImpact += maxImpact;

      let priority: string;
      if (impact >= 2.5) { priority = "critical"; criticalCount++; }
      else if (impact >= 1.2) { priority = "important"; importantCount++; }
      else { priority = "optional"; optionalCount++; }

      if (gapScore === 0) matchedCount++;
      else missingCount++;

      skillGapDetails.push({
        name: skill.name,
        gap_score: gapScore,
        priority,
        impact_weight: Math.round(impact * 100) / 100,
        category: skill.category,
        difficulty: skill.difficulty,
      });
    }

    // If no LLM classification, fall back to simple counting
    if (structuredSkills.length === 0) {
      const allRequiredSet = new Set<string>();
      const allMissingSet = new Set<string>();
      for (const rec of recommendations) {
        for (const s of (rec.required_skills || [])) allRequiredSet.add(s.toLowerCase());
        for (const s of (rec.missing_skills || [])) allMissingSet.add(s.toLowerCase());
      }
      matchedCount = allRequiredSet.size - allMissingSet.size;
      missingCount = allMissingSet.size;
    }

    // Weighted readiness score
    const readinessScore = maxPossibleImpact > 0
      ? Math.min(100, Math.max(0, Math.round(100 - (totalImpact / maxPossibleImpact) * 100)))
      : (matchedCount + missingCount > 0 ? Math.round((matchedCount / (matchedCount + missingCount)) * 100) : 0);

    // Skill distribution by category
    const distribution: Record<string, number> = {};
    const categorizedSkills = new Set<string>();
    for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
      let count = 0;
      for (const skill of userSkills) {
        const lower = normalize(skill);
        if (keywords.some(k => lower.includes(k) || k.includes(lower))) {
          count++;
          categorizedSkills.add(skill.toLowerCase());
        }
      }
      if (count > 0) distribution[category] = count;
    }
    const otherCount = userSkills.filter(s => !categorizedSkills.has(s.toLowerCase())).length;
    if (otherCount > 0) distribution["Tools & Other"] = otherCount;

    // Sort gap details: critical first, then by impact descending
    skillGapDetails.sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 0, important: 1, optional: 2 };
      const pDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      return b.impact_weight - a.impact_weight;
    });

    // Top 5 priority skills to learn
    const topPrioritySkills = skillGapDetails
      .filter(s => s.gap_score > 0)
      .slice(0, 5)
      .map(s => s.name);

    // Build extended distribution with gap metadata
    const extendedDistribution = {
      ...distribution,
      _gap_metadata: {
        critical_count: criticalCount,
        important_count: importantCount,
        optional_count: optionalCount,
        skill_gap_details: skillGapDetails,
        top_priority_skills: topPrioritySkills,
      },
    };

    // Delete old analysis & insert new
    await supabase.from("skill_analysis").delete().eq("user_id", userId);

    const { data: analysis, error: insertError } = await supabase
      .from("skill_analysis")
      .insert({
        user_id: userId,
        total_skills: userSkills.length,
        matched_skills: Math.max(0, matchedCount),
        missing_skills: missingCount,
        readiness_score: readinessScore,
        skill_distribution: extendedDistribution,
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
