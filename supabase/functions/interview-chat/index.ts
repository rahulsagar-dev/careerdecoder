import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { session_id, user_message, mode, role } = await req.json();
    if (!session_id || !user_message || !mode || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof user_message !== "string" || user_message.length > 4000) {
      return new Response(JSON.stringify({ error: "user_message must be a string up to 4000 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof role !== "string" || role.length > 100) {
      return new Response(JSON.stringify({ error: "role must be a string up to 100 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof mode !== "string" || mode.length > 50) {
      return new Response(JSON.stringify({ error: "mode must be a string up to 50 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get session with state
    const { data: session } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .single();

    if (!session) throw new Error("Session not found");

    const currentIndex = session.current_question_index || 0;
    const difficultyLevel = session.difficulty_level || "easy";
    const topicsCovered = session.topics_covered || [];
    const weakTopics = session.weak_topics || [];
    const followUpCount = session.follow_up_count || 0;

    // Store user message
    await supabase.from("interview_messages").insert({
      session_id,
      sender: "user",
      message: user_message,
    });

    // Get conversation history
    const { data: messages } = await supabase
      .from("interview_messages")
      .select("sender, message")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true });

    const history = (messages || []).map((m: any) => ({
      role: m.sender === "ai" ? "assistant" : "user",
      content: m.message,
    }));

    // Determine interview phase
    const questionCount = currentIndex;
    let phase = "warmup";
    if (questionCount >= 1 && questionCount <= 3) phase = "core";
    else if (questionCount >= 4 && questionCount <= 6) phase = "deep_dive";
    else if (questionCount >= 7) phase = "scenario";

    // Difficulty progression guidance
    let difficultyInstruction = "";
    if (difficultyLevel === "easy") {
      difficultyInstruction = "Ask straightforward, foundational questions. If the candidate answers well, prepare to increase difficulty.";
    } else if (difficultyLevel === "medium") {
      difficultyInstruction = "Ask intermediate-level questions requiring applied knowledge. Include follow-ups that probe deeper.";
    } else {
      difficultyInstruction = "Ask advanced, scenario-based questions. Present real-world problems requiring system-level thinking.";
    }

    const modeInstructions: Record<string, string> = {
      HR: `You are an experienced HR interviewer for a ${role} position. Focus on personality, motivation, culture fit, teamwork, and conflict resolution. Use behavioral questions. Probe for specific examples using the STAR method when answers are vague.`,
      Technical: `You are a senior technical interviewer for a ${role} position. Ask deep technical questions covering fundamentals, applied knowledge, system design, and problem-solving. Verify understanding by asking "why" and "how" follow-ups.`,
      Behavioral: `You are a behavioral interview expert for a ${role} position. Use the STAR method (Situation, Task, Action, Result). Ask scenario-based questions about leadership, decision-making, failure handling, and team dynamics. Probe for specifics.`,
    };

    const systemPrompt = `${modeInstructions[mode] || modeInstructions.Technical}

INTERVIEW STATE:
- Question #${questionCount + 1}
- Current difficulty: ${difficultyLevel}
- Phase: ${phase}
- Topics already covered: ${topicsCovered.length > 0 ? topicsCovered.join(", ") : "none yet"}
- Weak areas detected: ${weakTopics.length > 0 ? weakTopics.join(", ") : "none yet"}
- Follow-ups asked so far: ${followUpCount}

DIFFICULTY: ${difficultyInstruction}

CRITICAL BEHAVIOR RULES:
1. ADAPT to the candidate's previous answer:
   - If their answer was VAGUE or INCOMPLETE → Ask a clarifying follow-up like "Can you elaborate on that?" or "What specifically did you do?"
   - If their answer was PARTIAL → Ask a deeper probing question like "What would happen at scale?" or "How would you handle edge cases?"
   - If their answer was STRONG → Acknowledge briefly and move to a NEW, harder topic
2. NEVER repeat a topic already covered: ${topicsCovered.join(", ")}
3. Ask ONE question at a time
4. Keep responses concise — brief acknowledgment (1-2 sentences max) then your question
5. During "${phase}" phase, adjust your approach accordingly:
   - warmup: Easy, general questions to build rapport
   - core: Main technical/behavioral questions at current difficulty
   - deep_dive: Follow-up sequences that test depth of understanding
   - scenario: Real-world problem-solving scenarios

IMPORTANT: After your response, you MUST end with a JSON block on a new line in this exact format:
|||META|||{"difficulty":"easy|medium|hard","topic":"the_topic_of_this_question","is_follow_up":true|false,"answer_quality":"weak|partial|strong"}|||END|||`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
          ...history,
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI request failed");
    }

    const aiData = await aiResponse.json();
    const rawMessage = aiData.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    // Parse metadata from AI response
    let aiMessage = rawMessage;
    let meta = { difficulty: difficultyLevel, topic: "", is_follow_up: false, answer_quality: "partial" };

    const metaMatch = rawMessage.match(/\|\|\|META\|\|\|(.*?)\|\|\|END\|\|\|/s);
    if (metaMatch) {
      aiMessage = rawMessage.replace(/\n?\|\|\|META\|\|\|.*?\|\|\|END\|\|\|/s, "").trim();
      try {
        meta = JSON.parse(metaMatch[1]);
      } catch { /* keep defaults */ }
    }

    // Update session state
    const newTopics = meta.topic && !topicsCovered.includes(meta.topic)
      ? [...topicsCovered, meta.topic]
      : topicsCovered;

    const newWeakTopics = meta.answer_quality === "weak" && meta.topic && !weakTopics.includes(meta.topic)
      ? [...weakTopics, meta.topic]
      : weakTopics;

    // Adapt difficulty based on answer quality
    let newDifficulty = difficultyLevel;
    if (meta.answer_quality === "strong" && questionCount >= 2) {
      if (difficultyLevel === "easy") newDifficulty = "medium";
      else if (difficultyLevel === "medium") newDifficulty = "hard";
    } else if (meta.answer_quality === "weak" && difficultyLevel !== "easy") {
      if (difficultyLevel === "hard") newDifficulty = "medium";
      else if (difficultyLevel === "medium") newDifficulty = "easy";
    }

    await supabase
      .from("interview_sessions")
      .update({
        current_question_index: currentIndex + 1,
        difficulty_level: newDifficulty,
        topics_covered: newTopics,
        weak_topics: newWeakTopics,
        follow_up_count: meta.is_follow_up ? followUpCount + 1 : followUpCount,
      })
      .eq("id", session_id)
      .eq("user_id", user.id);

    // Store AI message (clean, without meta)
    await supabase.from("interview_messages").insert({
      session_id,
      sender: "ai",
      message: aiMessage,
    });

    return new Response(JSON.stringify({
      message: aiMessage,
      difficulty_level: newDifficulty,
      topic: meta.topic,
      is_follow_up: meta.is_follow_up,
      question_number: currentIndex + 1,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interview-chat error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
