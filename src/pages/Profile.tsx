import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { profileService, ProfileData } from "@/services/profileService";
import { Loader2, Pencil, Save, X } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Profile = () => {
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
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-md rounded-xl border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] bg-clip-text text-transparent">
              My Profile
            </CardTitle>
            {!editing ? (
              <Button variant="outline" onClick={startEdit}>
                <Pencil className="h-4 w-4 mr-2" /> Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancelEdit}><X className="h-4 w-4 mr-2" /> Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={editData.full_name || ""} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Education</Label>
                    <Input value={editData.education || ""} onChange={(e) => setEditData({ ...editData, education: e.target.value })} />
                  </div>
                  <div>
                    <Label>College</Label>
                    <Input value={editData.college || ""} onChange={(e) => setEditData({ ...editData, college: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Degree</Label>
                    <Input value={editData.degree || ""} onChange={(e) => setEditData({ ...editData, degree: e.target.value })} />
                  </div>
                  <div>
                    <Label>Graduation Year</Label>
                    <Input type="number" value={editData.graduation_year || ""} onChange={(e) => setEditData({ ...editData, graduation_year: e.target.value ? parseInt(e.target.value) : undefined })} />
                  </div>
                </div>
                <div>
                  <Label>GitHub URL</Label>
                  <Input value={editData.github_url || ""} onChange={(e) => setEditData({ ...editData, github_url: e.target.value })} placeholder="https://github.com/username" />
                </div>
                <div>
                  <Label>Career Goal</Label>
                  <Textarea value={editData.career_goal || ""} onChange={(e) => setEditData({ ...editData, career_goal: e.target.value })} rows={4} />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-y-4">
                  {[
                    ["Full Name", profile?.full_name],
                    ["Education", profile?.education],
                    ["College", profile?.college],
                    ["Degree", profile?.degree],
                    ["Graduation Year", profile?.graduation_year],
                    ["GitHub", profile?.github_url],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <p className="text-sm text-muted-foreground">{label as string}</p>
                      <p className="font-medium text-foreground">{(value as string | number) || "—"}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.skills || []).length > 0
                      ? (profile?.skills || []).map((s) => <Badge key={s} variant="secondary">{s}</Badge>)
                      : <span className="text-sm text-muted-foreground">None</span>}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.interests || []).length > 0
                      ? (profile?.interests || []).map((i) => <Badge key={i}>{i}</Badge>)
                      : <span className="text-sm text-muted-foreground">None</span>}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Career Goal</p>
                  <p className="text-foreground">{profile?.career_goal || "—"}</p>
                </div>

                {profile?.resume_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Resume</p>
                    <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">View Resume</a>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
