import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { careerService, CareerRecommendation } from "@/services/careerService";
import { toast } from "sonner";
import { Loader2, Compass, Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const iconContainer = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0";

const CareerRecommendations = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadRecommendations = async () => {
    try {
      const data = await careerService.getRecommendations();
      setRecommendations(data);
      if (data.length === 0) {
        await generate();
      }
    } catch {
      // no data
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const data = await careerService.generateRecommendations();
      setRecommendations(data);
      toast.success("Career recommendations generated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate recommendations");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Career Recommendations</h1>
          <p className="text-muted-foreground mt-1">AI-powered career paths based on your profile.</p>
        </div>
        <Button onClick={generate} disabled={generating} variant="outline" className="gap-2 rounded-xl">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Regenerate
        </Button>
      </div>

      {generating && (
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium text-foreground">Analyzing your profile...</p>
            <p className="text-sm text-muted-foreground mt-1">This may take a moment.</p>
          </CardContent>
        </Card>
      )}

      {!generating && recommendations.length === 0 && (
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Compass className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No recommendations yet. Complete your profile to get started.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border group cursor-pointer" onClick={() => navigate(`/career-details/${rec.id}`)}>
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <div className="flex items-center gap-3">
                <div className={`${iconContainer} bg-primary/10`}>
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">{rec.career_title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{rec.salary_range}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeDasharray={`${(rec.match_score / 100) * 125.6} 125.6`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">{rec.match_score}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">{rec.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {rec.required_skills.slice(0, 5).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-[11px] rounded-md">{skill}</Badge>
                ))}
                {rec.required_skills.length > 5 && (
                  <Badge variant="secondary" className="text-[11px] rounded-md">+{rec.required_skills.length - 5}</Badge>
                )}
              </div>
              <div className="flex items-center justify-end text-xs text-primary font-medium group-hover:underline">
                View Details <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default CareerRecommendations;
