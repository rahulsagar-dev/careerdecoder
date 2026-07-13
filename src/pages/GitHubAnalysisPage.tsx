import { useState, useEffect } from "react";
import { Github, Star, GitFork, Code, FileText, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { githubService, type GithubAnalysis, type RepoAnalysis } from "@/services/githubService";
import { handleFeatureError } from "@/services/featureGate";
import { useAuth } from "@/context/AuthContext";

function scoreColor(score: number) {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

function scoreStroke(score: number) {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-yellow-500";
  return "stroke-red-500";
}

function complexityColor(score: number) {
  if (score >= 8) return "bg-green-500/10 text-green-700 border-green-200";
  if (score >= 5) return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
  return "bg-red-500/10 text-red-700 border-red-200";
}

const GitHubAnalysisPage = () => {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<GithubAnalysis | null>(null);
  const [repos, setRepos] = useState<RepoAnalysis[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const existing = await githubService.getGithubAnalysis();
        if (existing) {
          setAnalysis(existing);
          setGithubUrl(existing.github_url);
          const repoData = await githubService.getRepoAnalysis(existing.id);
          setRepos(repoData);
        }
      } catch { /* no existing data */ }
      setLoading(false);
    };
    load();
  }, []);

  const handleAnalyze = async () => {
    if (!githubUrl.trim()) {
      toast.error("Please enter a GitHub profile URL");
      return;
    }
    if (!githubUrl.includes("github.com/")) {
      toast.error("Please enter a valid GitHub URL (e.g. https://github.com/username)");
      return;
    }

    setAnalyzing(true);
    setStep("Fetching repositories…");
    try {
      setTimeout(() => setStep("Analyzing projects…"), 3000);
      setTimeout(() => setStep("Computing portfolio score…"), 6000);

      const result = await githubService.analyzeGithubProfile(githubUrl.trim());
      setAnalysis(result.analysis);
      setRepos(result.repos);
      toast.success("GitHub portfolio analyzed successfully!");
    } catch (err: any) {
      handleFeatureError(err, "Failed to analyze GitHub profile");
    } finally {
      setAnalyzing(false);
      setStep("");
    }
  };

  if (loading) {
    return (
      <DashboardLayout userName={user?.user_metadata?.full_name}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userName={user?.user_metadata?.full_name}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Github className="h-7 w-7" />
            GitHub Portfolio Analysis
          </h1>
          <p className="text-muted-foreground mt-1">Evaluate your developer portfolio with real GitHub data</p>
        </div>

        {/* Input Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Input
                placeholder="https://github.com/username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                disabled={analyzing}
                className="flex-1"
              />
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Github className="h-4 w-4 mr-2" />}
                {analyzing ? "Analyzing…" : "Analyze Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {analyzing && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 flex flex-col items-center gap-4 py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-primary">{step}</p>
              <Progress value={step.includes("Computing") ? 80 : step.includes("Analyzing") ? 50 : 20} className="w-64" />
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!analysis && !analyzing && (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                <Github className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">No analysis yet</p>
                <p className="text-sm text-muted-foreground mt-1">Enter your GitHub profile URL above to evaluate your portfolio</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {analysis && !analyzing && (
          <>
            {/* Score + Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Portfolio Score */}
              <Card className="md:col-span-1 flex flex-col items-center justify-center py-6">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="52" fill="none"
                      className={scoreStroke(analysis.portfolio_score)}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${(analysis.portfolio_score / 100) * 327} 327`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${scoreColor(analysis.portfolio_score)}`}>
                      {analysis.portfolio_score}
                    </span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <p className="text-sm font-medium mt-2">Portfolio Score</p>
              </Card>

              {/* Stats */}
              <Card>
                <CardContent className="pt-6 text-center">
                  <Code className="h-5 w-5 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{analysis.total_repos}</p>
                  <p className="text-xs text-muted-foreground">Repositories</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-5 w-5 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{analysis.total_commits}</p>
                  <p className="text-xs text-muted-foreground">Est. Commits</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Code className="h-5 w-5 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{analysis.languages?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Languages</p>
                </CardContent>
              </Card>
            </div>

            {/* Languages */}
            {analysis.languages && analysis.languages.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Languages Used</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {analysis.languages.map((lang) => (
                    <Badge key={lang} variant="secondary">{lang}</Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-green-600">💪 Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(analysis.strengths || []).map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {s}
                      </li>
                    ))}
                    {(!analysis.strengths || analysis.strengths.length === 0) && (
                      <p className="text-sm text-muted-foreground">No strengths identified yet</p>
                    )}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-amber-600">⚠️ Areas to Improve</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(analysis.weaknesses || []).map((w, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        {w}
                      </li>
                    ))}
                    {(!analysis.weaknesses || analysis.weaknesses.length === 0) && (
                      <p className="text-sm text-muted-foreground">No weaknesses identified</p>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Repo Cards */}
            {repos.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Repository Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {repos.map((repo) => (
                    <Card key={repo.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Code className="h-4 w-4 text-primary" />
                            {repo.repo_name}
                          </CardTitle>
                          <a
                            href={`https://github.com/${analysis.github_url.replace(/.*github\.com\//, "").replace(/\/$/, "")}/${repo.repo_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                        {repo.description && (
                          <CardDescription className="line-clamp-2">{repo.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-yellow-500" /> {repo.stars}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3.5 w-3.5 text-muted-foreground" /> {repo.forks}
                          </span>
                          {repo.primary_language && (
                            <Badge variant="outline" className="text-xs">{repo.primary_language}</Badge>
                          )}
                          <span className="text-muted-foreground text-xs">{repo.commit_count} commits</span>
                        </div>

                        {/* Complexity Score */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Complexity:</span>
                          <Badge variant="outline" className={complexityColor(repo.complexity_score)}>
                            {repo.complexity_score}/10
                          </Badge>
                        </div>

                        {/* Repo Insights */}
                        {(repo.strengths?.length > 0 || repo.weaknesses?.length > 0) && (
                          <div className="text-xs space-y-1 pt-1 border-t">
                            {repo.strengths?.slice(0, 2).map((s, i) => (
                              <p key={`s-${i}`} className="text-green-600">✓ {s}</p>
                            ))}
                            {repo.weaknesses?.slice(0, 2).map((w, i) => (
                              <p key={`w-${i}`} className="text-amber-600">⚠ {w}</p>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GitHubAnalysisPage;
