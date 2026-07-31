import { Link } from "react-router-dom";
import { FileText, ArrowRight } from "lucide-react";

/** Inline entry point into the free, no-signup resume tools. */
const FreeToolCta = ({ className = "" }: { className?: string }) => (
  <Link
    to="/free/ats-score"
    className={`not-prose flex items-center gap-4 rounded-xl border bg-muted/40 p-4 hover:border-primary/50 hover:shadow-sm transition-all ${className}`}
  >
    <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
      <FileText className="h-5 w-5 text-primary" />
    </div>
    <div className="flex-1">
      <p className="font-semibold text-sm">Check your ATS score free — no signup</p>
      <p className="text-xs text-muted-foreground">Upload your resume, get your score and 2 fixes in ~20 seconds.</p>
    </div>
    <ArrowRight className="h-4 w-4 text-primary shrink-0" />
  </Link>
);

export default FreeToolCta;
