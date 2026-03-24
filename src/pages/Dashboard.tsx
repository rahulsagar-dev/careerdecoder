import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { profileService, ProfileData } from "@/services/profileService";
import { Loader2, GraduationCap, Target, Sparkles, Hash } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Dashboard = () => {
  const { user } = useAuth();
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
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome, <span className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] bg-clip-text text-transparent">{profile?.full_name || user?.email}</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <Card className="shadow-md rounded-xl border-0 col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5 text-primary" /> Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">{profile?.full_name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Degree</p>
                <p className="font-medium text-foreground">{profile?.degree || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">College</p>
                <p className="font-medium text-foreground">{profile?.college || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Graduation</p>
                <p className="font-medium text-foreground">{profile?.graduation_year || "—"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-md rounded-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Hash className="h-5 w-5 text-primary" /> Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Skills</span>
                <span className="text-2xl font-bold text-primary">{(profile?.skills || []).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Interests</span>
                <span className="text-2xl font-bold text-primary">{(profile?.interests || []).length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Career Goal */}
          <Card className="shadow-md rounded-xl border-0 col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" /> Career Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{profile?.career_goal || "Not set yet"}</p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="shadow-md rounded-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" /> Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(profile?.skills || []).length > 0
                  ? (profile?.skills || []).map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))
                  : <p className="text-sm text-muted-foreground">No skills added</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
