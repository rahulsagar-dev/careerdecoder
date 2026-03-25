import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { profileService, ProfileData } from "@/services/profileService";
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
  CheckCircle2,
  Clock,
  Circle,
  FolderKanban,
  Briefcase,
  MapPin,
  Timer,
  Heart,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const iconContainer = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await profileService.getProfile();
        setProfile(data);
      } catch {
        // Profile might not exist
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

      {/* Profile Summary Card - Full Width */}
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className={`${iconContainer} bg-primary/10`}>
            <User className="h-5 w-5 text-primary" />
          </div>
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
                  <Badge variant="secondary" className="gap-1.5 rounded-lg">
                    <GraduationCap className="h-3 w-3" /> {profile.degree}
                  </Badge>
                )}
                {profile?.graduation_year && (
                  <Badge variant="secondary" className="gap-1.5 rounded-lg">
                    <CalendarDays className="h-3 w-3" /> {profile.graduation_year}
                  </Badge>
                )}
                {profile?.college && (
                  <Badge variant="secondary" className="gap-1.5 rounded-lg">
                    <Building2 className="h-3 w-3" /> {profile.college}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats + Career Goal Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className={`${iconContainer} bg-accent`}>
              <Hash className="h-5 w-5 text-primary" />
            </div>
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
          </CardContent>
        </Card>

        {/* Career Goal */}
        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className={`${iconContainer} bg-primary/10`}>
              <Target className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold">Career Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{profile?.career_goal || "Not set yet — update your profile to set a career goal."}</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills + Interests Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills */}
        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className={`${iconContainer} bg-primary/10`}>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
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

        {/* Interests */}
        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className={`${iconContainer} bg-accent`}>
              <Heart className="h-5 w-5 text-primary" />
            </div>
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

      {/* Recommended Careers - Coming Soon */}
      <Card id="career-paths" className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className={`${iconContainer} bg-primary/10`}>
            <Compass className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">Recommended Careers</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Compass} text="Complete your profile to unlock AI career recommendations" />
        </CardContent>
      </Card>

      {/* Skill Gap Analysis */}
      <Card id="skill-gaps" className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className={`${iconContainer} bg-accent`}>
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">Skill Gap Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={BarChart3} text="Complete your profile to unlock skill gap insights" />
        </CardContent>
      </Card>

      {/* Learning Roadmap */}
      <Card id="learning-roadmap" className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className={`${iconContainer} bg-primary/10`}>
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">Learning Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={BookOpen} text="Complete your profile to generate your learning roadmap" />
        </CardContent>
      </Card>

      {/* Suggested Projects */}
      <Card id="projects" className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className={`${iconContainer} bg-accent`}>
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">Suggested Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={FolderKanban} text="Complete your profile to get project suggestions" />
        </CardContent>
      </Card>

      {/* Internships */}
      <Card id="internships" className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className={`${iconContainer} bg-primary/10`}>
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">Internships</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Briefcase} text="Complete your profile to discover internship opportunities" />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export default Dashboard;
