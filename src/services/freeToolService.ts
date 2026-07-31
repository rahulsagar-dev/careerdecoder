export interface FreeResumeResult {
  ats_score: number;
  formatting_score: number;
  keyword_score: number;
  impact_score: number;
  summary_line: string;
  experience_level: string;
  top_skills: string[];
  skills_found: number;
  free_fixes: string[];
  top_matches: { title: string; match: number }[];
  locked: {
    fixes: number;
    missing_keywords: number;
    career_matches: number;
    skills: number;
  };
}

const STORAGE_KEY = "cd_free_resume_result";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",").pop() || "");
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

export async function analyzeResumeFree(file: File): Promise<FreeResumeResult> {
  const base64 = await fileToBase64(file);

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/free-resume-score`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ file: base64, filename: file.name }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Analysis failed. Please try again.");
  }
  return data as FreeResumeResult;
}

export function cacheFreeResult(result: FreeResumeResult) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch { /* storage unavailable — result stays in memory only */ }
}

export function readCachedFreeResult(): FreeResumeResult | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FreeResumeResult) : null;
  } catch {
    return null;
  }
}
