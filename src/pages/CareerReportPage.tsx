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
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, Download, FileText, User, Target, Brain, BookOpen, BarChart3, Github } from "lucide-react";

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

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) { toast.error("Please allow popups"); return; }

      const topCareer = careers[0];
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Career Readiness Report</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a2e; }
    h1 { color: #6c63ff; border-bottom: 3px solid #6c63ff; padding-bottom: 10px; }
    h2 { color: #333; margin-top: 30px; border-left: 4px solid #6c63ff; padding-left: 12px; }
    .score-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
    .score-card { background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center; }
    .score-value { font-size: 32px; font-weight: 700; color: #6c63ff; }
    .score-label { font-size: 12px; color: #666; margin-top: 4px; }
    .badge { display: inline-block; background: #e8e6ff; color: #6c63ff; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 2px; }
    .career-item { background: #f8f9fa; border-radius: 8px; padding: 12px 16px; margin: 8px 0; display: flex; justify-content: space-between; align-items: center; }
    .footer { text-align: center; margin-top: 40px; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>🎯 Career Readiness Report</h1>
  <p style="color:#666">Generated on ${new Date().toLocaleDateString()} for <strong>${profile?.full_name || user?.email || "User"}</strong></p>

  <h2>📊 Overview Scores</h2>
  <div class="score-grid">
    <div class="score-card"><div class="score-value">${skillAnalysis?.readiness_score ?? "—"}</div><div class="score-label">Readiness Score</div></div>
    <div class="score-card"><div class="score-value">${resumeScore ?? "—"}</div><div class="score-label">Resume ATS Score</div></div>
    <div class="score-card"><div class="score-value">${githubScore ?? "—"}</div><div class="score-label">GitHub Score</div></div>
  </div>

  <h2>👤 Profile Summary</h2>
  <p><strong>Name:</strong> ${profile?.full_name || "—"}</p>
  <p><strong>Degree:</strong> ${profile?.degree || "—"} ${profile?.college ? "at " + profile.college : ""}</p>
  <p><strong>Career Goal:</strong> ${profile?.career_goal || "—"}</p>
  <p><strong>Skills:</strong> ${(profile?.skills || []).map((s) => `<span class="badge">${s}</span>`).join(" ") || "None"}</p>

  <h2>🧭 Career Recommendations</h2>
  ${careers.slice(0, 5).map((c) => `<div class="career-item"><span>${c.career_title}</span><strong>${c.match_score}%</strong></div>`).join("")}

  <h2>🧠 Skill Gap Analysis</h2>
  ${skillAnalysis ? `
    <p>Matched: <strong>${skillAnalysis.matched_skills}</strong> / Missing: <strong>${skillAnalysis.missing_skills}</strong> / Total: <strong>${skillAnalysis.total_skills}</strong></p>
  ` : "<p>Not analyzed yet</p>"}

  <h2>📚 Learning Roadmap</h2>
  ${roadmap ? `
    <p><strong>${roadmap.career_title}</strong> — ${roadmap.completed_steps}/${roadmap.total_steps} steps (${roadmap.progress}%)</p>
  ` : "<p>No roadmap generated yet</p>"}

  <div class="footer">Career Decode — AI-Powered Career Intelligence Platform</div>
</body>
</html>`;
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
      toast.success("Report ready for download!");
    } catch (e: any) {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
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
          <p className="text-muted-foreground mt-1">Export your career readiness report as PDF</p>
        </div>
        <Button onClick={generatePDF} disabled={generating} className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]">
          {generating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</> : <><Download className="h-4 w-4 mr-2" /> Export PDF</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Readiness Score", value: skillAnalysis?.readiness_score ?? "—", icon: Brain },
          { label: "Resume ATS", value: resumeScore ?? "—", icon: FileText },
          { label: "GitHub Score", value: githubScore ?? "—", icon: Github },
        ].map((item) => (
          <Card key={item.label} className="rounded-2xl shadow-sm border">
            <CardContent className="pt-6 text-center">
              <item.icon className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-4xl font-bold text-primary">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl shadow-sm border">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm"><strong>Name:</strong> {profile?.full_name || "—"}</p>
          <p className="text-sm"><strong>Goal:</strong> {profile?.career_goal || "—"}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {(profile?.skills || []).map((s) => <Badge key={s} variant="secondary" className="rounded-lg">{s}</Badge>)}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm border">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Top Careers</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {careers.slice(0, 5).map((c) => (
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
    </DashboardLayout>
  );
};

export default CareerReportPage;
