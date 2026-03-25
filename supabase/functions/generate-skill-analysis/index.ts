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

    // Fetch profile
    const { data: profile } = await supabase.from("profiles").select("skills").eq("id", userId).single();
    const userSkills = profile?.skills || [];

    // Fetch career recommendations
    const { data: recommendations } = await supabase
      .from("career_recommendations")
      .select("required_skills, missing_skills")
      .eq("user_id", userId);

    if (!recommendations || recommendations.length === 0) {
      return new Response(JSON.stringify({ error: "No career recommendations found. Generate recommendations first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aggregate all required and missing skills across recommendations
    const allRequiredSet = new Set<string>();
    const allMissingSet = new Set<string>();

    for (const rec of recommendations) {
      for (const s of (rec.required_skills || [])) allRequiredSet.add(s.toLowerCase());
      for (const s of (rec.missing_skills || [])) allMissingSet.add(s.toLowerCase());
    }

    const totalRequired = allRequiredSet.size;
    const matchedCount = totalRequired - allMissingSet.size;
    const missingCount = allMissingSet.size;

    // Readiness score
    const readinessScore = totalRequired > 0 ? Math.min(100, Math.round((matchedCount / totalRequired) * 100)) : 0;

    // Skill distribution by category
    const categories: Record<string, string[]> = {
      "Programming": ["python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab"],
      "Web Development": ["react", "angular", "vue", "html", "css", "node.js", "express", "django", "flask", "next.js", "tailwind", "bootstrap"],
      "Data Science": ["pandas", "numpy", "scipy", "matplotlib", "jupyter", "data analysis", "statistics", "data visualization", "tableau", "power bi"],
      "AI/ML": ["machine learning", "deep learning", "tensorflow", "pytorch", "nlp", "computer vision", "neural networks", "ai", "llm", "transformers"],
      "Cloud & DevOps": ["aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "terraform", "jenkins", "linux", "git"],
      "Databases": ["sql", "mongodb", "postgresql", "mysql", "redis", "firebase", "dynamodb", "elasticsearch"],
      "Tools & Other": [],
    };

    const distribution: Record<string, number> = {};
    const categorizedSkills = new Set<string>();

    for (const [category, keywords] of Object.entries(categories)) {
      if (category === "Tools & Other") continue;
      let count = 0;
      for (const skill of userSkills) {
        const lower = skill.toLowerCase();
        if (keywords.some(k => lower.includes(k) || k.includes(lower))) {
          count++;
          categorizedSkills.add(lower);
        }
      }
      if (count > 0) distribution[category] = count;
    }

    // Remaining skills go to "Tools & Other"
    const otherCount = userSkills.filter(s => !categorizedSkills.has(s.toLowerCase())).length;
    if (otherCount > 0) distribution["Tools & Other"] = otherCount;

    // Delete old analysis
    await supabase.from("skill_analysis").delete().eq("user_id", userId);

    // Insert new analysis
    const { data: analysis, error: insertError } = await supabase
      .from("skill_analysis")
      .insert({
        user_id: userId,
        total_skills: userSkills.length,
        matched_skills: Math.max(0, matchedCount),
        missing_skills: missingCount,
        readiness_score: readinessScore,
        skill_distribution: distribution,
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
