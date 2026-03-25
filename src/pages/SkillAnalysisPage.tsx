import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { careerService, SkillAnalysis } from "@/services/careerService";
import { toast } from "sonner";
import { Loader2, BarChart3, Target, AlertTriangle, RefreshCw, Sparkles } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";

const COLORS = [
  "hsl(239, 84%, 67%)",
  "hsl(260, 84%, 60%)",
  "hsl(200, 84%, 60%)",
  "hsl(150, 60%, 50%)",
  "hsl(30, 80%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(180, 50%, 50%)",
];

const iconContainer = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0";

const SkillAnalysisPage = () => {
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadAnalysis = async () => {
    try {
      const data = await careerService.getSkillAnalysis();
      setAnalysis(data);
      if (!data) await generate();
    } catch {
      // no data
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const data = await careerService.generateSkillAnalysis();
      setAnalysis(data);
      toast.success("Skill analysis generated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate analysis");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  const distributionData = analysis?.skill_distribution
    ? Object.entries(analysis.skill_distribution).map(([name, value]) => ({ name, value }))
    : [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Skill Analysis</h1>
          <p className="text-muted-foreground mt-1">Your skill profile and career readiness insights.</p>
        </div>
        <Button onClick={generate} disabled={generating} variant="outline" className="gap-2 rounded-xl">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {generating && (
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Analyzing your skills...</p>
          </CardContent>
        </Card>
      )}

      {!generating && analysis && (
        <>
          {/* Readiness Score + Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border md:col-span-1">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconContainer} bg-primary/10`}>
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Readiness Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-4">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle cx="56" cy="56" r="48" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray={`${(analysis.readiness_score / 100) * 301.6} 301.6`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-primary">{analysis.readiness_score}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">out of 100</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border md:col-span-2">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconContainer} bg-accent`}>
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Skill Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-primary/5">
                    <p className="text-3xl font-bold text-primary">{analysis.total_skills}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Skills</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analysis.matched_skills}</p>
                    <p className="text-xs text-muted-foreground mt-1">Matched</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-900/20">
                    <p className="text-3xl font-bold text-destructive">{analysis.missing_skills}</p>
                    <p className="text-xs text-muted-foreground mt-1">Missing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skill Distribution */}
          {distributionData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                  <div className={`${iconContainer} bg-primary/10`}>
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Skill Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={distributionData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" paddingAngle={3}>
                          {distributionData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {distributionData.map((d, i) => (
                      <Badge key={d.name} variant="outline" className="gap-1.5 rounded-lg">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {d.name} ({d.value})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                  <div className={`${iconContainer} bg-accent`}>
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">By Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distributionData} layout="vertical" margin={{ left: 20 }}>
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {distributionData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {!generating && !analysis && (
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Generate career recommendations first to unlock skill analysis.</p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default SkillAnalysisPage;
