import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, subject, imageBase64, mode = "solve" } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userContent: any[] = [];
    const subjectContext = subject ? `The subject is ${subject}. ` : "";

    if (mode === "explain") {
      userContent.push({
        type: "text",
        text: `${subjectContext}Explain this topic in detail with clear examples, analogies, and real-world applications. Make it engaging and easy to understand for a student. Give a very thorough, comprehensive explanation.\n\nTopic: ${question}`,
      });
    } else if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: imageBase64 },
      });
      userContent.push({
        type: "text",
        text: `${subjectContext}Look at this image of a problem. Solve it step by step with clear explanations. Write all math in plain English words, never use dollar signs or LaTeX. ${question ? `Additional context: ${question}` : ""}`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `${subjectContext}Solve this problem step by step with clear explanations. Write all math in plain English words, never use dollar signs or LaTeX.\n\nProblem: ${question}`,
      });
    }

    const systemPrompt = mode === "explain"
      ? `You are SnapSolve AI, an expert tutor who can explain ANY topic across all subject areas including Math, Physics, Chemistry, Biology, History, Computer Science, Art, Music, Literature, Geography, Economics, Philosophy, and more.

Your response format for topic explanations:
1. **What is it?**: A clear, concise definition
2. **Key Concepts**: The main ideas and principles to understand
3. **How it Works**: Detailed explanation with step-by-step breakdown. Write math in plain words.
4. **Real-World Examples**: 2-3 practical examples or applications
5. **Analogies**: Simple analogies to make it relatable
6. **Fun Fact**: An interesting fact that makes the topic memorable
7. **Quick Summary**: A 2-3 sentence recap

CRITICAL RULE: Write ALL math expressions in plain English words. NEVER use dollar signs ($), LaTeX notation, backslashes, or special math symbols like ^, _, {, }. For example write "x squared plus 5x plus 6 equals zero" not "$x^2 + 5x + 6 = 0$". Write "the square root of 9 is 3" not "$\\sqrt{9} = 3$". Write "one half" not "1/2" when in sentences.

Be encouraging, clear, and educational. Use analogies and vivid examples. Make complex topics accessible. Give detailed, thorough explanations so students fully understand.`
      : `You are SnapSolve AI, an expert tutor in Math, Physics, Chemistry, and more.

Your response format:
1. **Understanding**: Briefly restate what the problem is asking
2. **Key Concepts**: List the relevant formulas/concepts needed, written in plain words
3. **Step-by-Step Solution**: Solve with detailed, clear steps. Write math in plain English words.
4. **Final Answer**: Clearly state the answer
5. **Intuition**: Explain WHY the answer makes sense in 1-2 sentences

CRITICAL RULE: Write ALL math expressions in plain English words. NEVER use dollar signs ($), LaTeX notation, backslashes, or special math symbols like ^, _, {, }. For example write "x squared plus 5x plus 6 equals zero" not "$x^2 + 5x + 6 = 0$". Write "the square root of 16 is 4" not "$\\sqrt{16} = 4$". Write fractions as words like "three fourths" not "3/4".

Be encouraging, clear, and educational. Use analogies when helpful. Give thorough, detailed explanations so students fully understand each step.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("solve error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});