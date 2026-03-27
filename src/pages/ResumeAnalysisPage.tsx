import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resumeService, ResumeAnalysis, ParsedResume } from "@/services/resumeService";
import { careerService, CareerRecommendation } from "@/services/careerService";
import { profileService } from "@/services/profileService";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Target,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Briefcase,
  FolderKanban,
  Sparkles,
  XCircle,
  ArrowRight,
  Upload,
  Shield,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const iconBox = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0";

function atsColor(score: number) {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-destructive";
}

function atsStroke(score: number) {
  if (score >= 80) return "hsl(150, 60%, 50%)";
  if (score >= 60) return "hsl(40, 80%, 55%)";
  return "hsl(var(--destructive))";
}

const ResumeAnalysisPage = () => {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [careers, setCareers] = useState<CareerRecommendation[]>([]);
  const [hasResume, setHasResume] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState<"" | "parsing" | "scoring">("");
  const [skillsSynced, setSkillsSynced] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [existingAnalysis, careerData, profile] = await Promise.allSettled([
          resumeService.getResumeAnalysis(),
          careerService.getRecommendations(),
          profileService.getProfile(),
        ]);
        if (existingAnalysis.status === "fulfilled") setAnalysis(existingAnalysis.value);
        if (careerData.status === "fulfilled") setCareers(careerData.value);
        if (profile.status === "fulfilled") setHasResume(!!profile.value?.resume_url);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const topCareer = useMemo(() => careers[0] ?? null, [careers]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setSkillsSynced(false);
    try {
      // Step 1: Parse
      setStep("parsing");
      const parsed: ParsedResume = await resumeService.parseResume();

      // Step 2: Score
      setStep("scoring");
      const result = await resumeService.scoreResume(
        parsed,
        topCareer?.career_title || "General",
        topCareer?.required_skills || [],
        topCareer?.missing_skills || [],
      );

      setAnalysis(result);
      toast.success("Resume analysis complete!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to analyze resume");
    } finally {
      setAnalyzing(false);
      setStep("");
    }
  };

  const handleSyncSkills = async () => {
    if (!analysis) return;
    try {
      await resumeService.updateProfileSkillsFromResume(analysis.extracted_skills);
      setSkillsSynced(true);
      toast.success("Profile skills updated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resume Analysis</h1>
          <p className="text-muted-foreground mt-1">Optimize your resume for your target career.</p>
        </div>
        {hasResume && (
          <Button onClick={handleAnalyze} disabled={analyzing} variant="outline" className="gap-2 rounded-xl">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {analysis ? "Re-Analyze" : "Analyze Resume"}
          </Button>
        )}
      </div>

      {/* Analyzing state */}
      {analyzing && (
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">
              {step === "parsing" ? "Parsing your resume..." : "Scoring & evaluating..."}
            </p>
            <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
          </CardContent>
        </Card>
      )}

      {/* No resume uploaded */}
      {!analyzing && !hasResume && (
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Upload your resume in Profile Setup to unlock AI-powered resume analysis.
            </p>
            <Button asChild className="gap-2">
              <a href="/profile/setup">Go to Profile Setup <ArrowRight className="h-4 w-4" /></a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Has resume but no analysis yet */}
      {!analyzing && hasResume && !analysis && (
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Your resume is ready. Click "Analyze Resume" to get AI insights and an ATS score.
            </p>
            <Button onClick={handleAnalyze} className="gap-2">
              Analyze Resume <Sparkles className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!analyzing && analysis && (
        <>
          {/* ATS Score + Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-primary/10`}>
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">ATS Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-4">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle cx="56" cy="56" r="48" fill="none" stroke={atsStroke(analysis.ats_score)} strokeWidth="8" strokeDasharray={`${(analysis.ats_score / 100) * 301.6} 301.6`} strokeLinecap="round" />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${atsColor(analysis.ats_score)}`}>
                    {analysis.ats_score}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">out of 100</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border md:col-span-2">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-accent`}>
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Quick Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-primary/5">
                    <p className="text-3xl font-bold text-primary">{(analysis.extracted_skills || []).length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Skills Found</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{(analysis.strengths || []).length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Strengths</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-destructive/5">
                    <p className="text-3xl font-bold text-destructive">{(analysis.weaknesses || []).length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Weaknesses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strengths + Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-green-100 dark:bg-green-900/20`}>
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg font-semibold">Strengths</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(analysis.strengths || []).map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-green-50/50 dark:bg-green-900/10">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground">{s}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-destructive/10`}>
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <CardTitle className="text-lg font-semibold">Weaknesses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(analysis.weaknesses || []).map((w, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground">{w}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Suggestions */}
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <div className={`${iconBox} bg-accent`}>
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold">Improvement Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(analysis.suggestions || []).map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground">{s}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Extracted Skills */}
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <div className={`${iconBox} bg-primary/10`}>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold">Extracted Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(analysis.extracted_skills || []).map((skill) => (
                  <Badge key={skill} variant="secondary" className="rounded-lg">{skill}</Badge>
                ))}
              </div>
              {(analysis.tech_stack || []).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Tech Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.tech_stack.map((tech) => (
                      <Badge key={tech} variant="outline" className="rounded-lg">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experience */}
          {(analysis.extracted_experience as unknown as Array<{ role: string; company: string; duration: string; description: string }>)?.length > 0 && (
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-accent`}>
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(analysis.extracted_experience as unknown as Array<{ role: string; company: string; duration: string; description: string }>).map((exp, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-card hover:shadow-sm transition-all space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{exp.role}</p>
                      <Badge variant="outline" className="rounded-lg text-xs">{exp.duration}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                    <p className="text-sm text-foreground/80 mt-1">{exp.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Projects */}
          {(analysis.extracted_projects as unknown as Array<{ title: string; description: string; technologies: string[] }>)?.length > 0 && (
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-primary/10`}>
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(analysis.extracted_projects as unknown as Array<{ title: string; description: string; technologies: string[] }>).map((proj, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-card hover:shadow-sm transition-all space-y-2">
                    <p className="font-semibold text-foreground">{proj.title}</p>
                    <p className="text-sm text-foreground/80">{proj.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(proj.technologies || []).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px] rounded-lg px-1.5 py-0">{t}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Profile Sync CTA */}
          <Card className="rounded-2xl shadow-sm border bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
              <div className="flex items-center gap-3">
                <div className={`${iconBox} bg-primary/10`}>
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Update your profile with extracted skills?</p>
                  <p className="text-sm text-muted-foreground">Merge {(analysis.extracted_skills || []).length} skills into your profile (duplicates skipped).</p>
                </div>
              </div>
              {skillsSynced ? (
                <Badge className="gap-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Synced
                </Badge>
              ) : (
                <Button onClick={handleSyncSkills} className="gap-2 rounded-xl shrink-0">
                  Accept & Merge <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
};

export default ResumeAnalysisPage;
