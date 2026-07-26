import { CheckCircle2, AlertTriangle, FileText, Target } from "lucide-react";

const gaps = [
  { name: "SQL (advanced)", have: true },
  { name: "Data visualization", have: true },
  { name: "dbt", have: false },
  { name: "A/B testing", have: false },
];

/**
 * Static, non-interactive product preview shown in the hero.
 * Purely presentational — communicates what the product outputs.
 */
const HeroPreview = () => (
  <div className="relative w-full max-w-md">
    <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/20 to-[hsl(260,84%,60%)]/20 blur-2xl" />

    <div className="relative rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/50" />
        <span className="ml-2 text-[11px] text-muted-foreground">Resume Analysis</span>
      </div>

      <div className="p-5 space-y-5">
        {/* ATS score */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(260,84%,60%)]">
            <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-card">
              <span className="text-lg font-bold text-foreground">82</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <FileText size={14} className="text-primary" /> ATS Score
            </p>
            <p className="text-xs text-muted-foreground">Strong match for Data Analyst roles</p>
          </div>
        </div>

        {/* skill gaps */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Target size={13} /> Skill gap analysis
          </p>
          {gaps.map((g) => (
            <div key={g.name} className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              {g.have ? (
                <CheckCircle2 size={15} className="text-primary shrink-0" />
              ) : (
                <AlertTriangle size={15} className="text-muted-foreground shrink-0" />
              )}
              <span className="text-sm text-foreground">{g.name}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">{g.have ? "Matched" : "Missing"}</span>
            </div>
          ))}
        </div>

        {/* roadmap teaser */}
        <div className="rounded-xl bg-gradient-to-r from-primary/10 to-[hsl(260,84%,60%)]/10 px-3 py-2.5">
          <p className="text-xs font-medium text-foreground">Next step in your roadmap</p>
          <p className="text-xs text-muted-foreground">Learn dbt fundamentals · ~2 weeks</p>
        </div>
      </div>
    </div>

    <p className="mt-3 text-center text-[11px] text-muted-foreground">Example output — your report is generated from your own resume.</p>
  </div>
);

export default HeroPreview;
