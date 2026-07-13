import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceUsage } from "../_shared/enforceUsage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const gate = await enforceUsage(userId, "resume-analysis", { increment: true });
    if (!gate.ok) return new Response(JSON.stringify(gate.body), { status: gate.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Get profile to find resume URL
    const { data: profile } = await supabase.from("profiles").select("resume_url, skills").eq("id", userId).single();
    if (!profile?.resume_url) {
      return new Response(JSON.stringify({ error: "No resume uploaded. Please upload a resume first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download resume from storage
    const resumePath = profile.resume_url.includes("/resumes/")
      ? profile.resume_url.split("/resumes/").pop()!
      : profile.resume_url;

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(resumePath);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return new Response(JSON.stringify({ error: "Failed to download resume file." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract text from file
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let resumeText = "";

    try {
      const headerDecoder = new TextDecoder("utf-8", { fatal: false });
      const headerSample = headerDecoder.decode(bytes.slice(0, 8));

      if (headerSample.startsWith("%PDF")) {
        // Use unpdf for proper PDF text extraction (handles compressed streams)
        try {
          const { extractText, getDocumentProxy } = await import("https://esm.sh/unpdf@0.12.1");
          const pdf = await getDocumentProxy(bytes);
          const { text } = await extractText(pdf, { mergePages: true });
          resumeText = (Array.isArray(text) ? text.join("\n") : text).replace(/\s+/g, " ").trim();
        } catch (pdfErr) {
          console.error("unpdf failed, falling back:", pdfErr);
          // Fallback to naive regex extraction
          const rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
          const textParts: string[] = [];
          const regex = /\(([^)]*)\)/g;
          let match;
          while ((match = regex.exec(rawText)) !== null) {
            const t = match[1].replace(/\\n/g, "\n").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
            if (t.trim().length > 1) textParts.push(t.trim());
          }
          resumeText = textParts.join(" ").replace(/\s+/g, " ").trim();
        }
      } else if (headerSample.startsWith("PK")) {
        // DOCX (zip) — extract document.xml text
        try {
          const { unzipSync, strFromU8 } = await import("https://esm.sh/fflate@0.8.2");
          const files = unzipSync(bytes);
          const docXml = files["word/document.xml"];
          if (docXml) {
            const xml = strFromU8(docXml);
            resumeText = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          }
        } catch (docxErr) {
          console.error("DOCX extraction failed:", docxErr);
        }
      } else {
        resumeText = new TextDecoder("utf-8", { fatal: false }).decode(bytes).replace(/\s+/g, " ").trim();
      }
    } catch (e) {
      console.error("Text extraction error:", e);
      resumeText = "";
    }

    console.log("Extracted resume text length:", resumeText.length);
    console.log("Preview:", resumeText.slice(0, 300));

    // If text extraction yielded very little, still proceed but note it
    const hasGoodText = resumeText.length > 50;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a professional resume parser. Extract structured data ONLY from the resume text provided.

CRITICAL RULES:
- Extract ONLY skills, technologies, and information explicitly mentioned in the resume text below.
- DO NOT invent, assume, hallucinate, or add common skills (e.g. don't add "React" or "Node.js" unless the resume literally mentions them).
- If the resume mentions "Excel, SQL, Python, Tableau", return EXACTLY those — not React, Node.js, AWS, Docker, etc.
- Normalize casing only (e.g. "javascript" → "JavaScript", "power bi" → "Power BI"). Do not translate or substitute skills.
- Split combined entries: "Python (Pandas, NumPy)" → ["Python", "Pandas", "NumPy"]. "Microsoft Excel, SQL" → ["Microsoft Excel", "SQL"].
- Include both Technical and Soft skills if present.
- If a section (experience/projects) is not present, return an empty array.`;

    const userPrompt = hasGoodText
      ? `Parse this resume text. Return ONLY what is actually written here:\n\n---RESUME TEXT START---\n${resumeText.slice(0, 12000)}\n---RESUME TEXT END---`
      : `The resume text extraction yielded very little content. Return empty arrays rather than guessing. Available text:\n\n${resumeText.slice(0, 4000)}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_resume",
              description: "Return structured resume data",
              parameters: {
                type: "object",
                properties: {
                  extracted_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "All technical and soft skills found",
                  },
                  tech_stack: {
                    type: "array",
                    items: { type: "string" },
                    description: "Technologies, frameworks, and tools",
                  },
                  experience: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string" },
                        company: { type: "string" },
                        duration: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["role", "company", "duration", "description"],
                    },
                  },
                  projects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        technologies: { type: "array", items: { type: "string" } },
                      },
                      required: ["title", "description", "technologies"],
                    },
                  },
                },
                required: ["extracted_skills", "tech_stack", "experience", "projects"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_resume" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI failed to produce structured output" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      parsed: {
        extracted_skills: parsed.extracted_skills || [],
        tech_stack: parsed.tech_stack || [],
        experience: parsed.experience || [],
        projects: parsed.projects || [],
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
