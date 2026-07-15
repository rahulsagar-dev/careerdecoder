import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceUsage } from "../_shared/enforceUsage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function splitSections(text: string) {
  const norm = text.replace(/\r/g, "");
  const headings = ["Contact", "About", "Summary", "Top Skills", "Skills", "Experience", "Education", "Certifications", "Projects", "Languages", "Honors", "Awards", "Volunteer", "Publications"];
  const out: Record<string, string> = {};
  const pattern = new RegExp(`\\n\\s*(${headings.join("|")})\\s*\\n`, "gi");
  const parts = norm.split(pattern);
  // parts[0] = headline area, then alternating heading, content
  out.headline = (parts[0] || "").slice(0, 500).trim();
  for (let i = 1; i < parts.length; i += 2) {
    const key = (parts[i] || "").toLowerCase().trim();
    const val = (parts[i + 1] || "").trim();
    if (key && val) out[key] = val;
  }
  return {
    headline: out.headline || "",
    about: out.about || out.summary || "",
    experience: out.experience || "",
    skills: out.skills || out["top skills"] || "",
    education: out.education || "",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    // Pre-check only — the generate step is what atomically increments.
    const gate = await enforceUsage(userId, "linkedin-analysis", { increment: false });
    if (!gate.ok) return new Response(JSON.stringify(gate.body), { status: gate.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: "File exceeds 10MB limit" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (file.type && file.type !== "application/pdf") {
      return new Response(JSON.stringify({ error: "Only PDF files are supported" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const header = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 8));
    if (!header.startsWith("%PDF")) {
      return new Response(JSON.stringify({ error: "File is not a valid PDF" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let text = "";
    try {
      const { extractText, getDocumentProxy } = await import("https://esm.sh/unpdf@0.12.1");
      const pdf = await getDocumentProxy(bytes);
      const { text: extracted } = await extractText(pdf, { mergePages: true });
      text = (Array.isArray(extracted) ? extracted.join("\n") : extracted).trim();
    } catch (e) {
      console.error("unpdf failed:", e);
      return new Response(JSON.stringify({ error: "Failed to parse PDF" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (text.length < 50) {
      return new Response(JSON.stringify({ error: "Could not extract enough text from the PDF. Make sure this is a LinkedIn 'Save to PDF' export." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sections = splitSections(text);

    return new Response(JSON.stringify({ text, sections }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
