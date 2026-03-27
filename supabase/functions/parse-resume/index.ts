import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Try to extract text - for PDF, extract readable text
    try {
      const textDecoder = new TextDecoder("utf-8", { fatal: false });
      const rawText = textDecoder.decode(bytes);

      // Check if it's a PDF by looking for the PDF header
      if (rawText.startsWith("%PDF")) {
        // Extract text between BT/ET blocks and parentheses for basic PDF text
        const textParts: string[] = [];
        // Extract strings from PDF content streams
        const regex = /\(([^)]*)\)/g;
        let match;
        while ((match = regex.exec(rawText)) !== null) {
          const text = match[1].replace(/\\n/g, "\n").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
          if (text.trim().length > 1) textParts.push(text.trim());
        }
        // Also try to get text from streams
        const streamRegex = /stream\s*([\s\S]*?)endstream/g;
        while ((match = streamRegex.exec(rawText)) !== null) {
          const content = match[1];
          const tjRegex = /\[([^\]]*)\]\s*TJ|(\([^)]*\))\s*Tj/g;
          let tjMatch;
          while ((tjMatch = tjRegex.exec(content)) !== null) {
            const text = (tjMatch[1] || tjMatch[2] || "").replace(/\(([^)]*)\)/g, "$1").replace(/\\[0-9]{3}/g, " ");
            if (text.trim()) textParts.push(text.trim());
          }
        }
        resumeText = textParts.join(" ").replace(/\s+/g, " ").trim();
      } else {
        // For DOCX or other text formats, use the raw text
        // DOCX is a zip file, extract text from XML
        resumeText = rawText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
    } catch {
      resumeText = "Unable to extract text from file";
    }

    // If text extraction yielded very little, still proceed but note it
    const hasGoodText = resumeText.length > 50;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a professional resume parser. Extract structured data from the resume text provided. Be accurate and extract only real information present in the resume. Normalize skill names (use "React" not "reactjs", "JavaScript" not "javascript", "Node.js" not "nodejs"). Remove duplicates. If certain information is not found, return empty arrays.`;

    const userPrompt = hasGoodText
      ? `Parse this resume and extract structured data:\n\n${resumeText.slice(0, 8000)}`
      : `The resume text could not be fully extracted (it may be a scanned PDF). Based on what is available, extract what you can. The user has these existing skills: ${JSON.stringify(profile.skills || [])}. Resume text fragment:\n\n${resumeText.slice(0, 4000)}`;

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
