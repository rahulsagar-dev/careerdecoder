import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceUsage } from "../_shared/enforceUsage.ts";
import { hashInput, checkCache, acquireSlot, releaseSlot, busyResponse } from "../_shared/aiGuard.ts";

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

function tokenize(s: string): string[] {
  return normalize(s)
    .replace(/[()/,&\-]+/g, " ")
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !["and", "or", "the", "of", "for", "with", "in"].includes(t));
}

function getSkillMatch(userSkillsNorm: string[], requiredSkillRaw: string): number {
  const req = normalize(requiredSkillRaw);
  if (userSkillsNorm.includes(req)) return 1;

  // Substring match → user has it
  for (const us of userSkillsNorm) {
    if (us === req) return 1;
    if (us.includes(req) || req.includes(us)) return 1;
  }

  // Token-based overlap (handles "Data Visualization (Tableau/PowerBI)" vs "Data Visualization")
  const reqTokens = tokenize(requiredSkillRaw);
  const userTokenSet = new Set(userSkillsNorm.flatMap(tokenize));
  if (reqTokens.length > 0) {
    const covered = reqTokens.filter(t => userTokenSet.has(t)).length;
    const ratio = covered / reqTokens.length;
    if (ratio >= 0.6) return 1;
    if (ratio >= 0.3) return 0.5;
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
  "machine learning": ["python", "statistics", "linear algebra"],
  "deep learning": ["machine learning", "python"],
  "tensorflow": ["python", "machine learning"],
  "pytorch": ["python", "machine learning"],
  "natural language processing": ["machine learning", "python"],
  "computer vision": ["machine learning", "python"],
  "neural networks": ["machine learning"],
  "transformers": ["deep learning", "natural language processing"],
  "llm": ["deep learning", "natural language processing"],
  "data analysis": ["python", "statistics"],
  "data visualization": ["data analysis"],
  "pandas": ["python"],
  "numpy": ["python"],
  "scipy": ["python", "numpy"],
  "docker": ["linux"],
  "kubernetes": ["docker"],
  "terraform": ["cloud computing"],
  "continuous integration": ["git"],
  "system design": ["data structures", "databases"],
  "microservices": ["system design", "docker"],
  "graphql": ["api design"],
  "redux": ["react", "javascript"],
  "tailwind": ["css", "html"],
  "bootstrap": ["css", "html"],
  "sass": ["css"],
  "postgresql": ["sql"],
  "mysql": ["sql"],
  "mongodb": ["databases"],
  "redis": ["databases"],
  "elasticsearch": ["databases"],
  "dynamodb": ["databases", "amazon web services"],
  "spring boot": ["java"],
  "kotlin": ["java"],
  "swift": ["objective-c"],
  "rust": ["c++"],
};

// ── Industry Weight Maps ──
const INDUSTRY_WEIGHTS: Record<string, Record<string, number>> = {
  "frontend developer": {
    "react": 3, "javascript": 3, "typescript": 3, "css": 3, "html": 3,
    "nextjs": 2, "vue": 2, "angular": 2, "tailwind": 2, "sass": 2,
    "testing": 2, "performance": 2, "accessibility": 2, "redux": 2,
    "git": 1, "responsive design": 2, "webpack": 1,
  },
  "backend developer": {
    "nodejs": 3, "python": 3, "java": 3, "databases": 3, "sql": 3,
    "api design": 3, "system design": 3, "postgresql": 2, "mongodb": 2,
    "docker": 2, "express": 2, "django": 2, "redis": 2,
    "microservices": 2, "linux": 2, "git": 1, "testing": 2,
  },
  "full stack developer": {
    "javascript": 3, "typescript": 3, "react": 3, "nodejs": 3,
    "sql": 3, "html": 2, "css": 2, "docker": 2, "git": 2,
    "api design": 2, "postgresql": 2, "mongodb": 2, "nextjs": 2,
    "system design": 2, "testing": 2,
  },
  "data scientist": {
    "python": 3, "machine learning": 3, "statistics": 3,
    "data visualization": 3, "sql": 3, "pandas": 3, "numpy": 3,
    "deep learning": 2, "tensorflow": 2, "pytorch": 2,
    "natural language processing": 2, "data analysis": 3,
    "jupyter": 2, "r": 1, "tableau": 1,
  },
  "data analyst": {
    "sql": 3, "python": 3, "data visualization": 3, "statistics": 3,
    "data analysis": 3, "tableau": 3, "power bi": 3, "excel": 2,
    "pandas": 2, "numpy": 2, "r": 1,
  },
  "machine learning engineer": {
    "python": 3, "machine learning": 3, "deep learning": 3,
    "tensorflow": 3, "pytorch": 3, "statistics": 3,
    "docker": 2, "kubernetes": 2, "sql": 2, "data structures": 2,
    "natural language processing": 2, "computer vision": 2,
    "linear algebra": 2, "numpy": 2,
  },
  "devops engineer": {
    "docker": 3, "kubernetes": 3, "linux": 3, "continuous integration": 3,
    "terraform": 3, "amazon web services": 3, "git": 3,
    "python": 2, "bash": 2, "monitoring": 2, "networking": 2,
    "security": 2, "system design": 2,
  },
  "mobile developer": {
    "swift": 3, "kotlin": 3, "react native": 3, "flutter": 3,
    "javascript": 2, "typescript": 2, "dart": 2,
    "api design": 2, "git": 2, "testing": 2,
  },
  "cloud architect": {
    "amazon web services": 3, "azure": 3, "google cloud platform": 3,
    "system design": 3, "networking": 3, "docker": 3, "kubernetes": 3,
    "terraform": 3, "security": 2, "linux": 2, "databases": 2,
    "microservices": 2,
  },
  "cybersecurity analyst": {
    "networking": 3, "linux": 3, "security": 3, "python": 2,
    "bash": 2, "cryptography": 3, "penetration testing": 3,
    "firewalls": 2, "monitoring": 2,
  },
  "software engineer": {
    "data structures": 3, "algorithms": 3, "system design": 3,
    "git": 2, "testing": 2, "databases": 2, "api design": 2,
    "python": 2, "java": 2, "javascript": 2, "docker": 1,
  },
  "ai engineer": {
    "python": 3, "machine learning": 3, "deep learning": 3,
    "natural language processing": 3, "llm": 3, "transformers": 3,
    "tensorflow": 2, "pytorch": 2, "docker": 2, "api design": 2,
    "data structures": 2,
  },
};

function getIndustryWeight(careerTitle: string, skillName: string): number {
  const career = careerTitle.toLowerCase().trim();
  for (const [key, weights] of Object.entries(INDUSTRY_WEIGHTS)) {
    if (career.includes(key) || key.includes(career)) {
      const norm = normalize(skillName);
      for (const [wSkill, wVal] of Object.entries(weights)) {
        if (normalize(wSkill) === norm || norm.includes(normalize(wSkill)) || normalize(wSkill).includes(norm)) {
          return wVal;
        }
      }
      return 1;
    }
  }
  return 1;
}

// ── Topological sort for dependency graph ──
function buildLearningPath(
  missingSkills: string[],
  userSkillsNorm: string[],
): Array<{ skill: string; level: string; depends_on: string[] }> {
  const missingNorm = missingSkills.map(normalize);
  const needed = new Set<string>(missingNorm);

  // Expand dependencies recursively
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
  for (const skill of missingNorm) {
    expandDeps(skill, visited);
  }

  // Build adjacency for topological sort
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

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [node, deg] of inDegree) {
    if (deg === 0) queue.push(node);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    queue.sort(); // deterministic order
    const node = queue.shift()!;
    sorted.push(node);
    for (const neighbor of (graph.get(node) || [])) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // Add any remaining (circular) skills
  for (const skill of needed) {
    if (!sorted.includes(skill)) sorted.push(skill);
  }

  // Calculate dependency depth for level mapping
  function depthOf(skill: string, memo: Map<string, number>): number {
    if (memo.has(skill)) return memo.get(skill)!;
    const deps = (SKILL_DEPENDENCIES[skill] || []).map(normalize).filter(d => needed.has(d));
    if (deps.length === 0) { memo.set(skill, 0); return 0; }
    const maxDep = Math.max(...deps.map(d => depthOf(d, memo)));
    const depth = maxDep + 1;
    memo.set(skill, depth);
    return depth;
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

    const gate = await enforceUsage(userId, "skill-analysis", { increment: false });
    if (!gate.ok) return new Response(JSON.stringify(gate.body), { status: gate.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile } = await supabase.from("profiles").select("skills, career_goal").eq("id", userId).single();
    const userSkills: string[] = profile?.skills || [];
    const userNorm = userSkills.map(normalize);

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

    const topCareerTitle = recommendations[0].career_title;

    // Input-hash cache: skills + top careers => same analysis.
    const inputHash = await hashInput({
      skills: userSkills,
      career_goal: profile?.career_goal || "",
      careers: recommendations.map((r: any) => r.career_title),
    });
    const cachedAnalysis = await checkCache<any>("skill_analysis", userId, inputHash, 600);
    if (cachedAnalysis) {
      return new Response(JSON.stringify({ analysis: cachedAnalysis, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slot = await acquireSlot(userId, "skill-analysis");
    if (!slot.ok) return busyResponse(slot.waitSeconds, corsHeaders);

    const bump = await enforceUsage(userId, "skill-analysis", { increment: true });
    if (!bump.ok) {
      await releaseSlot(userId, "skill-analysis");
      return new Response(JSON.stringify(bump.body), { status: bump.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");


    // Ask LLM to classify the skills
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

    // ── Compute weighted gap analysis with industry weights ──
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
      industry_weight: number;
    }> = [];

    const processedSkills = new Set<string>();
    const missingSkillNames: string[] = [];

    for (const skill of structuredSkills) {
      const normName = normalize(skill.name);
      if (processedSkills.has(normName)) continue;
      processedSkills.add(normName);

      const matchScore = getSkillMatch(userNorm, skill.name);
      const dw = mapDifficulty(skill.difficulty);
      const cw = mapCategory(skill.category);
      const iw = getIndustryWeight(topCareerTitle, skill.name);

      let gapScore: number;
      if (matchScore === 1) gapScore = 0;
      else if (matchScore >= 0.5) gapScore = 0.5;
      else gapScore = 1;

      const impact = gapScore * dw * cw * iw;
      const maxImpact = 1 * dw * cw * iw;
      totalImpact += impact;
      maxPossibleImpact += maxImpact;

      let priority: string;
      if (impact >= 4) { priority = "critical"; criticalCount++; }
      else if (impact >= 2) { priority = "important"; importantCount++; }
      else { priority = "optional"; optionalCount++; }

      if (gapScore === 0) matchedCount++;
      else {
        missingCount++;
        missingSkillNames.push(skill.name);
      }

      skillGapDetails.push({
        name: skill.name,
        gap_score: gapScore,
        priority,
        impact_weight: Math.round(impact * 100) / 100,
        category: skill.category,
        difficulty: skill.difficulty,
        industry_weight: iw,
      });
    }

    // If no LLM classification, fall back to simple counting
    if (structuredSkills.length === 0) {
      const allRequiredSet = new Set<string>();
      const allMissingSet = new Set<string>();
      for (const rec of recommendations) {
        for (const s of (rec.required_skills || [])) allRequiredSet.add(s.toLowerCase());
        for (const s of (rec.missing_skills || [])) {
          allMissingSet.add(s.toLowerCase());
          missingSkillNames.push(s);
        }
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

    // ── Build learning path using dependency graph ──
    const learningPath = buildLearningPath(missingSkillNames, userNorm);

    // Priority breakdown
    const priorityBreakdown = {
      critical: skillGapDetails.filter(s => s.priority === "critical" && s.gap_score > 0).map(s => s.name),
      important: skillGapDetails.filter(s => s.priority === "important" && s.gap_score > 0).map(s => s.name),
      optional: skillGapDetails.filter(s => s.priority === "optional" && s.gap_score > 0).map(s => s.name),
    };

    // Build extended distribution with gap metadata + learning path
    const extendedDistribution = {
      ...distribution,
      _gap_metadata: {
        critical_count: criticalCount,
        important_count: importantCount,
        optional_count: optionalCount,
        skill_gap_details: skillGapDetails,
        top_priority_skills: topPrioritySkills,
        learning_path: learningPath,
        priority_breakdown: priorityBreakdown,
        target_career: topCareerTitle,
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
