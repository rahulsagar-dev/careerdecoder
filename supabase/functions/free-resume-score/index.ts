// Public, no-signup resume analysis. Returns a deliberately trimmed payload:
// the deeper insights stay server-side so the signup gate can't be bypassed.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractResumeText } from "../_shared/resumeText.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const DAILY_LIMIT = 2;
const TOOL = "free-resume";

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

/** In-instance cooldown so an identical resume re-submitted immediately doesn't re-bill. */
const resultCache = new Map<string, { at: number; payload: unknown }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.file !== "string" || typeof body.filename !== "string") {
      return json({ error: "A resume file is required." }, 400);
    }

    const filename: string = body.filename.slice(0, 200);
    if (!/\.(pdf|docx)$/i.test(filename)) {
      return json({ error: "Only PDF or DOCX resumes are supported." }, 400);
    }

    // Decode base64 payload
    let bytes: Uint8Array;
    try {
      const base64 = body.file.includes(",") ? body.file.split(",").pop()! : body.file;
      const binary = atob(base64);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    } catch {
      return json({ error: "Could not read the uploaded file." }, 400);
    }
    if (bytes.length === 0) return json({ error: "The uploaded file is empty." }, 400);
    if (bytes.length > MAX_BYTES) return json({ error: "File is too large. Max size is 2 MB." }, 400);

    // ── IP-based daily limit (service role only, fail-closed) ──
    const ipHash = await sha256(`${clientIp(req)}::${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`);
    const day = new Date().toISOString().slice(0, 10);
    const db = admin();

    const { data: usageRow } = await db
      .from("anon_tool_usage")
      .select("id, count")
      .eq("ip_hash", ipHash)
      .eq("tool", TOOL)
      .eq("day", day)
      .maybeSingle();

    if ((usageRow?.count ?? 0) >= DAILY_LIMIT) {
      return json({
        error: "limit_reached",
        message:
          "You've used your 2 free checks for today. Create a free account to keep analyzing your resume.",
      }, 429);
    }

    // ── Extract text ──
    const resumeText = await extractResumeText(bytes);
    if (resumeText.length < 120) {
      return json({
        error: "unreadable",
        message:
          "We couldn't read enough text from this file. If it's a scanned image, export a text-based PDF and try again.",
      }, 422);
    }

    const trimmed = resumeText.slice(0, 12000);
    const inputHash = await sha256(trimmed);
    const cached = resultCache.get(inputHash);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return json(cached.payload);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI service not configured" }, 500);

    const systemPrompt = `You are a strict ATS (applicant tracking system) auditor and career analyst for the Indian job market.
Analyse ONLY the resume text given. Never invent skills, employers, or achievements that are not written in the text.
Be honest and specific: a weak resume must receive a low score. Scores are 0-100 integers.
Career matches must be realistic job titles with an integer match percentage.
Write in plain, direct English.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Audit this resume.\n\n---RESUME TEXT START---\n${trimmed}\n---RESUME TEXT END---`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "audit_resume",
            description: "Return the ATS audit and career insight for this resume",
            parameters: {
              type: "object",
              properties: {
                ats_score: { type: "integer", description: "Overall ATS score 0-100" },
                formatting_score: { type: "integer", description: "Parseability/structure score 0-100" },
                keyword_score: { type: "integer", description: "Keyword coverage score 0-100" },
                impact_score: { type: "integer", description: "Quantified impact / metrics score 0-100" },
                summary_line: { type: "string", description: "One sentence on what this resume says about the candidate" },
                experience_level: { type: "string", description: "e.g. Fresher, 0-2 years, 3-5 years, Senior" },
                detected_skills: { type: "array", items: { type: "string" }, description: "Skills literally present in the resume, strongest first" },
                fixes: { type: "array", items: { type: "string" }, description: "Concrete, specific fixes ordered by impact (at least 6)" },
                missing_keywords: { type: "array", items: { type: "string" }, description: "Important keywords missing for the candidate's target roles" },
                career_matches: {
                  type: "array",
                  description: "Best-fitting roles, strongest first (at least 5)",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      match: { type: "integer" },
                      reason: { type: "string" },
                    },
                    required: ["title", "match", "reason"],
                  },
                },
              },
              required: [
                "ats_score", "formatting_score", "keyword_score", "impact_score",
                "summary_line", "experience_level", "detected_skills", "fixes",
                "missing_keywords", "career_matches",
              ],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "audit_resume" } },
      }),
    });

    if (aiResponse.status === 429) {
      return json({ error: "busy", message: "We're at capacity right now. Please try again in a minute." }, 429);
    }
    if (aiResponse.status === 402) {
      return json({ error: "busy", message: "Free checks are temporarily unavailable. Please try again later." }, 429);
    }
    if (!aiResponse.ok) {
      console.error("AI error:", aiResponse.status, await aiResponse.text());
      return json({ error: "Analysis failed. Please try again." }, 500);
    }

    const aiData = await aiResponse.json();
    const call = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) return json({ error: "Analysis failed. Please try again." }, 500);

    let parsed: any;
    try {
      parsed = JSON.parse(call.function.arguments);
    } catch {
      return json({ error: "Analysis failed. Please try again." }, 500);
    }

    const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    const skills: string[] = Array.isArray(parsed.detected_skills) ? parsed.detected_skills.map(String) : [];
    const fixes: string[] = Array.isArray(parsed.fixes) ? parsed.fixes.map(String) : [];
    const missing: string[] = Array.isArray(parsed.missing_keywords) ? parsed.missing_keywords.map(String) : [];
    const matches = Array.isArray(parsed.career_matches) ? parsed.career_matches : [];

    // Public payload — locked content is counted, never returned.
    const payload = {
      ats_score: clamp(parsed.ats_score),
      formatting_score: clamp(parsed.formatting_score),
      keyword_score: clamp(parsed.keyword_score),
      impact_score: clamp(parsed.impact_score),
      summary_line: String(parsed.summary_line || "").slice(0, 300),
      experience_level: String(parsed.experience_level || "").slice(0, 60),
      top_skills: skills.slice(0, 3),
      skills_found: skills.length,
      free_fixes: fixes.slice(0, 2),
      top_matches: matches.slice(0, 3).map((m: any) => ({
        title: String(m?.title || "").slice(0, 80),
        match: clamp(m?.match),
      })),
      locked: {
        fixes: Math.max(0, fixes.length - 2),
        missing_keywords: missing.length,
        career_matches: Math.max(0, matches.length - 3),
        skills: Math.max(0, skills.length - 3),
      },
    };

    resultCache.set(inputHash, { at: Date.now(), payload });

    // Record the run (best effort — never block the response on it)
    try {
      if (usageRow) {
        await db.from("anon_tool_usage")
          .update({ count: (usageRow.count ?? 0) + 1, updated_at: new Date().toISOString() })
          .eq("id", usageRow.id);
      } else {
        await db.from("anon_tool_usage").insert({ ip_hash: ipHash, tool: TOOL, day, count: 1 });
      }
    } catch (e) {
      console.error("usage log failed:", e);
    }

    return json(payload);
  } catch (e) {
    console.error("free-resume-score error:", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
