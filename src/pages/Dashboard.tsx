import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { profileService, ProfileData } from "@/services/profileService";
import { careerService, CareerRecommendation, SkillAnalysis } from "@/services/careerService";
import { roadmapService, LearningRoadmap } from "@/services/roadmapService";
import { projectService, ProjectSuggestion } from "@/services/projectService";
import {
  Loader2,
  GraduationCap,
  Target,
  Sparkles,
  Hash,
  AlertTriangle,
  User,
  Mail,
  Building2,
  CalendarDays,
  Compass,
  BarChart3,
  BookOpen,
  FolderKanban,
  Briefcase,
  Heart,
  ArrowRight,
  CheckCircle2,
  Clock,
  Circle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const iconContainer = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [careers, setCareers] = useState<CareerRecommendation[]>([]);
  const [skillAnalysis, setSkillAnalysis] = useState<SkillAnalysis | null>(null);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [projects, setProjects] = useState<ProjectSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileData, careerData, analysisData, roadmapData, projectData] = await Promise.allSettled([
          profileService.getProfile(),
          careerService.getRecommendations(),
          careerService.getSkillAnalysis(),
          roadmapService.getRoadmap(),
          projectService.getProjects(),
        ]);
        if (profileData.status === "fulfilled") setProfile(profileData.value);
        if (careerData.status === "fulfilled") setCareers(careerData.value);
        if (analysisData.status === "fulfilled") setSkillAnalysis(analysisData.value);
        if (roadmapData.status === "fulfilled") setRoadmap(roadmapData.value);
        if (projectData.status === "fulfilled") setProjects(projectData.value);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isProfileIncomplete = !profile?.full_name || !profile?.degree;
  const skillCount = (profile?.skills || []).length;
  const interestCount = (profile?.interests || []).length;

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
    <DashboardLayout userName={profile?.full_name || user?.email}>
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome, <span className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] bg-clip-text text-transparent">{profile?.full_name || user?.email}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Here's your career overview at a glance.</p>
      </div>

      {/* Incomplete Profile Warning */}
      {isProfileIncomplete && (
        <Card className="rounded-2xl border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 shadow-sm">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Your profile is incomplete</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400/80">Complete your profile to unlock AI-powered career insights.</p>
            </div>
            <Button size="sm" onClick={() => navigate("/profile/setup")} className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] text-primary-foreground shrink-0">
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Profile Summary */}
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className={`${iconContainer} bg-primary/10`}><User className="h-5 w-5 text-primary" /></div>
          <CardTitle className="text-lg font-semibold">Profile Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xl font-semibold text-foreground">{profile?.full_name || "—"}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5" /> {user?.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile?.degree && (
                  <Badge variant="secondary" className="gap-1.5 rounded-lg"><GraduationCap className="h-3 w-3" /> {profile.degree}</Badge>
                )}
                {profile?.graduation_year && (
                  <Badge variant="secondary" className="gap-1.5 rounded-lg"><CalendarDays className="h-3 w-3" /> {profile.graduation_year}</Badge>
                )}
                {profile?.college && (
                  <Badge variant="secondary" className="gap-1.5 rounded-lg"><Building2 className="h-3 w-3" /> {profile.college}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats + Career Goal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className={`${iconContainer} bg-accent`}><Hash className="h-5 w-5 text-primary" /></div>
            <CardTitle className="text-lg font-semibold">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Skills</span>
              <span className="text-2xl font-bold text-primary">{skillCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Interests</span>
              <span className="text-2xl font-bold text-primary">{interestCount}</span>
            </div>
            {skillAnalysis && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Readiness</span>
                <span className="text-2xl font-bold text-primary">{skillAnalysis.readiness_score}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className={`${iconContainer} bg-primary/10`}><Target className="h-5 w-5 text-primary" /></div>
            <CardTitle className="text-lg font-semibold">Career Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{profile?.career_goal || "Not set yet — update your profile to set a career goal."}</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills + Interests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className={`${iconContainer} bg-primary/10`}><Sparkles className="h-5 w-5 text-primary" /></div>
            <CardTitle className="text-lg font-semibold">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {skillCount > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(profile?.skills || []).map((skill) => (
                  <Badge key={skill} variant="secondary" className="rounded-lg hover:bg-secondary/80 transition-colors">{skill}</Badge>
                ))}
              </div>
            ) : (
              <EmptyState icon={Sparkles} text="Complete your profile to add skills" />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className={`${iconContainer} bg-accent`}><Heart className="h-5 w-5 text-primary" /></div>
            <CardTitle className="text-lg font-semibold">Interests</CardTitle>
          </CardHeader>
          <CardContent>
            {interestCount > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(profile?.interests || []).map((interest) => (
                  <Badge key={interest} variant="outline" className="rounded-lg hover:bg-primary/5 transition-colors">{interest}</Badge>
                ))}
              </div>
            ) : (
              <EmptyState icon={Heart} text="Complete your profile to add interests" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Careers */}
      <Card id="career-paths" className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className={`${iconContainer} bg-primary/10`}><Compass className="h-5 w-5 text-primary" /></div>
            <CardTitle className="text-lg font-semibold">Recommended Careers</CardTitle>
          </div>
          {careers.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/career-recommendations")} className="text-primary gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {careers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {careers.slice(0, 3).map((career) => (
                <div
                  key={career.id}
                  onClick={() => navigate(`/career-details/${career.id}`)}
                  className="p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-foreground truncate flex-1">{career.career_title}</p>
                    <Badge variant="secondary" className="ml-2 shrink-0">{career.match_score}%</Badge>
                  </div>
                  <Progress value={career.match_score} className="h-1.5" />
                  <div className="flex flex-wrap gap-1">
                    {(career.missing_skills || []).slice(0, 2).map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">{s}</Badge>
                    ))}
                    {(career.missing_skills || []).length > 2 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{(career.missing_skills || []).length - 2}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Compass} text="Generate career recommendations to see them here" action={() => navigate("/career-recommendations")} actionLabel="Get Recommendations" />
          )}
        </CardContent>
      </Card>

      {/* Skill Gap Analysis */}
      <Card id="skill-gaps" className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className={`${iconContainer} bg-accent`}><BarChart3 className="h-5 w-5 text-primary" /></div>
            <CardTitle className="text-lg font-semibold">Skill Gap Analysis</CardTitle>
          </div>
          {skillAnalysis && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/skill-analysis")} className="text-primary gap-1">
              View Details <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {skillAnalysis ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 text-center space-y-1">
                <p className="text-2xl font-bold text-primary">{skillAnalysis.readiness_score}%</p>
                <p className="text-xs text-muted-foreground">Readiness Score</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 text-center space-y-1">
                <p className="text-2xl font-bold text-green-600">{skillAnalysis.matched_skills}</p>
                <p className="text-xs text-muted-foreground">Matched Skills</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 text-center space-y-1">
                <p className="text-2xl font-bold text-orange-500">{skillAnalysis.missing_skills}</p>
                <p className="text-xs text-muted-foreground">Skills to Learn</p>
              </div>
            </div>
          ) : (
            <EmptyState icon={BarChart3} text="Run a skill analysis to see your gap insights" action={() => navigate("/skill-analysis")} actionLabel="Analyze Skills" />
          )}
        </CardContent>
      </Card>

      {/* Learning Roadmap */}
      <Card id="learning-roadmap" className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className={`${iconContainer} bg-primary/10`}><BookOpen className="h-5 w-5 text-primary" /></div>
            <CardTitle className="text-lg font-semibold">Learning Roadmap</CardTitle>
          </div>
          {roadmap && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/learning-roadmap")} className="text-primary gap-1">
              View Roadmap <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {roadmap ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{roadmap.career_title}</p>
                  <p className="text-sm text-muted-foreground">{roadmap.completed_steps} of {roadmap.total_steps} steps completed</p>
                </div>
                <span className="text-2xl font-bold text-primary">{roadmap.progress}%</span>
              </div>
              <Progress value={roadmap.progress} className="h-2" />
            </div>
          ) : (
            <EmptyState icon={BookOpen} text="Generate a learning roadmap to track your progress" action={() => navigate("/learning-roadmap")} actionLabel="Create Roadmap" />
          )}
        </CardContent>
      </Card>

      {/* Suggested Projects */}
      <Card id="projects" className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className={`${iconContainer} bg-accent`}><FolderKanban className="h-5 w-5 text-primary" /></div>
            <CardTitle className="text-lg font-semibold">Suggested Projects</CardTitle>
          </div>
          {projects.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/learning-roadmap")} className="text-primary gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((project) => (
                <div key={project.id} className="p-4 rounded-xl border bg-card hover:shadow-md transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-foreground truncate flex-1">{project.title}</p>
                    <DifficultyBadge difficulty={project.difficulty} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{project.estimated_time}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(project.skills_covered || []).slice(0, 3).map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FolderKanban} text="Generate project suggestions to build your portfolio" action={() => navigate("/learning-roadmap")} actionLabel="Get Projects" />
          )}
        </CardContent>
      </Card>

      {/* Internships - Coming Soon */}
      <Card id="internships" className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className={`${iconContainer} bg-primary/10`}><Briefcase className="h-5 w-5 text-primary" /></div>
          <CardTitle className="text-lg font-semibold">Internships</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Briefcase} text="Internship recommendations coming soon" />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const variant = difficulty === "Advanced" ? "destructive" : difficulty === "Intermediate" ? "default" : "secondary";
  return <Badge variant={variant} className="text-[10px] px-1.5 py-0 shrink-0">{difficulty}</Badge>;
}

function EmptyState({ icon: Icon, text, action, actionLabel }: { icon: React.ElementType; text: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-3">{text}</p>
      {action && actionLabel && (
        <Button size="sm" variant="outline" onClick={action} className="gap-1.5">
          {actionLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export default Dashboard;
