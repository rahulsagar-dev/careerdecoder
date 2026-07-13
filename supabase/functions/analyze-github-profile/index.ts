import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceUsage } from "../_shared/enforceUsage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractUsername(url: string): string | null {
  const cleaned = url.replace(/\/+$/, "").trim();
  const match = cleaned.match(/github\.com\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

async function githubFetch(url: string) {
  const res = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "CareerDecode-Analyzer",
    },
  });
  if (res.status === 403 || res.status === 429) {
    throw new Error("GitHub API rate limit exceeded. Try again later.");
  }
  if (res.status === 404) {
    throw new Error("GitHub user not found.");
  }
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

// ── Scoring Functions ──

function scoreCommitConsistency(repos: any[]): number {
  if (repos.length === 0) return 0;
  const totalCommits = repos.reduce((s: number, r: any) => s + (r._commitCount || 0), 0);
  const reposWithCommits = repos.filter((r: any) => (r._commitCount || 0) > 3).length;
  const ratioActive = reposWithCommits / Math.max(repos.length, 1);

  let score = 0;
  // Volume score (0-50)
  if (totalCommits >= 500) score += 50;
  else if (totalCommits >= 200) score += 40;
  else if (totalCommits >= 100) score += 30;
  else if (totalCommits >= 50) score += 20;
  else if (totalCommits >= 20) score += 10;
  else score += 5;

  // Spread score (0-50)
  score += Math.round(ratioActive * 50);

  return Math.min(score, 100);
}

function scoreTechDiversity(languages: string[]): number {
  const modern = ["typescript", "python", "rust", "go", "kotlin", "swift", "javascript", "dart"];
  const unique = [...new Set(languages.map(l => l.toLowerCase()))];
  const count = unique.length;
  const modernCount = unique.filter(l => modern.includes(l)).length;

  let score = 0;
  if (count >= 6) score += 60;
  else if (count >= 4) score += 45;
  else if (count >= 2) score += 30;
  else if (count >= 1) score += 15;

  score += Math.min(modernCount * 10, 40);
  return Math.min(score, 100);
}

function scoreProjectQuality(repos: any[]): number {
  if (repos.length === 0) return 0;
  const totalStars = repos.reduce((s: number, r: any) => s + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((s: number, r: any) => s + (r.forks_count || 0), 0);
  const withDesc = repos.filter((r: any) => r.description && r.description.length > 10).length;

  let score = 0;
  if (totalStars >= 50) score += 40;
  else if (totalStars >= 20) score += 30;
  else if (totalStars >= 5) score += 20;
  else if (totalStars >= 1) score += 10;

  if (totalForks >= 20) score += 30;
  else if (totalForks >= 5) score += 20;
  else if (totalForks >= 1) score += 10;

  score += Math.round((withDesc / Math.max(repos.length, 1)) * 30);
  return Math.min(score, 100);
}

function scoreDocumentation(repos: any[]): number {
  if (repos.length === 0) return 0;
  const withReadme = repos.filter((r: any) => r._hasReadme).length;
  const ratio = withReadme / repos.length;
  return Math.round(ratio * 100);
}

function scoreDeployment(repos: any[]): number {
  if (repos.length === 0) return 0;
  const deployKeywords = ["vercel", "netlify", "heroku", "railway", "render", "firebase", "surge", "gh-pages", "github.io", "demo", "live"];
  let deployed = 0;
  for (const r of repos) {
    const homepage = (r.homepage || "").toLowerCase();
    const desc = (r.description || "").toLowerCase();
    const hasDeployment = r.has_pages || deployKeywords.some(k => homepage.includes(k) || desc.includes(k)) || (homepage.startsWith("http") && homepage.length > 10);
    if (hasDeployment) deployed++;
  }
  const ratio = deployed / repos.length;
  return Math.round(ratio * 100);
}

function computePortfolioScore(repos: any[], languages: string[]): { score: number; components: Record<string, number> } {
  const commits = scoreCommitConsistency(repos);
  const diversity = scoreTechDiversity(languages);
  const quality = scoreProjectQuality(repos);
  const docs = scoreDocumentation(repos);
  const deploy = scoreDeployment(repos);

  const score = Math.round(
    0.25 * commits +
    0.20 * diversity +
    0.25 * quality +
    0.15 * docs +
    0.15 * deploy
  );

  return { score: Math.min(Math.max(score, 0), 100), components: { commits, diversity, quality, docs, deploy } };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Not authenticated");

    const gate = await enforceUsage(user.id, "github-analysis", { increment: true });
    if (!gate.ok) return new Response(JSON.stringify(gate.body), { status: gate.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Get github_url from request body or profile
    let githubUrl: string;
    try {
      const body = await req.json();
      githubUrl = body.github_url;
    } catch {
      githubUrl = "";
    }

    if (!githubUrl) {
      const { data: profile } = await supabase.from("profiles").select("github_url").eq("id", user.id).single();
      githubUrl = profile?.github_url || "";
    }

    if (!githubUrl) throw new Error("No GitHub URL provided. Add it in your profile or provide it in the request.");

    const username = extractUsername(githubUrl);
    if (!username) throw new Error("Invalid GitHub URL. Expected format: https://github.com/username");

    console.log(`Analyzing GitHub profile: ${username}`);

    // Fetch user repos (up to 100)
    const repos = await githubFetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
    if (!Array.isArray(repos) || repos.length === 0) {
      throw new Error("No public repositories found for this GitHub user.");
    }

    // Filter out forks, get top 20 by stars+activity
    const ownRepos = repos
      .filter((r: any) => !r.fork)
      .sort((a: any, b: any) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count))
      .slice(0, 20);

    // Fetch commit counts and README for top repos (parallel, limited)
    const enriched = await Promise.all(ownRepos.map(async (repo: any) => {
      let commitCount = 0;
      let hasReadme = false;
      try {
        const commits = await githubFetch(`https://api.github.com/repos/${username}/${repo.name}/commits?per_page=1`);
        // Use link header to estimate total commits
        commitCount = Array.isArray(commits) ? Math.max(commits.length, 1) : 1;
        // Simple heuristic: if repo has been updated many times
        if (repo.size > 100) commitCount = Math.max(commitCount, Math.round(repo.size / 50));
      } catch { /* rate limit fallback */ }

      try {
        await githubFetch(`https://api.github.com/repos/${username}/${repo.name}/readme`);
        hasReadme = true;
      } catch { hasReadme = false; }

      return { ...repo, _commitCount: commitCount, _hasReadme: hasReadme };
    }));

    // Collect all languages
    const allLanguages: string[] = [];
    for (const r of enriched) {
      if (r.language) allLanguages.push(r.language);
    }
    const uniqueLanguages = [...new Set(allLanguages)];
    const totalCommits = enriched.reduce((s: number, r: any) => s + r._commitCount, 0);

    // Compute portfolio score
    const { score: portfolioScore, components } = computePortfolioScore(enriched, uniqueLanguages);

    // Generate strengths & weaknesses deterministically
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (components.commits >= 60) strengths.push("Strong commit activity across repositories");
    else weaknesses.push("Low commit activity — aim for consistent contributions");

    if (components.diversity >= 60) strengths.push("Good technology diversity in portfolio");
    else weaknesses.push("Limited language diversity — explore more technologies");

    if (components.quality >= 50) strengths.push("Projects show community engagement (stars/forks)");
    else weaknesses.push("Low community engagement — add better descriptions and share projects");

    if (components.docs >= 60) strengths.push("Good documentation with READMEs present");
    else weaknesses.push("Missing documentation — add README files to all projects");

    if (components.deploy >= 40) strengths.push("Deployed projects demonstrate practical skills");
    else weaknesses.push("Few deployed projects — add live demos to showcase work");

    if (enriched.length >= 10) strengths.push(`Solid portfolio with ${enriched.length} original repositories`);
    else if (enriched.length <= 3) weaknesses.push("Few original projects — build more to strengthen portfolio");

    // Use AI for per-repo complexity analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const repoAnalysisData = [];

    for (const repo of enriched.slice(0, 10)) {
      let complexity = 5;
      let repoStrengths: string[] = [];
      let repoWeaknesses: string[] = [];

      if (LOVABLE_API_KEY) {
        try {
          const prompt = `Analyze this GitHub repository for a developer portfolio evaluation.
Repo: ${repo.name}
Description: ${repo.description || "None"}
Language: ${repo.language || "Unknown"}
Stars: ${repo.stargazers_count}, Forks: ${repo.forks_count}
Has README: ${repo._hasReadme}
Size (KB): ${repo.size}

Evaluate complexity (1-10 scale), list 2 strengths and 2 weaknesses as a portfolio piece.`;

          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LOVABLE_API_KEY}` },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: "You are a technical portfolio evaluator. Analyze repos for hiring relevance." },
                { role: "user", content: prompt },
              ],
              tools: [{
                type: "function",
                function: {
                  name: "evaluateRepo",
                  description: "Evaluate a repository",
                  parameters: {
                    type: "object",
                    properties: {
                      complexity_score: { type: "integer", minimum: 1, maximum: 10 },
                      strengths: { type: "array", items: { type: "string" }, maxItems: 3 },
                      weaknesses: { type: "array", items: { type: "string" }, maxItems: 3 },
                    },
                    required: ["complexity_score", "strengths", "weaknesses"],
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "evaluateRepo" } },
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall) {
              const parsed = JSON.parse(toolCall.function.arguments);
              complexity = Math.max(1, Math.min(10, parsed.complexity_score || 5));
              repoStrengths = (parsed.strengths || []).slice(0, 3);
              repoWeaknesses = (parsed.weaknesses || []).slice(0, 3);
            }
          }
        } catch (e) {
          console.error(`AI analysis failed for ${repo.name}:`, e);
        }
      }

      repoAnalysisData.push({
        repo_name: repo.name,
        description: repo.description || "",
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        primary_language: repo.language || "",
        commit_count: repo._commitCount || 0,
        complexity_score: complexity,
        strengths: repoStrengths,
        weaknesses: repoWeaknesses,
      });
    }

    // Delete old analysis
    await supabase.from("repo_analysis").delete().in(
      "analysis_id",
      (await supabase.from("github_analysis").select("id").eq("user_id", user.id)).data?.map((r: any) => r.id) || []
    );
    await supabase.from("github_analysis").delete().eq("user_id", user.id);

    // Insert new analysis
    const { data: analysis, error: insertErr } = await supabase
      .from("github_analysis")
      .insert({
        user_id: user.id,
        github_url: githubUrl,
        total_repos: enriched.length,
        total_commits: totalCommits,
        languages: uniqueLanguages,
        portfolio_score: portfolioScore,
        strengths,
        weaknesses,
      })
      .select()
      .single();

    if (insertErr) throw new Error(`Failed to save analysis: ${insertErr.message}`);

    // Insert repo analyses
    if (repoAnalysisData.length > 0) {
      const { error: repoErr } = await supabase
        .from("repo_analysis")
        .insert(repoAnalysisData.map(r => ({ ...r, analysis_id: analysis.id })));

      if (repoErr) console.error("Failed to save repo analysis:", repoErr);
    }

    // Fetch saved repo data
    const { data: savedRepos } = await supabase
      .from("repo_analysis")
      .select("*")
      .eq("analysis_id", analysis.id)
      .order("stars", { ascending: false });

    return new Response(JSON.stringify({ analysis, repos: savedRepos || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
