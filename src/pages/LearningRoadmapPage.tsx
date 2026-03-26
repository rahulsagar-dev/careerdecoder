import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, CheckCircle2, Clock, Circle, RefreshCw, Loader2,
  Rocket, ArrowRight, Timer, Sparkles, FolderKanban,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { roadmapService, type LearningRoadmap, type RoadmapStep } from "@/services/roadmapService";
import { projectService, type ProjectSuggestion } from "@/services/projectService";
import { careerService } from "@/services/careerService";

const LearningRoadmapPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [projects, setProjects] = useState<ProjectSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingProjects, setGeneratingProjects] = useState(false);
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [rm, projs] = await Promise.all([
        roadmapService.getRoadmap(),
        projectService.getProjects(),
      ]);
      setRoadmap(rm);
      setProjects(projs);
      if (rm) {
        const s = await roadmapService.getStepsByRoadmap(rm.id);
        setSteps(s);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      // Get top career recommendation for context
      const recs = await careerService.getRecommendations();
      const topCareer = recs?.[0];
      const result = await roadmapService.generateRoadmap(
        topCareer?.career_title || "Software Developer",
        topCareer?.missing_skills || []
      );
      setRoadmap(result.roadmap);
      setSteps(result.steps);
      toast.success("Learning roadmap generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate roadmap");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateProjects = async () => {
    try {
      setGeneratingProjects(true);
      const recs = await careerService.getRecommendations();
      const topCareer = recs?.[0];
      const result = await projectService.generateProjects(
        topCareer?.missing_skills || [],
        topCareer?.career_title || ""
      );
      setProjects(result);
      toast.success("Project suggestions generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate projects");
    } finally {
      setGeneratingProjects(false);
    }
  };

  const handleStepToggle = async (step: RoadmapStep) => {
    if (!roadmap) return;
    try {
      setUpdatingStep(step.id);
      const newStatus = step.status === "completed" ? "pending" : "completed";
      const { completed, progress } = await roadmapService.updateStepStatus(step.id, newStatus, roadmap.id);
      setSteps((prev) => prev.map((s) => s.id === step.id ? { ...s, status: newStatus } : s));
      setRoadmap((prev) => prev ? { ...prev, completed_steps: completed, progress } : null);
    } catch (e: any) {
      toast.error("Failed to update step");
    } finally {
      setUpdatingStep(null);
    }
  };

  const getStepIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === "in-progress") return <Clock className="h-5 w-5 text-primary" />;
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const getDifficultyVariant = (d: string) => {
    if (d === "Beginner") return "secondary";
    if (d === "Intermediate") return "default";
    return "destructive";
  };

  if (loading) {
    return (
      <DashboardLayout userName={user?.user_metadata?.full_name}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-24 w-full" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userName={user?.user_metadata?.full_name}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              Your Learning Roadmap
            </h1>
            <p className="text-muted-foreground mt-1">
              {roadmap ? `Tailored for: ${roadmap.career_title}` : "Generate a personalized learning path based on your career goals"}
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="gap-2"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {roadmap ? "Regenerate" : "Generate Roadmap"}
          </Button>
        </div>

        {/* No roadmap state */}
        {!roadmap && !generating && (
          <Card className="rounded-2xl shadow-sm border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No roadmap yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Generate a personalized learning roadmap based on your career recommendations and skill gaps.
              </p>
              <Button onClick={handleGenerate} disabled={generating} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Your Roadmap
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Generating state */}
        {generating && (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Generating your roadmap...</h3>
              <p className="text-muted-foreground">Our AI is crafting a personalized learning path for you.</p>
            </CardContent>
          </Card>
        )}

        {/* Progress Section */}
        {roadmap && (
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">
                  Overall Progress
                </span>
                <span className="text-sm font-semibold text-primary">{roadmap.progress}%</span>
              </div>
              <Progress value={roadmap.progress} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                You've completed {roadmap.completed_steps} of {roadmap.total_steps} steps
              </p>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {roadmap && steps.length > 0 && (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div key={step.id} className="relative flex gap-4">
                  {/* Icon on timeline */}
                  <div className="relative z-10 flex-shrink-0 w-[46px] flex justify-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      step.status === "completed"
                        ? "bg-green-500/10 border-green-500"
                        : step.status === "in-progress"
                        ? "bg-primary/10 border-primary"
                        : "bg-muted border-border"
                    }`}>
                      {getStepIcon(step.status)}
                    </div>
                  </div>

                  {/* Content card */}
                  <Card className="flex-1 rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Step {step.step_order}</span>
                            <Badge variant={step.status === "completed" ? "default" : step.status === "in-progress" ? "secondary" : "outline"} className="text-[10px]">
                              {step.status === "completed" ? "Completed" : step.status === "in-progress" ? "In Progress" : "Pending"}
                            </Badge>
                          </div>
                          <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                        </div>
                        <Button
                          size="sm"
                          variant={step.status === "completed" ? "outline" : "default"}
                          onClick={() => handleStepToggle(step)}
                          disabled={updatingStep === step.id}
                          className="text-xs shrink-0"
                        >
                          {updatingStep === step.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : step.status === "completed" ? (
                            "Undo"
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Complete
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          {step.estimated_time}
                        </div>
                        {step.resources?.map((r, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{r}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Suggestions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              Suggested Projects
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateProjects}
              disabled={generatingProjects}
              className="gap-2"
            >
              {generatingProjects ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              {projects.length ? "Regenerate" : "Generate"}
            </Button>
          </div>

          {generatingProjects && (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="flex flex-col items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Generating project ideas...</p>
              </CardContent>
            </Card>
          )}

          {!generatingProjects && projects.length === 0 && (
            <Card className="rounded-2xl shadow-sm border-dashed">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <FolderKanban className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No project suggestions yet.</p>
                <Button size="sm" onClick={handleGenerateProjects} className="gap-2">
                  <Sparkles className="h-3 w-3" />
                  Generate Project Ideas
                </Button>
              </CardContent>
            </Card>
          )}

          {projects.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((p) => (
                <Card key={p.id} className="rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-[1.01]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{p.title}</CardTitle>
                      <Badge variant={getDifficultyVariant(p.difficulty)} className="text-[10px] shrink-0">
                        {p.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 text-xs">{p.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {p.skills_covered?.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      {p.estimated_time}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LearningRoadmapPage;
