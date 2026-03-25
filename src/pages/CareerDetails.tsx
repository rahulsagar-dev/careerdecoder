import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { careerService, CareerRecommendation } from "@/services/careerService";
import { Loader2, ArrowLeft, DollarSign, Target, Sparkles, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const iconContainer = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0";

const CareerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [career, setCareer] = useState<CareerRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const data = await careerService.getCareerById(id);
      setCareer(data);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!career) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Career not found.</p>
          <Button variant="outline" onClick={() => navigate("/career-recommendations")} className="mt-4">Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  const userHasSkill = (skill: string) => !career.missing_skills.some(m => m.toLowerCase() === skill.toLowerCase());

  return (
    <DashboardLayout>
      <Button variant="ghost" onClick={() => navigate("/career-recommendations")} className="gap-2 mb-2">
        <ArrowLeft className="h-4 w-4" /> Back to Recommendations
      </Button>

      {/* Header Card */}
      <Card className="rounded-2xl shadow-sm border overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]" />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeDasharray={`${(career.match_score / 100) * 213.6} 213.6`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary">{career.match_score}%</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{career.career_title}</h1>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" /> {career.salary_range}
              </div>
              <p className="text-foreground mt-4 leading-relaxed">{career.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Required Skills */}
        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className={`${iconContainer} bg-primary/10`}>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold">Required Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {career.required_skills.map((skill) => (
                <Badge
                  key={skill}
                  variant={userHasSkill(skill) ? "secondary" : "outline"}
                  className={`rounded-lg ${userHasSkill(skill) ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "border-destructive/50 text-destructive"}`}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Missing Skills */}
        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className={`${iconContainer} bg-destructive/10`}>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <CardTitle className="text-lg font-semibold">Missing Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {career.missing_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {career.missing_skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="rounded-lg border-destructive/50 text-destructive">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">🎉 You have all the required skills!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Skill Gap Visual */}
      <Card className="rounded-2xl shadow-sm border">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className={`${iconContainer} bg-accent`}>
            <Target className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">Skill Gap Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Skills matched</span>
            <span className="font-medium text-foreground">{career.required_skills.length - career.missing_skills.length} / {career.required_skills.length}</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] transition-all duration-500"
              style={{ width: `${career.required_skills.length > 0 ? ((career.required_skills.length - career.missing_skills.length) / career.required_skills.length) * 100 : 0}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{career.required_skills.length - career.missing_skills.length}</p>
              <p className="text-xs text-muted-foreground">Matched</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
              <p className="text-2xl font-bold text-destructive">{career.missing_skills.length}</p>
              <p className="text-xs text-muted-foreground">Missing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default CareerDetails;
