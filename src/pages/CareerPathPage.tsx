import { useState, useEffect, useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { careerService, CareerRecommendation } from "@/services/careerService";
import { profileService, ProfileData } from "@/services/profileService";
import { projectService, ProjectSuggestion } from "@/services/projectService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2, X, Lock, Unlock, CheckCircle2, Zap, Route } from "lucide-react";

const SKILL_DEPS: Record<string, string[]> = {
  react: ["javascript"], "next.js": ["react", "typescript"], vue: ["javascript"], angular: ["typescript"],
  "node.js": ["javascript"], express: ["node.js"], django: ["python"], flask: ["python"],
  "machine learning": ["python", "statistics"], "deep learning": ["machine learning"],
  tensorflow: ["python", "machine learning"], pytorch: ["python", "machine learning"],
  kubernetes: ["docker"], docker: ["linux"], "system design": ["data structures", "databases"],
  typescript: ["javascript"], graphql: ["javascript"], redux: ["react"],
  "react native": ["react"], nestjs: ["node.js", "typescript"],
  mongodb: ["databases"], postgresql: ["databases"], redis: ["databases"],
  aws: ["linux"], gcp: ["linux"], azure: ["linux"],
};

const MARKET_DEMAND: Record<string, number> = {
  react: 90, typescript: 88, python: 92, aws: 85, docker: 82, kubernetes: 80,
  "node.js": 84, "machine learning": 87, "next.js": 78, graphql: 70,
  javascript: 95, "system design": 88, databases: 85, linux: 75,
};

function getImportance(skill: string): number {
  const base = MARKET_DEMAND[skill.toLowerCase()] || 50;
  const deps = Object.values(SKILL_DEPS).filter(d => d.includes(skill.toLowerCase())).length;
  return Math.min(100, base + deps * 5);
}

function getNodeStatus(skill: string, userSkills: Set<string>, allSkills: Set<string>): "completed" | "unlocked" | "locked" {
  if (userSkills.has(skill)) return "completed";
  const deps = SKILL_DEPS[skill] || [];
  const allDepsReady = deps.every(d => !allSkills.has(d) || userSkills.has(d));
  return allDepsReady ? "unlocked" : "locked";
}

function computePaths(userSkills: Set<string>, careerSkills: string[]): { fastest: string[]; highImpact: string[] } {
  const missing = careerSkills.filter(s => !userSkills.has(s.toLowerCase()));
  const sorted = [...missing].sort((a, b) => {
    const depsA = (SKILL_DEPS[a.toLowerCase()] || []).filter(d => !userSkills.has(d)).length;
    const depsB = (SKILL_DEPS[b.toLowerCase()] || []).filter(d => !userSkills.has(d)).length;
    return depsA - depsB;
  });
  const impactSorted = [...missing].sort((a, b) => getImportance(b) - getImportance(a));
  return { fastest: sorted.slice(0, 5), highImpact: impactSorted.slice(0, 5) };
}

const statusStyles = {
  completed: { bg: "hsl(142, 76%, 36%)", border: "hsl(142, 76%, 30%)" },
  unlocked: { bg: "hsl(24, 94%, 50%)", border: "hsl(24, 94%, 44%)" },
  locked: { bg: "hsl(0, 0%, 60%)", border: "hsl(0, 0%, 50%)" },
};

const CareerPathPage = () => {
  const [careers, setCareers] = useState<CareerRecommendation[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [projects, setProjects] = useState<ProjectSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p, pr] = await Promise.allSettled([
          careerService.getRecommendations(),
          profileService.getProfile(),
          projectService.getProjects(),
        ]);
        if (c.status === "fulfilled") setCareers(c.value);
        if (p.status === "fulfilled") setProfile(p.value);
        if (pr.status === "fulfilled") setProjects(pr.value);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const userSkills = useMemo(() => new Set((profile?.skills || []).map(s => s.toLowerCase())), [profile]);

  const paths = useMemo(() => {
    const topCareer = careers[0];
    if (!topCareer) return { fastest: [], highImpact: [] };
    const allRequired = [...(topCareer.required_skills || []), ...(topCareer.missing_skills || [])];
    return computePaths(userSkills, allRequired);
  }, [careers, userSkills]);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeIds = new Set<string>();

    const allSkills = new Set<string>();
    careers.forEach(c => {
      (c.required_skills || []).forEach(s => allSkills.add(s.toLowerCase()));
      (c.missing_skills || []).forEach(s => allSkills.add(s.toLowerCase()));
    });
    userSkills.forEach(s => allSkills.add(s));

    let skillIndex = 0;
    const addSkillNode = (skill: string) => {
      const id = `skill-${skill}`;
      if (nodeIds.has(id)) return;
      nodeIds.add(id);
      const status = getNodeStatus(skill, userSkills, allSkills);
      const importance = getImportance(skill);
      const row = Math.floor(skillIndex / 4);
      const col = skillIndex % 4;
      const style = statusStyles[status];
      nodes.push({
        id,
        position: { x: 100 + col * 200, y: 100 + row * 100 },
        data: { label: skill, type: "skill", status, importance, unlocks: Object.keys(SKILL_DEPS).filter(k => SKILL_DEPS[k].includes(skill)) },
        style: {
          background: style.bg,
          color: "white",
          borderRadius: "12px",
          padding: "8px 16px",
          fontSize: "12px",
          fontWeight: 600,
          border: `2px solid ${style.border}`,
          opacity: status === "locked" ? 0.6 : 1,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
      skillIndex++;
    };

    allSkills.forEach(addSkillNode);

    // Dependency edges
    allSkills.forEach(skill => {
      (SKILL_DEPS[skill] || []).forEach(dep => {
        if (allSkills.has(dep)) {
          edges.push({
            id: `dep-${dep}-${skill}`,
            source: `skill-${dep}`,
            target: `skill-${skill}`,
            animated: true,
            label: "depends",
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
          });
        }
      });
    });

    // Career nodes
    careers.slice(0, 5).forEach((career, i) => {
      const id = `career-${career.id}`;
      nodeIds.add(id);
      nodes.push({
        id,
        position: { x: 950, y: 80 + i * 120 },
        data: { label: career.career_title, type: "career", score: career.match_score, missing: career.missing_skills },
        style: {
          background: "hsl(var(--primary))",
          color: "white",
          borderRadius: "16px",
          padding: "10px 20px",
          fontSize: "13px",
          fontWeight: 700,
          border: "3px solid hsl(var(--primary))",
          boxShadow: "0 4px 12px hsl(var(--primary) / 0.3)",
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      (career.required_skills || []).forEach(skill => {
        const sId = `skill-${skill.toLowerCase()}`;
        if (nodeIds.has(sId)) {
          edges.push({
            id: `${sId}-${id}`,
            source: sId,
            target: id,
            style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 },
          });
        }
      });
    });

    // Project nodes
    projects.slice(0, 4).forEach((proj, i) => {
      const id = `project-${proj.id}`;
      nodeIds.add(id);
      nodes.push({
        id,
        position: { x: 1250, y: 100 + i * 130 },
        data: { label: proj.title, type: "project", difficulty: proj.difficulty },
        style: {
          background: "hsl(260, 84%, 60%)",
          color: "white",
          borderRadius: "12px",
          padding: "8px 16px",
          fontSize: "11px",
          fontWeight: 600,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      (proj.skills_covered || []).forEach(skill => {
        const sId = `skill-${skill.toLowerCase()}`;
        if (nodeIds.has(sId)) {
          edges.push({
            id: `${sId}-${id}`,
            source: sId,
            target: id,
            style: { stroke: "hsl(260, 84%, 60%)", strokeDasharray: "5,5", strokeWidth: 1 },
          });
        }
      });
    });

    return { nodes, edges };
  }, [careers, profile, projects, userSkills]);

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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Career Path Graph</h1>
        <p className="text-muted-foreground mt-1">Interactive skill dependency map with intelligence</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Badge className="bg-green-600 text-white"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>
        <Badge className="bg-orange-500 text-white"><Unlock className="h-3 w-3 mr-1" /> Unlocked</Badge>
        <Badge className="bg-muted-foreground text-white"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>
        <Badge className="bg-primary text-primary-foreground">● Career</Badge>
        <Badge style={{ background: "hsl(260, 84%, 60%)" }} className="text-white">● Project</Badge>
      </div>

      {/* Optimized Paths */}
      {(paths.fastest.length > 0 || paths.highImpact.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paths.fastest.length > 0 && (
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Route className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Fastest Path</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {paths.fastest.map((s, i) => (
                    <Badge key={s} variant="secondary" className="text-xs">{i + 1}. {s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {paths.highImpact.length > 0 && (
            <Card className="rounded-2xl shadow-sm border border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Zap className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Highest Impact Path</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {paths.highImpact.map((s, i) => (
                    <Badge key={s} className="text-xs bg-primary/10 text-primary border border-primary/20">{i + 1}. {s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card className="rounded-2xl shadow-sm border overflow-hidden">
        <CardContent className="p-0">
          <div style={{ height: 600 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodeClick={(_, node) => setSelectedNode(node)}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Detail Panel */}
      {selectedNode && (
        <Card className="rounded-2xl shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{String(selectedNode.data.label)}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Type: <Badge variant="secondary">{String(selectedNode.data.type)}</Badge></p>
            {selectedNode.data.status && (
              <p className="text-sm text-muted-foreground">
                Status: <Badge variant={selectedNode.data.status === "completed" ? "default" : selectedNode.data.status === "locked" ? "destructive" : "secondary"}>
                  {String(selectedNode.data.status)}
                </Badge>
              </p>
            )}
            {selectedNode.data.importance !== undefined && (
              <p className="text-sm text-muted-foreground">Importance: <span className="font-bold text-primary">{String(selectedNode.data.importance)}/100</span></p>
            )}
            {selectedNode.data.score !== undefined && (
              <p className="text-sm text-muted-foreground">Match Score: <span className="font-bold text-primary">{String(selectedNode.data.score)}%</span></p>
            )}
            {selectedNode.data.difficulty && (
              <p className="text-sm text-muted-foreground">Difficulty: <Badge variant="outline">{String(selectedNode.data.difficulty)}</Badge></p>
            )}
            {/* Why it matters */}
            {selectedNode.data.type === "skill" && (
              <div className="p-3 rounded-xl bg-muted/50 space-y-2">
                <p className="text-xs font-semibold">Why this matters:</p>
                {selectedNode.data.status === "completed" ? (
                  <p className="text-xs text-muted-foreground">You've mastered this skill. It contributes to your career readiness.</p>
                ) : selectedNode.data.status === "locked" ? (
                  <p className="text-xs text-muted-foreground">This skill requires prerequisites. Complete its dependencies first.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">This skill is ready to learn and has an importance score of {String(selectedNode.data.importance)}/100.</p>
                )}
                {(selectedNode.data.unlocks as string[])?.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Unlocks: {(selectedNode.data.unlocks as string[]).join(", ")}
                  </p>
                )}
              </div>
            )}
            {selectedNode.data.type === "career" && (selectedNode.data.missing as string[])?.length > 0 && (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs font-semibold mb-1">Missing skills:</p>
                <div className="flex flex-wrap gap-1">
                  {(selectedNode.data.missing as string[]).map((s: string) => (
                    <Badge key={s} variant="destructive" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default CareerPathPage;
