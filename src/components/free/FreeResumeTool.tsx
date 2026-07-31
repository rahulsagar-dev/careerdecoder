import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, RefreshCw, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ResumeDropzone from "@/components/free/ResumeDropzone";
import LockedTeaser from "@/components/free/LockedTeaser";
import { analyzeResumeFree, cacheFreeResult, type FreeResumeResult } from "@/services/freeToolService";

type Variant = "ats" | "insights";

const scoreColor = (score: number) =>
  score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-destructive";

const ScoreRing = ({ score }: { score: number }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="relative h-32 w-32 rounded-full bg-muted flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(hsl(var(--primary)) ${score * 3.6}deg, hsl(var(--muted)) 0deg)`,
        }}
      />
      <div className="relative h-24 w-24 rounded-full bg-background flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold ${scoreColor(score)}`}>{score}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">out of 100</span>
      </div>
    </div>
  </div>
);

const FreeResumeTool = ({ variant }: { variant: Variant }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FreeResumeResult | null>(null);

  const run = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeResumeFree(file);
      setResult(data);
      cacheFreeResult(data);
    } catch (e: any) {
      setError(e?.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <ResumeDropzone
          onFile={run}
          loading={loading}
          ctaLabel={variant === "ats" ? "Get my ATS score — free" : "Get my resume insights — free"}
        />
        {error && (
          <Card className="border-destructive/40">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Headline result */}
      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-6 md:p-8 grid md:grid-cols-[auto,1fr] gap-6 items-center">
          <ScoreRing score={result.ats_score} />
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Your ATS score</h2>
              <p className="text-sm text-muted-foreground">{result.summary_line}</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Formatting & parseability", value: result.formatting_score },
                { label: "Keyword coverage", value: result.keyword_score },
                { label: "Impact & metrics", value: result.impact_score },
              ].map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-semibold">{s.value}</span>
                  </div>
                  <Progress value={s.value} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Free insight block */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Top skills detected</h3>
            <div className="flex flex-wrap gap-2">
              {result.top_skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
            <p className="text-xs text-muted-foreground">
              Experience level: <span className="font-medium text-foreground">{result.experience_level || "—"}</span>
              {result.locked.skills > 0 && <> · {result.locked.skills} more skills found</>}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Best-fit roles</h3>
            <ul className="space-y-2">
              {result.top_matches.map((m) => (
                <li key={m.title} className="flex items-center justify-between text-sm">
                  <span>{m.title}</span>
                  <span className="font-semibold text-primary">{m.match}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-3">
          <h3 className="font-semibold">2 fixes you can make today</h3>
          <ul className="space-y-3">
            {result.free_fixes.map((f, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Locked */}
      <LockedTeaser
        title={variant === "ats" ? "The rest of your resume report" : "Your full career report"}
        items={
          variant === "ats"
            ? [
                `${result.locked.fixes} more high-impact fixes, ranked by what recruiters notice first`,
                `${result.locked.missing_keywords} missing keywords holding your resume back in ATS filters`,
                "Section-by-section rewrite suggestions for your summary, experience and projects",
                "Save this report and re-score after every edit",
              ]
            : [
                `${result.locked.career_matches} more matching roles with ₹ salary ranges for India`,
                "Your full skill-gap breakdown against each target role",
                "A step-by-step learning roadmap built from your gaps",
                "AI mock interviews tuned to the roles you're targeting",
              ]
        }
        footnote={
          variant === "ats"
            ? "Unlock the full fix list and keyword gaps"
            : "Unlock all matches, salary ranges and your roadmap"
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="outline" onClick={() => { setResult(null); setError(null); }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Check another resume
        </Button>
        <Button variant="ghost" asChild>
          <Link to={variant === "ats" ? "/free/resume-insights" : "/free/ats-score"}>
            {variant === "ats" ? "See what your resume says about you →" : "See your ATS score breakdown →"}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default FreeResumeTool;
