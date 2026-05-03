import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { marketService, MarketData } from "@/services/marketService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Loader2, TrendingUp, TrendingDown, DollarSign, BarChart3, Lightbulb, Search,
  Target, Zap, Shield, ArrowUpRight, MapPin, Building2, AlertTriangle, CheckCircle2,
} from "lucide-react";

const demandColors: Record<string, string> = {
  High: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Low: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const competitionColors: Record<string, string> = {
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

function positionColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-yellow-600";
  return "text-red-600";
}

const MarketIntelligencePage = () => {
  const [role, setRole] = useState("");
  const [data, setData] = useState<MarketData | null>(null);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!role.trim()) { toast.error("Enter a role"); return; }
    setGenerating(true);
    try {
      const result = await marketService.generateInsights(role.trim());
      setData(result);
      toast.success("Market insights generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const meta = data?.skill_demand_scores?.__meta__;
  const topDemandSkills = data?.skill_demand_scores
    ? Object.entries(data.skill_demand_scores)
        .filter(([k, v]) => k !== "__meta__" && typeof v === "number")
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 8) as [string, number][]
    : [];

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Market Intelligence</h1>
        <p className="text-muted-foreground mt-1">Context-aware market analysis powered by AI</p>
      </div>

      <Card className="rounded-2xl shadow-sm border">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Enter a role (e.g., Frontend Developer, ML Engineer...)"
              onKeyDown={(e) => e.key === "Enter" && generate()}
              className="flex-1"
            />
            <Button onClick={generate} disabled={generating} className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] shrink-0">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...</> : <><Search className="h-4 w-4 mr-2" /> Analyze</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-6">
          {/* Top metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="rounded-2xl shadow-sm border">
              <CardContent className="pt-5 text-center">
                <Target className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className={`text-3xl font-bold ${positionColor(data.market_position_score)}`}>{data.market_position_score}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Market Position</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-sm border">
              <CardContent className="pt-5 text-center">
                <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{data.salary_range}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Salary Range</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-sm border">
              <CardContent className="pt-5 text-center">
                <BarChart3 className="h-5 w-5 text-primary mx-auto mb-1" />
                <Badge className={`text-xs ${demandColors[data.demand_level] || ""}`}>{data.demand_level}</Badge>
                <p className="text-[10px] text-muted-foreground mt-1">Demand</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-sm border">
              <CardContent className="pt-5 text-center">
                <Shield className="h-5 w-5 text-primary mx-auto mb-1" />
                <Badge className={`text-xs ${competitionColors[data.competition_level] || ""}`}>{data.competition_level}</Badge>
                <p className="text-[10px] text-muted-foreground mt-1">Competition</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-sm border">
              <CardContent className="pt-5 text-center">
                <ArrowUpRight className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{data.role_growth_rate}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Growth Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Skill Demand Scores */}
          {topDemandSkills.length > 0 && (
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Skill Demand Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topDemandSkills.map(([skill, score]) => (
                  <div key={skill} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-32 truncate">{skill}</span>
                    <Progress value={score} className="flex-1 h-2" />
                    <span className="text-xs font-bold text-muted-foreground w-8 text-right">{score}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trending Skills */}
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Trending Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(data.trending_skills || []).map((skill) => (
                    <Badge key={skill} className="rounded-lg px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Declining Skills */}
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-3">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg">Declining Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(data.declining_skills || []).map((skill) => (
                    <Badge key={skill} variant="outline" className="rounded-lg px-3 py-1 border-red-300 text-red-600 dark:border-red-700 dark:text-red-400">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Salary by Experience */}
          {meta?.salary_by_experience && (
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Salary by Experience (India)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(["entry", "mid", "senior"] as const).map((tier) => (
                    <div key={tier} className="rounded-xl border p-4 text-center bg-muted/30">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{tier === "entry" ? "Entry (0-2 yrs)" : tier === "mid" ? "Mid (3-6 yrs)" : "Senior (7+ yrs)"}</p>
                      <p className="text-lg font-bold text-foreground mt-2">{meta.salary_by_experience![tier]}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skill Gap Analysis */}
          {meta?.skill_gaps && meta.skill_gaps.length > 0 && (
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg">Skill Gap Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {meta.skill_gaps.map((g) => (
                  <div key={g.skill} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{g.skill}</span>
                      <Badge className={
                        g.priority === "Critical" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                        g.priority === "High" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" :
                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }>{g.priority}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">Demand: {g.demand_score}/100</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Matched Skills */}
          {meta?.matched_skills && meta.matched_skills.length > 0 && (
            <Card className="rounded-2xl shadow-sm border border-green-500/20 bg-green-500/5">
              <CardHeader className="flex flex-row items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Your Matching In-Demand Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {meta.matched_skills.map((s) => (
                    <Badge key={s} className="rounded-lg px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 capitalize">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Hiring Cities */}
            {meta?.top_hiring_cities && meta.top_hiring_cities.length > 0 && (
              <Card className="rounded-2xl shadow-sm border">
                <CardHeader className="flex flex-row items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Top Hiring Cities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {meta.top_hiring_cities.map((c) => (
                      <Badge key={c} variant="outline" className="rounded-lg px-3 py-1">{c}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Hiring Companies */}
            {meta?.top_hiring_companies && meta.top_hiring_companies.length > 0 && (
              <Card className="rounded-2xl shadow-sm border">
                <CardHeader className="flex flex-row items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Top Hiring Companies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {meta.top_hiring_companies.map((c) => (
                      <Badge key={c} variant="outline" className="rounded-lg px-3 py-1">{c}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* High Impact Skills */}
          {data.high_impact_skills?.length > 0 && (
            <Card className="rounded-2xl shadow-sm border border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">High-Impact Skills to Learn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.high_impact_skills.map((skill) => (
                    <Badge key={skill} className="rounded-lg px-3 py-1 bg-primary/10 text-primary border border-primary/20">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strategy Plan */}
          {data.strategy_plan?.length > 0 && (
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-3">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Strategic Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {data.strategy_plan.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="font-bold text-primary min-w-[24px]">{i + 1}.</span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          <Card className="rounded-2xl shadow-sm border">
            <CardHeader className="flex flex-row items-center gap-3">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Market Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{data.insights}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MarketIntelligencePage;
