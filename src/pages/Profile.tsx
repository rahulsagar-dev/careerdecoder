import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { profileService, ProfileData } from "@/services/profileService";
import {
  Loader2,
  Pencil,
  Save,
  X,
  LayoutDashboard,
  LogOut,
  Sparkles,
  GraduationCap,
  Target,
  Heart,
  FileText,
  User,
  Mail,
  Building2,
  CalendarDays,
  BookOpen,
  ExternalLink,
  Github,
} from "lucide-react";

const iconContainer = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<ProfileData>({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await profileService.getProfile();
        setProfile(data);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const startEdit = () => {
    setEditData({ ...profile });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditData({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await profileService.updateProfile(editData);
      setProfile(updated);
      setEditing(false);
      toast.success("Profile updated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out");
      navigate("/login");
    } catch {
      toast.error("Failed to log out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sticky Header */}
      <header className="h-14 flex items-center justify-between border-b bg-background/80 backdrop-blur-lg px-4 sm:px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[hsl(260,84%,60%)] flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] bg-clip-text text-transparent">Career Decode</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <LayoutDashboard className="h-4 w-4 mr-1.5" /> Dashboard
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4 mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-8">
        {/* Title Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your personal information and preferences.</p>
          </div>
          {!editing ? (
            <Button variant="outline" onClick={startEdit} className="gap-2 rounded-xl">
              <Pencil className="h-4 w-4" /> Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelEdit} className="rounded-xl"><X className="h-4 w-4 mr-1.5" /> Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] text-primary-foreground rounded-xl">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />} Save
              </Button>
            </div>
          )}
        </div>

        {editing ? (
          /* Edit Mode */
          <Card className="rounded-2xl shadow-sm border">
            <CardContent className="p-6 space-y-5">
              <div>
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <Input value={editData.full_name || ""} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Education</Label>
                  <Input value={editData.education || ""} onChange={(e) => setEditData({ ...editData, education: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">College</Label>
                  <Input value={editData.college || ""} onChange={(e) => setEditData({ ...editData, college: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Degree</Label>
                  <Input value={editData.degree || ""} onChange={(e) => setEditData({ ...editData, degree: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Graduation Year</Label>
                  <Input type="number" value={editData.graduation_year || ""} onChange={(e) => setEditData({ ...editData, graduation_year: e.target.value ? parseInt(e.target.value) : undefined })} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">GitHub URL</Label>
                <Input value={editData.github_url || ""} onChange={(e) => setEditData({ ...editData, github_url: e.target.value })} placeholder="https://github.com/username" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Career Goal</Label>
                <Textarea value={editData.career_goal || ""} onChange={(e) => setEditData({ ...editData, career_goal: e.target.value })} rows={4} className="mt-1" />
              </div>
            </CardContent>
          </Card>
        ) : (
          /* View Mode */
          <>
            {/* Profile Header Card */}
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]" />
              <CardContent className="p-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground">{profile?.full_name || "—"}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Mail className="h-3.5 w-3.5" /> {user?.email}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
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

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Education Card */}
              <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                  <div className={`${iconContainer} bg-primary/10`}>
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Education</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow label="Education" value={profile?.education} icon={BookOpen} />
                  <Separator />
                  <InfoRow label="College" value={profile?.college} icon={Building2} />
                  <Separator />
                  <InfoRow label="Degree" value={profile?.degree} icon={GraduationCap} />
                  <Separator />
                  <InfoRow label="Graduation Year" value={profile?.graduation_year} icon={CalendarDays} />
                  {profile?.github_url && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <Github className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">GitHub</p>
                          <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                            {profile.github_url} <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Career Goals Card */}
              <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                  <div className={`${iconContainer} bg-accent`}>
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Career Goal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed text-[15px]">{profile?.career_goal || "Not set yet."}</p>
                </CardContent>
              </Card>

              {/* Skills Card */}
              <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                  <div className={`${iconContainer} bg-primary/10`}>
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.skills || []).length > 0
                      ? (profile?.skills || []).map((s) => (
                          <Badge key={s} variant="secondary" className="rounded-lg hover:bg-secondary/80 transition-colors cursor-default">{s}</Badge>
                        ))
                      : <p className="text-sm text-muted-foreground">No skills added</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Interests Card */}
              <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                  <div className={`${iconContainer} bg-accent`}>
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Interests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.interests || []).length > 0
                      ? (profile?.interests || []).map((i) => (
                          <Badge key={i} variant="outline" className="rounded-lg hover:bg-primary/5 transition-colors cursor-default">{i}</Badge>
                        ))
                      : <p className="text-sm text-muted-foreground">No interests added</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resume Card */}
            {profile?.resume_url && (
              <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                  <div className={`${iconContainer} bg-primary/10`}>
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Resume</CardTitle>
                </CardHeader>
                <CardContent>
                  <button
                    onClick={async () => {
                      try {
                        const url = await profileService.getResumeBlobUrl(profile.resume_url!);
                        const a = document.createElement("a");
                        a.href = url;
                        a.target = "_blank";
                        a.rel = "noopener noreferrer";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(() => URL.revokeObjectURL(url), 60_000);
                      } catch (e: unknown) {
                        toast.error(e instanceof Error ? e.message : "Failed to open resume");
                      }
                    }}
                    className="text-primary hover:underline text-sm flex items-center gap-1.5 group"
                  >
                    <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    View Resume <ExternalLink className="h-3 w-3" />
                  </button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | number | null; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}

export default Profile;
