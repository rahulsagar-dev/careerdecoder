import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceUsage } from "../_shared/enforceUsage.ts";

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
};

function normalize(skill: string): string {
  const s = skill.toLowerCase().trim();
  return SYNONYMS[s] || s;
}

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
  "spring boot": ["java"],
  "kotlin": ["java"],
};

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

    const { career_title, missing_skills } = await req.json();

    if (!career_title || typeof career_title !== "string" || career_title.length > 200) {
      return new Response(JSON.stringify({ error: "career_title is required (string up to 200 characters)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (missing_skills !== undefined && (!Array.isArray(missing_skills) || missing_skills.length > 50 || missing_skills.some((s: unknown) => typeof s !== "string" || s.length > 100))) {
      return new Response(JSON.stringify({ error: "missing_skills must be an array of up to 50 strings (each up to 100 chars)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Build dependency-aware learning path ──
    const userSkillsNorm = (profile?.skills || []).map((s: string) => normalize(s));
    const learningPath = buildLearningPath(missing_skills || [], userSkillsNorm);

    // Use topologically sorted skills to guide the AI roadmap
    const orderedSkills = learningPath.map(lp => `${lp.skill} (${lp.level})`);

    const systemPrompt = `You are a career learning advisor. Create a structured learning roadmap for someone pursuing a career as "${career_title}".

The roadmap must have 6-12 steps that progress logically:
1. Fundamentals & prerequisites
2. Core skill building
3. Intermediate concepts
4. Advanced topics
5. Portfolio projects
6. Job-readiness preparation

IMPORTANT: Follow this recommended learning order based on skill dependencies:
${orderedSkills.join(" → ")}

Foundation skills should come first, then intermediate, then advanced.
Each step must be specific, actionable, and include real tools/technologies/resources.
Do NOT give generic steps like "learn more" or "practice coding".
Include real course names, platforms, tools, and technologies.

Return your response by calling the provided function.`;

    const userPrompt = `Profile:
- Current Skills: ${(profile?.skills || []).join(", ") || "None"}
- Education: ${profile?.degree || "Not specified"} from ${profile?.college || "Not specified"}
- Career Goal: ${profile?.career_goal || career_title}
- Missing Skills to acquire (in dependency order): ${orderedSkills.join(", ") || (missing_skills || []).join(", ") || "Not specified"}

Create a detailed, actionable learning roadmap for becoming a ${career_title}.`;

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
            name: "create_roadmap",
            description: "Create a structured learning roadmap with 6-12 ordered steps",
            parameters: {
              type: "object",
              properties: {
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      step_order: { type: "integer" },
                      title: { type: "string" },
                      description: { type: "string" },
                      resources: { type: "array", items: { type: "string" } },
                      estimated_time: { type: "string" },
                    },
                    required: ["step_order", "title", "description", "resources", "estimated_time"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["steps"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_roadmap" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: aiResponse.status === 429 ? "Rate limit exceeded. Try again later." : "AI service error" }), {
        status: aiResponse.status === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const steps = parsed.steps.sort((a: any, b: any) => a.step_order - b.step_order);

    // Delete old roadmaps for this user
    await supabase.from("learning_roadmaps").delete().eq("user_id", userId);

    // Insert roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from("learning_roadmaps")
      .insert({
        user_id: userId,
        career_title,
        total_steps: steps.length,
        completed_steps: 0,
        progress: 0,
      })
      .select()
      .single();

    if (roadmapError || !roadmap) {
      console.error("Roadmap insert error:", roadmapError);
      return new Response(JSON.stringify({ error: "Failed to store roadmap" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert steps
    const stepRows = steps.map((s: any) => ({
      roadmap_id: roadmap.id,
      step_order: s.step_order,
      title: s.title,
      description: s.description,
      resources: s.resources || [],
      estimated_time: s.estimated_time,
      status: "pending",
    }));

    const { data: insertedSteps, error: stepsError } = await supabase
      .from("roadmap_steps")
      .insert(stepRows)
      .select();

    if (stepsError) {
      console.error("Steps insert error:", stepsError);
      return new Response(JSON.stringify({ error: "Failed to store roadmap steps" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      roadmap,
      steps: insertedSteps,
      learning_path: learningPath,
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
