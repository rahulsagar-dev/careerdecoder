import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { profileService, ProfileData } from "@/services/profileService";
import { careerService, CareerRecommendation, SkillAnalysis } from "@/services/careerService";
import { roadmapService, LearningRoadmap } from "@/services/roadmapService";
import { resumeService } from "@/services/resumeService";
import { githubService } from "@/services/githubService";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { handleFeatureError } from "@/services/featureGate";
import ReactMarkdown from "react-markdown";
import {
  Loader2, Download, FileText, User, Target, Brain, BookOpen, Github,
  Zap, Calendar, TrendingUp, CheckCircle2, AlertTriangle,
} from "lucide-react";

interface CareerReport {
  report_summary: string;
  career_fit: { career: string; fit_reason: string; score: number }[];
  skill_gap_summary: string;
  market_analysis: string;
  portfolio_review: string;
  action_plan: { short_term: string[]; mid_term: string[]; long_term: string[] };
}

interface Scores {
  skills: number;
  resume: number;
  github: number;
  market: number;
  projects: number;
  final: number;
}

const CareerReportPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [careers, setCareers] = useState<CareerRecommendation[]>([]);
  const [skillAnalysis, setSkillAnalysis] = useState<SkillAnalysis | null>(null);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [resumeScore, setResumeScore] = useState<number | null>(null);
  const [githubScore, setGithubScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<CareerReport | null>(null);
  const [scores, setScores] = useState<Scores | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, c, s, r, res, gh] = await Promise.allSettled([
          profileService.getProfile(),
          careerService.getRecommendations(),
          careerService.getSkillAnalysis(),
          roadmapService.getRoadmap(),
          resumeService.getResumeAnalysis(),
          githubService.getGithubAnalysis(),
        ]);
        if (p.status === "fulfilled") setProfile(p.value);
        if (c.status === "fulfilled") setCareers(c.value);
        if (s.status === "fulfilled") setSkillAnalysis(s.value);
        if (r.status === "fulfilled") setRoadmap(r.value);
        if (res.status === "fulfilled" && res.value) setResumeScore(res.value.ats_score);
        if (gh.status === "fulfilled" && gh.value) setGithubScore(gh.value.portfolio_score);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const { gateFeature } = await import("@/services/featureGate");
      await gateFeature("career-report");


      const { data, error } = await supabase.functions.invoke("generate-career-report", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw new Error(error.message || "Failed to generate report");
      if (data?.error) throw new Error(data.error);

      setReport(data.report);
      setScores(data.scores);
      toast.success("Career report generated!");
    } catch (e: any) {
      handleFeatureError(e, "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const exportPDF = () => {
    if (!report || !scores) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Please allow popups"); return; }

    const html = `<!DOCTYPE html><html><head><title>Career Readiness Report</title>
<style>
body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a2e; line-height: 1.6; }
h1 { color: #6c63ff; border-bottom: 3px solid #6c63ff; padding-bottom: 10px; font-size: 28px; }
h2 { color: #333; margin-top: 30px; border-left: 4px solid #6c63ff; padding-left: 12px; font-size: 18px; }
h3 { color: #555; font-size: 15px; margin-top: 20px; }
.score-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
.score-card { background: #f8f9fa; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #eee; }
.score-value { font-size: 28px; font-weight: 700; color: #6c63ff; }
.score-label { font-size: 11px; color: #888; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.final-score { background: linear-gradient(135deg, #6c63ff, #8b5cf6); color: white; border-radius: 16px; padding: 24px; text-align: center; margin: 20px 0; }
.final-score .score-value { color: white; font-size: 48px; }
.badge { display: inline-block; background: #e8e6ff; color: #6c63ff; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 2px; }
.career-item { background: #f8f9fa; border-radius: 8px; padding: 12px 16px; margin: 8px 0; }
.career-score { float: right; font-weight: 700; color: #6c63ff; }
.action-section { background: #f8f9fa; border-radius: 12px; padding: 16px; margin: 8px 0; }
.action-section h3 { margin-top: 0; color: #6c63ff; }
.action-section li { margin: 6px 0; font-size: 14px; }
.progress-bar { background: #e8e6ff; border-radius: 8px; height: 8px; margin: 4px 0; }
.progress-fill { background: #6c63ff; border-radius: 8px; height: 8px; }
.footer { text-align: center; margin-top: 40px; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 16px; }
</style></head><body>
<h1>🎯 Career Readiness Report</h1>
<p style="color:#666">Generated on ${new Date().toLocaleDateString()} for <strong>${profile?.full_name || user?.email || "User"}</strong></p>

<div class="final-score">
  <div class="score-value">${scores.final}</div>
  <div style="font-size:14px;opacity:0.9">Final Readiness Score</div>
</div>

<div class="score-grid">
  <div class="score-card"><div class="score-value">${scores.skills}</div><div class="score-label">Skills</div><div class="progress-bar"><div class="progress-fill" style="width:${scores.skills}%"></div></div></div>
  <div class="score-card"><div class="score-value">${scores.resume}</div><div class="score-label">Resume</div><div class="progress-bar"><div class="progress-fill" style="width:${scores.resume}%"></div></div></div>
  <div class="score-card"><div class="score-value">${scores.github}</div><div class="score-label">GitHub</div><div class="progress-bar"><div class="progress-fill" style="width:${scores.github}%"></div></div></div>
  <div class="score-card"><div class="score-value">${scores.market}</div><div class="score-label">Market</div><div class="progress-bar"><div class="progress-fill" style="width:${scores.market}%"></div></div></div>
  <div class="score-card"><div class="score-value">${scores.projects}</div><div class="score-label">Projects</div><div class="progress-bar"><div class="progress-fill" style="width:${scores.projects}%"></div></div></div>
</div>

<h2>📋 Executive Summary</h2>
<p>${report.report_summary}</p>

<h2>🎯 Career Fit Analysis</h2>
${report.career_fit.map(c => `<div class="career-item"><span class="career-score">${c.score}%</span><strong>${c.career}</strong><br/><span style="font-size:13px;color:#666">${c.fit_reason}</span></div>`).join("")}

<h2>🧠 Skill Gap Analysis</h2>
<p>${report.skill_gap_summary}</p>

<h2>📊 Market Position</h2>
<p>${report.market_analysis}</p>

<h2>📄 Portfolio Review</h2>
<p>${report.portfolio_review}</p>

<h2>🚀 Action Plan</h2>
<div class="action-section"><h3>📅 Short Term (1-3 months)</h3><ul>${report.action_plan.short_term.map(s => `<li>${s}</li>`).join("")}</ul></div>
<div class="action-section"><h3>📅 Mid Term (3-6 months)</h3><ul>${report.action_plan.mid_term.map(s => `<li>${s}</li>`).join("")}</ul></div>
<div class="action-section"><h3>📅 Long Term (6-12 months)</h3><ul>${report.action_plan.long_term.map(s => `<li>${s}</li>`).join("")}</ul></div>

<div class="footer">Career Decode — AI-Powered Career Intelligence Platform</div>
</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
    toast.success("Report ready for download!");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Career Report</h1>
          <p className="text-muted-foreground mt-1">AI-generated recruiter-level career assessment</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateReport} disabled={generating} className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]">
            {generating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</> : <><Brain className="h-4 w-4 mr-2" /> Generate Report</>}
          </Button>
          {report && (
            <Button onClick={exportPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Scores */}
      {scores ? (
        <>
          <Card className="rounded-2xl shadow-sm border border-primary/20 bg-gradient-to-r from-primary/5 to-[hsl(260,84%,60%)]/5">
            <CardContent className="pt-6 text-center">
              <p className="text-6xl font-bold text-primary">{scores.final}</p>
              <p className="text-sm text-muted-foreground mt-1">Final Readiness Score</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">0.25×Skills + 0.20×Resume + 0.20×GitHub + 0.20×Market + 0.15×Projects</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Skills", value: scores.skills, icon: Brain },
              { label: "Resume", value: scores.resume, icon: FileText },
              { label: "GitHub", value: scores.github, icon: Github },
              { label: "Market", value: scores.market, icon: TrendingUp },
              { label: "Projects", value: scores.projects, icon: BookOpen },
            ].map(item => (
              <Card key={item.label} className="rounded-2xl shadow-sm border">
                <CardContent className="pt-5 text-center">
                  <item.icon className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                  <Progress value={item.value} className="h-1.5 mt-2" />
                  <p className="text-[10px] text-muted-foreground mt-1">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Readiness Score", value: skillAnalysis?.readiness_score ?? "—", icon: Brain },
            { label: "Resume ATS", value: resumeScore ?? "—", icon: FileText },
            { label: "GitHub Score", value: githubScore ?? "—", icon: Github },
          ].map(item => (
            <Card key={item.label} className="rounded-2xl shadow-sm border">
              <CardContent className="pt-6 text-center">
                <item.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-4xl font-bold text-primary">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Report Sections */}
      {report && (
        <div className="space-y-6">
          <Card className="rounded-2xl shadow-sm border">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Executive Summary</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{report.report_summary}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Career Fit Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {report.career_fit.map((c, i) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{c.career}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.fit_reason}</p>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">{c.score}%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Skill Gap</CardTitle></CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{report.skill_gap_summary}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Market Position</CardTitle></CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{report.market_analysis}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-sm border">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Portfolio Review</CardTitle></CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{report.portfolio_review}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Action Plan */}
          <Card className="rounded-2xl shadow-sm border border-primary/20">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Action Plan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: "Short Term (1-3 months)", items: report.action_plan.short_term, icon: Calendar, color: "text-green-600" },
                { title: "Mid Term (3-6 months)", items: report.action_plan.mid_term, icon: TrendingUp, color: "text-yellow-600" },
                { title: "Long Term (6-12 months)", items: report.action_plan.long_term, icon: Target, color: "text-primary" },
              ].map(section => (
                <div key={section.title} className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <section.icon className={`h-4 w-4 ${section.color}`} />
                    <p className="font-semibold text-sm">{section.title}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fallback static sections when no AI report */}
      {!report && (
        <>
          <Card className="rounded-2xl shadow-sm border">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Profile</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm"><strong>Name:</strong> {profile?.full_name || "—"}</p>
              <p className="text-sm"><strong>Goal:</strong> {profile?.career_goal || "—"}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {(profile?.skills || []).map(s => <Badge key={s} variant="secondary" className="rounded-lg">{s}</Badge>)}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Top Careers</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {careers.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <span className="font-medium text-sm">{c.career_title}</span>
                  <Badge variant="secondary">{c.match_score}%</Badge>
                </div>
              ))}
              {careers.length === 0 && <p className="text-sm text-muted-foreground">No recommendations yet</p>}
            </CardContent>
          </Card>

          {roadmap && (
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Roadmap Progress</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium">{roadmap.career_title}</p>
                <Progress value={roadmap.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{roadmap.completed_steps}/{roadmap.total_steps} steps — {roadmap.progress}%</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default CareerReportPage;
