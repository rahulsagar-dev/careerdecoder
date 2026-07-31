import { useCallback, useRef, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onFile: (file: File) => void;
  loading?: boolean;
  ctaLabel?: string;
}

const MAX_BYTES = 2 * 1024 * 1024;

const ResumeDropzone = ({ onFile, loading, ctaLabel = "Analyze my resume — free" }: Props) => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = useCallback((f: File) => {
    if (!/\.(pdf|docx)$/i.test(f.name)) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("That file is larger than 2 MB. Try exporting a lighter PDF.");
      return;
    }
    setError(null);
    setFile(f);
  }, []);

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) accept(f);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-muted/30",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) accept(f); }}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <p className="font-medium text-sm">{file.name}</p>
            <p className="text-xs text-muted-foreground">Click to choose a different file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-primary" />
            <p className="font-medium">Drop your resume here or click to upload</p>
            <p className="text-xs text-muted-foreground">PDF or DOCX · up to 2 MB · no account needed</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] hover:opacity-90 transition-opacity"
        disabled={!file || loading}
        onClick={() => file && onFile(file)}
      >
        {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing your resume…</>) : ctaLabel}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        We analyze the text and show your results instantly. Your file is not stored.
      </p>
    </div>
  );
};

export default ResumeDropzone;
