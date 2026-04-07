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

// ── Industry Weight Maps ──
const INDUSTRY_WEIGHTS: Record<string, Record<string, number>> = {
  "frontend developer": {
    "react": 3, "javascript": 3, "typescript": 3, "css": 3, "html": 3,
    "nextjs": 2, "vue": 2, "angular": 2, "tailwind": 2, "testing": 2,
  },
  "backend developer": {
    "nodejs": 3, "python": 3, "java": 3, "databases": 3, "sql": 3,
    "api design": 3, "system design": 3, "docker": 2, "express": 2,
  },
  "full stack developer": {
    "javascript": 3, "typescript": 3, "react": 3, "nodejs": 3,
    "sql": 3, "html": 2, "css": 2, "docker": 2, "api design": 2,
  },
  "data scientist": {
    "python": 3, "machine learning": 3, "statistics": 3,
    "data visualization": 3, "sql": 3, "pandas": 3, "numpy": 3,
    "deep learning": 2, "tensorflow": 2, "pytorch": 2,
  },
  "machine learning engineer": {
    "python": 3, "machine learning": 3, "deep learning": 3,
    "tensorflow": 3, "pytorch": 3, "statistics": 3,
    "docker": 2, "kubernetes": 2, "sql": 2,
  },
  "devops engineer": {
    "docker": 3, "kubernetes": 3, "linux": 3, "continuous integration": 3,
    "terraform": 3, "amazon web services": 3, "python": 2,
  },
  "mobile developer": {
    "swift": 3, "kotlin": 3, "react native": 3, "flutter": 3,
    "javascript": 2, "typescript": 2, "dart": 2,
  },
  "software engineer": {
    "data structures": 3, "algorithms": 3, "system design": 3,
    "git": 2, "testing": 2, "databases": 2, "api design": 2,
  },
  "ai engineer": {
    "python": 3, "machine learning": 3, "deep learning": 3,
    "natural language processing": 3, "llm": 3, "transformers": 3,
    "tensorflow": 2, "pytorch": 2,
  },
};

// ── Skill Dependency Graph ──
const SKILL_DEPENDENCIES: Record<string, string[]> = {
  "react": ["javascript", "html", "css"],
  "nextjs": ["react", "javascript"],
  "angular": ["typescript", "javascript", "html", "css"],
  "vue": ["javascript", "html", "css"],
  "nodejs": ["javascript"],
  "express": ["nodejs", "javascript"],
  "django": ["python"],
  "flask": ["python"],
  "typescript": ["javascript"],
  "machine learning": ["python", "statistics"],
  "deep learning": ["machine learning", "python"],
  "tensorflow": ["python", "machine learning"],
  "pytorch": ["python", "machine learning"],
  "natural language processing": ["machine learning", "python"],
  "computer vision": ["machine learning", "python"],
  "transformers": ["deep learning", "natural language processing"],
  "llm": ["deep learning", "natural language processing"],
  "docker": ["linux"],
  "kubernetes": ["docker"],
  "redux": ["react", "javascript"],
  "tailwind": ["css", "html"],
  "postgresql": ["sql"],
  "mysql": ["sql"],
  "dynamodb": ["databases", "amazon web services"],
};

function computeIndustryAlignment(
  resumeSkills: string[],
  techStack: string[],
  careerTitle: string,
): number {
  const career = careerTitle.toLowerCase().trim();
  let weights: Record<string, number> | null = null;
  for (const [key, w] of Object.entries(INDUSTRY_WEIGHTS)) {
    if (career.includes(key) || key.includes(career)) {
      weights = w;
      break;
    }
  }
  if (!weights) return 50; // neutral if no industry match

  const allSkills = [...new Set([...resumeSkills, ...techStack].map(normalize))];
  let totalWeight = 0;
  let matchedWeight = 0;

  for (const [wSkill, wVal] of Object.entries(weights)) {
    totalWeight += wVal;
    const normW = normalize(wSkill);
    if (allSkills.some(s => s === normW || s.includes(normW) || normW.includes(s))) {
      matchedWeight += wVal;
    }
  }

  return totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 50;
}

function buildLearningPath(
  missingSkills: string[],
  userSkillsNorm: string[],
): Array<{ skill: string; level: string; depends_on: string[] }> {
  const missingNorm = missingSkills.map(normalize);
  const needed = new Set<string>(missingNorm);

  function expandDeps(skill: string, visited: Set<string>): void {
    if (visited.has(skill)) return;
    visited.add(skill);
    const deps = SKILL_DEPENDENCIES[skill] || [];
    for (const dep of deps) {
      const depNorm = normalize(dep);
      if (!userSkillsNorm.includes(depNorm)) {
        needed.add(depNorm);
        expandDeps(depNorm, visited);
      }
    }
  }

  const visited = new Set<string>();
  for (const skill of missingNorm) expandDeps(skill, visited);

  // Kahn's topological sort
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const skill of needed) {
    if (!graph.has(skill)) graph.set(skill, []);
    if (!inDegree.has(skill)) inDegree.set(skill, 0);
    const deps = SKILL_DEPENDENCIES[skill] || [];
    for (const dep of deps) {
      const depNorm = normalize(dep);
      if (needed.has(depNorm)) {
        if (!graph.has(depNorm)) graph.set(depNorm, []);
        graph.get(depNorm)!.push(skill);
        inDegree.set(skill, (inDegree.get(skill) || 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [node, deg] of inDegree) {
    if (deg === 0) queue.push(node);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    queue.sort();
    const node = queue.shift()!;
    sorted.push(node);
    for (const neighbor of (graph.get(node) || [])) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }
  for (const skill of needed) {
    if (!sorted.includes(skill)) sorted.push(skill);
  }

  function depthOf(skill: string, memo: Map<string, number>): number {
    if (memo.has(skill)) return memo.get(skill)!;
    const deps = (SKILL_DEPENDENCIES[skill] || []).map(normalize).filter(d => needed.has(d));
    if (deps.length === 0) { memo.set(skill, 0); return 0; }
    const maxDep = Math.max(...deps.map(d => depthOf(d, memo)));
    memo.set(skill, maxDep + 1);
    return maxDep + 1;
  }

  const depthMemo = new Map<string, number>();
  return sorted.map(skill => {
    const depth = depthOf(skill, depthMemo);
    const deps = (SKILL_DEPENDENCIES[skill] || []).map(normalize).filter(d => needed.has(d));
    return {
      skill,
      level: depth === 0 ? "foundation" : depth === 1 ? "intermediate" : "advanced",
      depends_on: deps,
    };
  });
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

    // ── Compute industry alignment score ──
    const industryAlignmentScore = computeIndustryAlignment(
      parsed_data.extracted_skills || [],
      parsed_data.tech_stack || [],
      career_title || "General",
    );

    // ── Build recommended learning path ──
    const userSkillsNorm = (parsed_data.extracted_skills || []).map(normalize);
    const recommendedLearningPath = buildLearningPath(missing_skills || [], userSkillsNorm);

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume evaluator. Score the resume based on these weighted criteria:
- Keyword Match (30%): How well do the resume skills match the required skills for the target career?
- Formatting & Structure (25%): Does the resume have clear sections, proper organization?
- Impact Metrics (25%): Does the resume include quantified achievements (%, numbers, results)?
- Action Verbs (20%): Does it use strong action verbs (Built, Developed, Led, Optimized, Designed)?

The industry alignment score for this resume is ${industryAlignmentScore}/100.
Factor this into your overall assessment — a high alignment means the resume is well-suited for the target career.

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

    // Blend ATS score with industry alignment: 80% AI score + 20% industry alignment
    const rawAts = scored.ats_score || 0;
    const blendedAts = Math.max(0, Math.min(100, Math.round(rawAts * 0.8 + industryAlignmentScore * 0.2)));

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
        ats_score: blendedAts,
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

    // Return extended response with industry alignment + learning path
    return new Response(JSON.stringify({
      analysis,
      industry_alignment_score: industryAlignmentScore,
      recommended_learning_path: recommendedLearningPath,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
