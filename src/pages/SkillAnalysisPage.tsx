import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { profileService, ProfileData } from "@/services/profileService";
import { careerService, CareerRecommendation, SkillAnalysis } from "@/services/careerService";
import { toast } from "sonner";
import {
  Loader2,
  Target,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  BarChart3,
  Shield,
  Lightbulb,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = [
  "hsl(239, 84%, 67%)",
  "hsl(260, 84%, 60%)",
  "hsl(200, 84%, 60%)",
  "hsl(150, 60%, 50%)",
  "hsl(30, 80%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(180, 50%, 50%)",
];

const iconBox = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0";

/* ---------- helpers ---------- */

function classifyPriority(skill: string, requiredSkills: string[]): "high" | "medium" | "optional" {
  const idx = requiredSkills.findIndex((s) => s.toLowerCase() === skill.toLowerCase());
  if (idx < requiredSkills.length * 0.33) return "high";
  if (idx < requiredSkills.length * 0.66) return "medium";
  return "optional";
}

function priorityColor(p: "high" | "medium" | "optional") {
  if (p === "high") return "bg-destructive/10 text-destructive border-destructive/20";
  if (p === "medium") return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800";
  return "bg-muted text-muted-foreground border-border";
}

function proficiencyLevel(_skill: string): string {
  // Simple heuristic – could be replaced by real data later
  const hash = _skill.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const levels = ["Beginner", "Intermediate", "Advanced"];
  return levels[hash % 3];
}

function proficiencyBadgeClass(level: string) {
  if (level === "Advanced") return "bg-primary/10 text-primary border-primary/20";
  if (level === "Intermediate") return "bg-accent text-accent-foreground border-border";
  return "bg-muted text-muted-foreground border-border";
}

/* ---------- component ---------- */

const SkillAnalysisPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [careers, setCareers] = useState<CareerRecommendation[]>([]);
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null);
  const [selectedCareerId, setSelectedCareerId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, c, a] = await Promise.allSettled([
          profileService.getProfile(),
          careerService.getRecommendations(),
          careerService.getSkillAnalysis(),
        ]);
        if (p.status === "fulfilled") setProfile(p.value);
        if (c.status === "fulfilled") {
          setCareers(c.value);
          if (c.value.length > 0) setSelectedCareerId(c.value[0].id);
        }
        if (a.status === "fulfilled") setAnalysis(a.value);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectedCareer = useMemo(
    () => careers.find((c) => c.id === selectedCareerId) ?? null,
    [careers, selectedCareerId],
  );

  const userSkillsLower = useMemo(
    () => (profile?.skills || []).map((s) => s.toLowerCase()),
    [profile],
  );

  const { matchedSkills, missingSkills, matchScore } = useMemo(() => {
    if (!selectedCareer) return { matchedSkills: [] as string[], missingSkills: [] as string[], matchScore: 0 };
    const required = (selectedCareer.required_skills || []);
    const matched = required.filter((s) => userSkillsLower.includes(s.toLowerCase()));
    const missing = required.filter((s) => !userSkillsLower.includes(s.toLowerCase()));
    const score = required.length > 0 ? Math.round((matched.length / required.length) * 100) : 0;
    return { matchedSkills: matched, missingSkills: missing, matchScore: score };
  }, [selectedCareer, userSkillsLower]);

  const topSkillsToLearn = useMemo(() => {
    if (!selectedCareer) return [];
    return missingSkills.slice(0, 3);
  }, [missingSkills, selectedCareer]);

  const distributionData = useMemo(() => {
    if (!analysis?.skill_distribution) return [];
    return Object.entries(analysis.skill_distribution).map(([name, value]) => ({ name, value }));
  }, [analysis]);

  const regenerate = async () => {
    setGenerating(true);
    try {
      const data = await careerService.generateSkillAnalysis();
      setAnalysis(data);
      toast.success("Analysis refreshed!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate analysis");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const hasNoCareers = careers.length === 0;

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Skill Intelligence Report</h1>
          <p className="text-muted-foreground mt-1">Based on your profile, resume, and selected career goal.</p>
        </div>
        <Button onClick={regenerate} disabled={generating || hasNoCareers} variant="outline" className="gap-2 rounded-xl">
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

      {!generating && hasNoCareers && (
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Generate career recommendations first to unlock your skill intelligence report.
            </p>
            <Button onClick={() => navigate("/career-recommendations")} className="gap-2">
              Get Recommendations <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {!generating && !hasNoCareers && (
        <>
          {/* ── Target Career Selector ── */}
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <div className={`${iconBox} bg-primary/10`}>
                <Target className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold">Target Career</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCareerId} onValueChange={setSelectedCareerId}>
                <SelectTrigger className="w-full max-w-sm rounded-xl">
                  <SelectValue placeholder="Select a career" />
                </SelectTrigger>
                <SelectContent>
                  {careers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.career_title} — {c.match_score}% match
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* ── Match Score + Stats Row ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Donut */}
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-primary/10`}>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Skill Match</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-4">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle cx="56" cy="56" r="48" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray={`${(matchScore / 100) * 301.6} 301.6`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-primary">{matchScore}%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">of required skills matched</p>
              </CardContent>
            </Card>

            {/* Stat Cards */}
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border md:col-span-2">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-accent`}>
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-primary/5">
                    <p className="text-3xl font-bold text-primary">{(selectedCareer?.required_skills || []).length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Required</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{matchedSkills.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Matched</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-destructive/5">
                    <p className="text-3xl font-bold text-destructive">{missingSkills.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Missing</p>
                  </div>
                </div>
                <Progress value={matchScore} className="h-2 mt-4" />
              </CardContent>
            </Card>
          </div>

          {/* ── Current Skills ── */}
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <div className={`${iconBox} bg-primary/10`}>
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold">Your Current Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {(profile?.skills || []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(profile?.skills || []).map((skill) => {
                    const isMatched = matchedSkills.some((m) => m.toLowerCase() === skill.toLowerCase());
                    const level = proficiencyLevel(skill);
                    return (
                      <Badge
                        key={skill}
                        variant="outline"
                        className={`rounded-lg gap-1.5 transition-all duration-200 ${
                          isMatched
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                            : proficiencyBadgeClass(level)
                        }`}
                      >
                        {isMatched && <CheckCircle2 className="h-3 w-3" />}
                        {skill}
                        <span className="text-[10px] opacity-60">· {level}</span>
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills found. Update your profile to add skills.</p>
              )}
            </CardContent>
          </Card>

          {/* ── Missing Skills ── */}
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <div className={`${iconBox} bg-destructive/10`}>
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <CardTitle className="text-lg font-semibold">Missing Skills You Need to Learn</CardTitle>
            </CardHeader>
            <CardContent>
              {missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((skill) => {
                    const priority = classifyPriority(skill, selectedCareer?.required_skills || []);
                    return (
                      <Badge key={skill} variant="outline" className={`rounded-lg gap-1.5 ${priorityColor(priority)}`}>
                        {priority === "high" && <Zap className="h-3 w-3" />}
                        {priority === "medium" && <Shield className="h-3 w-3" />}
                        {skill}
                        <span className="text-[10px] opacity-60 capitalize">· {priority}</span>
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-medium">You have all the required skills for this career!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Top Recommendations + Skill Distribution ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 3 to learn */}
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-accent`}>
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Top Skills to Learn First</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topSkillsToLearn.length > 0 ? (
                  topSkillsToLearn.map((skill, i) => (
                    <div key={skill} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{skill}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Learning {skill} will strengthen your {selectedCareer?.career_title} readiness.
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No missing skills — you're fully qualified!</p>
                )}
              </CardContent>
            </Card>

            {/* Skill Distribution Pie */}
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-primary/10`}>
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Skill Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {distributionData.length > 0 ? (
                  <>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={distributionData} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value" paddingAngle={3}>
                            {distributionData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {distributionData.map((d, i) => (
                        <Badge key={d.name} variant="outline" className="gap-1.5 rounded-lg">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          {d.name} ({d.value})
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Refresh the analysis to see your skill distribution chart.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── CTA ── */}
          <Card className="rounded-2xl shadow-sm border bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
              <div className="flex items-center gap-3">
                <div className={`${iconBox} bg-primary/10`}>
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Ready to close your skill gaps?</p>
                  <p className="text-sm text-muted-foreground">Generate a personalized learning roadmap based on your missing skills.</p>
                </div>
              </div>
              <Button onClick={() => navigate("/learning-roadmap")} className="gap-2 rounded-xl shrink-0">
                Generate Learning Roadmap <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
};

export default SkillAnalysisPage;
