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
  Target, Zap, Shield, ArrowUpRight, ArrowDownRight,
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

  const topDemandSkills = data?.skill_demand_scores
    ? Object.entries(data.skill_demand_scores).sort(([, a], [, b]) => b - a).slice(0, 8)
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
