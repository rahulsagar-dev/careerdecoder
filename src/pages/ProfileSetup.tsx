import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { profileService, ProfileData } from "@/services/profileService";
import { Loader2, Upload, X, Check, ArrowLeft, ArrowRight, FileText } from "lucide-react";

const SKILL_CATEGORIES: Record<string, string[]> = {
  Programming: ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust"],
  "Data Science": ["Pandas", "NumPy", "TensorFlow", "PyTorch", "R", "SQL"],
  "Web Development": ["React", "Next.js", "Node.js", "HTML/CSS", "Tailwind", "Vue.js"],
  "AI/ML": ["Machine Learning", "Deep Learning", "NLP", "Computer Vision", "LLMs"],
  Tools: ["Git", "Docker", "AWS", "Linux", "Figma", "VS Code"],
};

const INTEREST_OPTIONS = [
  "Artificial Intelligence", "Web Development", "Cybersecurity", "Design",
  "Product Management", "Data Science", "Mobile Development", "Cloud Computing",
  "Blockchain", "DevOps", "Game Development", "IoT",
];

const TOTAL_STEPS = 5;

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [customSkill, setCustomSkill] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [formData, setFormData] = useState<ProfileData>({
    full_name: "",
    education: "",
    college: "",
    degree: "",
    graduation_year: undefined,
    skills: [],
    interests: [],
    career_goal: "",
    resume_url: "",
  });

  const updateField = (field: keyof ProfileData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: "skills" | "interests", item: string) => {
    const current = formData[field] || [];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    updateField(field, updated);
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !(formData.skills || []).includes(customSkill.trim())) {
      updateField("skills", [...(formData.skills || []), customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  }, []);

  const validateAndSetFile = (file: File | undefined) => {
    if (!file) return;
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only PDF and DOCX files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }
    setResumeFile(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let resumeUrl = "";
      if (resumeFile) {
        resumeUrl = await profileService.uploadResume(resumeFile);
      }
      await profileService.createProfile({ ...formData, resume_url: resumeUrl || undefined });
      toast.success("Profile created successfully!");
      navigate("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!formData.full_name?.trim();
      case 2: return (formData.skills || []).length > 0;
      case 3: return (formData.interests || []).length > 0;
      case 4: return true;
      case 5: return !!formData.career_goal?.trim();
      default: return false;
    }
  };

  const stepLabels = ["Personal Info", "Skills", "Interests", "Resume", "Career Goal"];

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {stepLabels.map((label, i) => (
              <span
                key={label}
                className={`text-xs font-medium ${i + 1 <= step ? "text-primary" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            ))}
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
        </div>

        <Card className="shadow-lg rounded-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] bg-clip-text text-transparent">
              Step {step} of {TOTAL_STEPS}
            </CardTitle>
            <CardDescription>{stepLabels[step - 1]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" value={formData.full_name || ""} onChange={(e) => updateField("full_name", e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <Label htmlFor="education">Education Level</Label>
                  <Input id="education" value={formData.education || ""} onChange={(e) => updateField("education", e.target.value)} placeholder="e.g., Bachelor's, Master's" />
                </div>
                <div>
                  <Label htmlFor="college">College / University</Label>
                  <Input id="college" value={formData.college || ""} onChange={(e) => updateField("college", e.target.value)} placeholder="e.g., MIT" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="degree">Degree</Label>
                    <Input id="degree" value={formData.degree || ""} onChange={(e) => updateField("degree", e.target.value)} placeholder="e.g., Computer Science" />
                  </div>
                  <div>
                    <Label htmlFor="grad_year">Graduation Year</Label>
                    <Input id="grad_year" type="number" value={formData.graduation_year || ""} onChange={(e) => updateField("graduation_year", e.target.value ? parseInt(e.target.value) : undefined)} placeholder="2025" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Skills */}
            {step === 2 && (
              <div className="space-y-6">
                {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
                  <div key={category}>
                    <Label className="text-sm font-semibold mb-2 block">{category}</Label>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant={(formData.skills || []).includes(skill) ? "default" : "outline"}
                          className="cursor-pointer transition-all hover:scale-105"
                          onClick={() => toggleArrayItem("skills", skill)}
                        >
                          {(formData.skills || []).includes(skill) && <Check className="h-3 w-3 mr-1" />}
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <Label>Add Custom Skill</Label>
                  <div className="flex gap-2">
                    <Input value={customSkill} onChange={(e) => setCustomSkill(e.target.value)} placeholder="Type a skill..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())} />
                    <Button type="button" variant="outline" onClick={addCustomSkill}>Add</Button>
                  </div>
                </div>
                {(formData.skills || []).length > 0 && (
                  <div>
                    <Label className="text-sm">Selected ({(formData.skills || []).length})</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(formData.skills || []).map((skill) => (
                        <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => toggleArrayItem("skills", skill)}>
                          {skill} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Interests */}
            {step === 3 && (
              <div className="space-y-4">
                <Label>Select your interests *</Label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <Badge
                      key={interest}
                      variant={(formData.interests || []).includes(interest) ? "default" : "outline"}
                      className="cursor-pointer transition-all hover:scale-105 px-4 py-2 text-sm"
                      onClick={() => toggleArrayItem("interests", interest)}
                    >
                      {(formData.interests || []).includes(interest) && <Check className="h-3 w-3 mr-1" />}
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Resume Upload */}
            {step === 4 && (
              <div className="space-y-4">
                <Label>Upload Resume (optional)</Label>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                >
                  {resumeFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">{resumeFile.name}</p>
                        <p className="text-sm text-muted-foreground">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setResumeFile(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-foreground font-medium">Drag & drop your resume here</p>
                      <p className="text-sm text-muted-foreground mt-1">PDF or DOCX, max 5MB</p>
                      <label className="mt-4 inline-block">
                        <input type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => validateAndSetFile(e.target.files?.[0])} />
                        <Button variant="outline" asChild><span>Browse Files</span></Button>
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Career Goal */}
            {step === 5 && (
              <div className="space-y-4">
                <Label htmlFor="career_goal">What career are you aiming for? *</Label>
                <Textarea
                  id="career_goal"
                  value={formData.career_goal || ""}
                  onChange={(e) => updateField("career_goal", e.target.value)}
                  placeholder="e.g., I want to become a full-stack engineer at a top tech company, specializing in AI-powered products..."
                  rows={5}
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              {step < TOTAL_STEPS ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]">
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading || !canProceed()} className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
