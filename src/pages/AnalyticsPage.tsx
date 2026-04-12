import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { careerService, SkillAnalysis } from "@/services/careerService";
import { roadmapService, LearningRoadmap } from "@/services/roadmapService";
import { interviewService, InterviewSession } from "@/services/interviewService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2, TrendingUp, Brain, BookOpen, MessageSquare } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(262, 83%, 58%)", "hsl(142, 76%, 36%)", "hsl(24, 94%, 50%)", "hsl(200, 80%, 50%)", "hsl(340, 80%, 50%)"];

const AnalyticsPage = () => {
  const [skillAnalysis, setSkillAnalysis] = useState<SkillAnalysis | null>(null);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, i] = await Promise.allSettled([
          careerService.getSkillAnalysis(),
          roadmapService.getRoadmap(),
          interviewService.getSessions(),
        ]);
        if (s.status === "fulfilled") setSkillAnalysis(s.value);
        if (r.status === "fulfilled") setRoadmap(r.value);
        if (i.status === "fulfilled") setSessions(i.value);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const interviewData = sessions
    .filter((s) => s.score > 0)
    .map((s, i) => ({
      name: `Session ${i + 1}`,
      score: s.score,
      mode: s.mode,
    }))
    .reverse();

  const skillDistData = skillAnalysis?.skill_distribution
    ? Object.entries(skillAnalysis.skill_distribution as Record<string, number>).map(([name, value]) => ({
        name,
        value: Number(value),
      }))
    : [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your career development progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Readiness", value: `${skillAnalysis?.readiness_score ?? 0}%`, icon: Brain },
          { label: "Roadmap", value: `${roadmap?.progress ?? 0}%`, icon: BookOpen },
          { label: "Interviews", value: sessions.length, icon: MessageSquare },
          { label: "Avg Score", value: sessions.length > 0 ? Math.round(sessions.filter((s) => s.score > 0).reduce((a, b) => a + b.score, 0) / Math.max(sessions.filter((s) => s.score > 0).length, 1)) : "—", icon: TrendingUp },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl shadow-sm border">
            <CardContent className="pt-6 flex items-center gap-4">
              <stat.icon className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {interviewData.length > 0 && (
        <Card className="rounded-2xl shadow-sm border">
          <CardHeader><CardTitle className="text-lg">Interview Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={interviewData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={{ fill: "hsl(262, 83%, 58%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roadmap && (
          <Card className="rounded-2xl shadow-sm border">
            <CardHeader><CardTitle className="text-lg">Roadmap Progress</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{roadmap.progress}%</p>
                <p className="text-xs text-muted-foreground mt-1">{roadmap.completed_steps} of {roadmap.total_steps} steps</p>
              </div>
              <Progress value={roadmap.progress} className="h-3" />
            </CardContent>
          </Card>
        )}

        {skillDistData.length > 0 && (
          <Card className="rounded-2xl shadow-sm border">
            <CardHeader><CardTitle className="text-lg">Skill Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <Pie
                    data={skillDistData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={30}
                    dataKey="value"
                    label={({ name, value, x, y, textAnchor }) => (
                      <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" className="fill-foreground text-xs">
                        {name.length > 14 ? `${name.slice(0, 12)}..` : name}: {value}
                      </text>
                    )}
                    labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                    paddingAngle={2}
                  >
                    {skillDistData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} skills`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
