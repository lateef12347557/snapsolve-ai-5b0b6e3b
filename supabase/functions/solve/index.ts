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
      // Topic explanation mode
      userContent.push({
        type: "text",
        text: `${subjectContext}Explain this topic in detail with clear examples, analogies, and real-world applications. Make it engaging and easy to understand for a student.\n\nTopic: ${question}`,
      });
    } else if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: imageBase64 },
      });
      userContent.push({
        type: "text",
        text: `${subjectContext}Look at this image of a problem. Solve it step by step with clear explanations. Use LaTeX notation for math (wrap in $...$ for inline, $$...$$ for display). ${question ? `Additional context: ${question}` : ""}`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `${subjectContext}Solve this problem step by step with clear explanations. Use LaTeX notation for math (wrap in $...$ for inline, $$...$$ for display).\n\nProblem: ${question}`,
      });
    }

    const systemPrompt = mode === "explain"
      ? `You are SnapSolve AI, an expert tutor who can explain ANY topic across all subject areas including Math, Physics, Chemistry, Biology, History, Computer Science, Art, Music, Literature, Geography, Economics, Philosophy, and more.

Your response format for topic explanations:
1. **What is it?**: A clear, concise definition
2. **Key Concepts**: The main ideas and principles to understand
3. **How it Works**: Detailed explanation with step-by-step breakdown. Use LaTeX for any math.
4. **Real-World Examples**: 2-3 practical examples or applications
5. **Analogies**: Simple analogies to make it relatable
6. **Fun Fact**: An interesting fact that makes the topic memorable
7. **Quick Summary**: A 2-3 sentence recap

Be encouraging, clear, and educational. Use analogies and vivid examples. Make complex topics accessible.`
      : `You are SnapSolve AI, an expert tutor in Math, Physics, and Chemistry. 

Your response format:
1. **Understanding**: Briefly restate what the problem is asking
2. **Key Concepts**: List the relevant formulas/concepts needed
3. **Step-by-Step Solution**: Solve with detailed, clear steps. Use LaTeX for all math.
4. **Final Answer**: Clearly state the answer, boxed if possible: $$\\boxed{answer}$$
5. **Intuition**: Explain WHY the answer makes sense in 1-2 sentences

Be encouraging, clear, and educational. Use analogies when helpful.`;

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
