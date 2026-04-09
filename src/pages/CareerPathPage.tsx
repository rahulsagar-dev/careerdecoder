import { useState, useEffect, useCallback, useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { careerService, CareerRecommendation } from "@/services/careerService";
import { profileService, ProfileData } from "@/services/profileService";
import { projectService, ProjectSuggestion } from "@/services/projectService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2, X } from "lucide-react";

const SKILL_DEPS: Record<string, string[]> = {
  react: ["javascript"], "next.js": ["react"], vue: ["javascript"], angular: ["typescript"],
  "node.js": ["javascript"], express: ["node.js"], django: ["python"], flask: ["python"],
  "machine learning": ["python", "statistics"], "deep learning": ["machine learning"],
  tensorflow: ["python", "machine learning"], pytorch: ["python", "machine learning"],
  kubernetes: ["docker"], docker: ["linux"], "system design": ["data structures", "databases"],
  typescript: ["javascript"], graphql: ["javascript"], redux: ["react"],
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

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeIds = new Set<string>();
    const userSkills = new Set((profile?.skills || []).map((s) => s.toLowerCase()));

    // Add user skills as nodes
    const skillY: Record<string, number> = {};
    let skillIndex = 0;
    const addSkillNode = (skill: string) => {
      const id = `skill-${skill}`;
      if (nodeIds.has(id)) return;
      nodeIds.add(id);
      const hasSkill = userSkills.has(skill.toLowerCase());
      const row = Math.floor(skillIndex / 4);
      const col = skillIndex % 4;
      skillY[skill] = row;
      nodes.push({
        id,
        position: { x: 100 + col * 200, y: 100 + row * 100 },
        data: {
          label: skill,
          type: "skill",
          status: hasSkill ? "acquired" : "missing",
        },
        style: {
          background: hasSkill ? "hsl(142, 76%, 36%)" : "hsl(24, 94%, 50%)",
          color: "white",
          borderRadius: "12px",
          padding: "8px 16px",
          fontSize: "12px",
          fontWeight: 600,
          border: "2px solid transparent",
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
      skillIndex++;
    };

    // Collect all skills from careers
    const allSkills = new Set<string>();
    careers.forEach((c) => {
      (c.required_skills || []).forEach((s) => allSkills.add(s.toLowerCase()));
      (c.missing_skills || []).forEach((s) => allSkills.add(s.toLowerCase()));
    });
    userSkills.forEach((s) => allSkills.add(s));

    allSkills.forEach(addSkillNode);

    // Skill dependency edges
    allSkills.forEach((skill) => {
      const deps = SKILL_DEPS[skill] || [];
      deps.forEach((dep) => {
        if (allSkills.has(dep)) {
          edges.push({
            id: `dep-${dep}-${skill}`,
            source: `skill-${dep}`,
            target: `skill-${skill}`,
            animated: true,
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
        position: { x: 900, y: 80 + i * 120 },
        data: { label: career.career_title, type: "career", score: career.match_score },
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

      // Connect required skills to career
      (career.required_skills || []).forEach((skill) => {
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
        position: { x: 1200, y: 100 + i * 130 },
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

      // Connect skills to projects
      (proj.skills_covered || []).forEach((skill) => {
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
  }, [careers, profile, projects]);

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
        <p className="text-muted-foreground mt-1">Visualize skill dependencies, careers, and projects</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Badge className="bg-green-600 text-white">● Acquired Skill</Badge>
        <Badge className="bg-orange-500 text-white">● Missing Skill</Badge>
        <Badge className="bg-primary text-primary-foreground">● Career Path</Badge>
        <Badge style={{ background: "hsl(260, 84%, 60%)" }} className="text-white">● Project</Badge>
      </div>

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

      {selectedNode && (
        <Card className="rounded-2xl shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{String(selectedNode.data.label)}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Type: <Badge variant="secondary">{String(selectedNode.data.type)}</Badge></p>
              {selectedNode.data.score !== undefined && (
                <p className="text-sm text-muted-foreground">Match Score: <span className="font-bold text-primary">{String(selectedNode.data.score)}%</span></p>
              )}
              {selectedNode.data.status && (
                <p className="text-sm text-muted-foreground">Status: <Badge variant={selectedNode.data.status === "acquired" ? "default" : "destructive"}>{String(selectedNode.data.status)}</Badge></p>
              )}
              {selectedNode.data.difficulty && (
                <p className="text-sm text-muted-foreground">Difficulty: <Badge variant="outline">{String(selectedNode.data.difficulty)}</Badge></p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default CareerPathPage;
