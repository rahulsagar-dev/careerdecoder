import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { handleFeatureError } from "@/services/featureGate";
import { linkedinService, LinkedInAnalysis } from "@/services/linkedinService";
import {
  Loader2, Upload, Linkedin, CheckCircle2, AlertTriangle, Lightbulb,
  Sparkles, ShieldCheck, Trash2, FileText, Target,
} from "lucide-react";

const MAX_SIZE = 10 * 1024 * 1024;

function scoreColor(s: number) {
  if (s >= 80) return "text-green-600 dark:text-green-400";
  if (s >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-destructive";
}
function scoreStroke(s: number) {
  if (s >= 80) return "hsl(150, 60%, 50%)";
  if (s >= 60) return "hsl(40, 80%, 55%)";
  return "hsl(var(--destructive))";
}
function priorityColor(p: string) {
  if (p === "high") return "bg-destructive/10 text-destructive border-destructive/20";
  if (p === "medium") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200";
  return "bg-muted text-muted-foreground";
}

const iconBox = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0";

const LinkedInAnalysisPage = () => {
  const [analysis, setAnalysis] = useState<LinkedInAnalysis | null>(null);
  const [past, setPast] = useState<LinkedInAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"" | "parsing" | "analyzing">("");

  useEffect(() => {
    (async () => {
      const list = await linkedinService.listAnalyses();
      setPast(list);
      setAnalysis(list[0] || null);
      setLoading(false);
    })();
  }, []);

  const onDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("Only PDF files are supported");
    if (file.size > MAX_SIZE) return toast.error("File exceeds 10MB");
    try {
      setPhase("parsing");
      const parsed = await linkedinService.uploadAndParse(file);
      setPhase("analyzing");
      const result = await linkedinService.generateAnalysis(parsed);
      setAnalysis(result);
      setPast((p) => [result, ...p]);
      toast.success("LinkedIn analysis complete!");
    } catch (err) {
      handleFeatureError(err, "Failed to analyze LinkedIn profile");
    } finally {
      setPhase("");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: !!phase,
  });

  const handleDelete = async (id: string) => {
    try {
      await linkedinService.deleteAnalysis(id);
      setPast((p) => p.filter((a) => a.id !== id));
      if (analysis?.id === id) setAnalysis(null);
      toast.success("Analysis deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
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

  const busy = !!phase;

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Linkedin className="h-8 w-8 text-[#0A66C2]" /> LinkedIn Analysis
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload your LinkedIn profile PDF export for an AI-powered review tailored to your target career.
        </p>
      </div>

      {/* Instructions */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> How to export your LinkedIn PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="steps">
            <AccordionItem value="steps" className="border-none">
              <AccordionTrigger className="text-sm py-2">Show step-by-step instructions</AccordionTrigger>
              <AccordionContent>
                <ol className="text-sm text-muted-foreground list-decimal ml-5 space-y-1.5">
                  <li>Go to your LinkedIn profile page (linkedin.com/in/your-handle).</li>
                  <li>Click the <span className="font-medium text-foreground">More</span> button below your profile header.</li>
                  <li>Select <span className="font-medium text-foreground">Save to PDF</span>.</li>
                  <li>LinkedIn will download a PDF of your profile — upload that file below.</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Upload */}
      {!busy && (
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="py-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-foreground">
                {isDragActive ? "Drop your PDF here" : "Drop your LinkedIn PDF here, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF only, up to 10MB</p>
            </div>
            <Alert className="mt-4 border-primary/20 bg-primary/5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs">
                Your LinkedIn PDF is processed to generate this analysis and is not shared with third parties. The file is not stored — only the analysis is saved.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {busy && (
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">
              {phase === "parsing" ? "Parsing your LinkedIn PDF..." : "Analyzing your profile..."}
            </p>
            <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!busy && analysis && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-primary/10`}><Target className="h-5 w-5 text-primary" /></div>
                <CardTitle className="text-lg font-semibold">Overall Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-4">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle cx="56" cy="56" r="48" fill="none" stroke={scoreStroke(analysis.overall_score)} strokeWidth="8"
                      strokeDasharray={`${(analysis.overall_score / 100) * 301.6} 301.6`} strokeLinecap="round" />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${scoreColor(analysis.overall_score)}`}>
                    {analysis.overall_score}
                  </span>
                </div>
                {analysis.target_career && (
                  <p className="text-xs text-muted-foreground mt-3">Target: {analysis.target_career}</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border md:col-span-2">
              <CardHeader className="pb-4"><CardTitle className="text-lg font-semibold">Section Scores</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Headline", value: analysis.headline_score },
                  { label: "About", value: analysis.about_score },
                  { label: "Experience", value: analysis.experience_score },
                  { label: "Skills", value: analysis.skills_score },
                ].map((s) => (
                  <div key={s.label} className="text-center p-4 rounded-xl bg-muted/40">
                    <p className={`text-2xl font-bold ${scoreColor(s.value)}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-green-100 dark:bg-green-900/20`}><CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
                <CardTitle className="text-lg font-semibold">Strengths</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(analysis.strengths || []).map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-green-50/50 dark:bg-green-900/10">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    <p className="text-sm">{s}</p>
                  </div>
                ))}
                {(analysis.strengths || []).length === 0 && <p className="text-sm text-muted-foreground">None identified.</p>}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-destructive/10`}><AlertTriangle className="h-5 w-5 text-destructive" /></div>
                <CardTitle className="text-lg font-semibold">Weaknesses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(analysis.weaknesses || []).map((w, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm">{w}</p>
                  </div>
                ))}
                {(analysis.weaknesses || []).length === 0 && <p className="text-sm text-muted-foreground">None identified.</p>}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-sm border">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <div className={`${iconBox} bg-accent`}><Lightbulb className="h-5 w-5 text-primary" /></div>
              <CardTitle className="text-lg font-semibold">Improvement Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(analysis.suggestions || []).map((s, i) => (
                <div key={i} className="p-4 rounded-xl border bg-card space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{s.title}</p>
                    <Badge variant="outline" className={`text-[10px] uppercase ${priorityColor(s.priority)}`}>{s.priority}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              ))}
              {(analysis.suggestions || []).length === 0 && <p className="text-sm text-muted-foreground">No suggestions.</p>}
            </CardContent>
          </Card>

          {(analysis.keyword_gaps || []).length > 0 && (
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={`${iconBox} bg-primary/10`}><Sparkles className="h-5 w-5 text-primary" /></div>
                <CardTitle className="text-lg font-semibold">Keyword Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Keywords typical for your target career that are missing from your profile:</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.keyword_gaps.map((k) => (
                    <Badge key={k} variant="outline" className="rounded-lg border-yellow-300 text-yellow-800 dark:text-yellow-400">{k}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {past.length > 1 && (
        <Card className="rounded-2xl shadow-sm border">
          <CardHeader className="pb-3"><CardTitle className="text-base">Past Analyses</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {past.map((a) => (
              <div key={a.id} className={`flex items-center justify-between p-3 rounded-xl border ${analysis?.id === a.id ? "bg-primary/5 border-primary/30" : "bg-card"}`}>
                <button className="flex-1 text-left" onClick={() => setAnalysis(a)}>
                  <p className="text-sm font-medium">Score {a.overall_score}/100 — {a.target_career || "General"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                </button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default LinkedInAnalysisPage;
