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
      ? `You are SnapSolve AI, an expert tutor who explains ANY topic clearly and thoroughly.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS — use these exact headings with the emoji:

## 📖 What is it?
Write a clear, simple definition in 2-3 sentences. Use everyday language a student can understand.

---

## 🔑 Key Concepts
List the 3-5 most important ideas as bullet points. Keep each bullet to 1-2 sentences.

- **Concept name**: Brief explanation
- **Concept name**: Brief explanation
- **Concept name**: Brief explanation

---

## ⚙️ How it Works
Explain the process or mechanism step by step. Number each step clearly.

1. **First step**: Explanation
2. **Second step**: Explanation
3. **Third step**: Explanation

Write any math in plain English words (say "x squared" not "x^2").

---

## 🌍 Real-World Examples
Give 2-3 practical examples that students can relate to.

1. **Example title**: Description
2. **Example title**: Description

---

## 💡 Simple Analogy
Give one memorable analogy that makes the concept click. Use a comparison to something from daily life.

> Think of it like this: [analogy here]

---

## 🎯 Quick Summary
Wrap up in 2-3 clear sentences that capture the key takeaway.

RULES:
- Write ALL math in plain English words. NEVER use dollar signs, LaTeX, backslashes, or symbols like ^, _, {, }.
- Keep paragraphs short — 2-3 sentences max per paragraph.
- Use bold for important terms.
- Use bullet points and numbered lists — never write walls of text.
- Add a blank line between sections for readability.
- Be encouraging and friendly. Use "you" to speak directly to the student.`

      : `You are SnapSolve AI, an expert problem-solving tutor.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS — use these exact headings with the emoji:

## 🧐 Understanding the Problem
Restate what the problem is asking in simple, clear language. 1-2 sentences.

---

## 📚 Key Concepts Needed
List the formulas, theorems, or concepts you will use. Write math in plain English words.

- **Concept**: Brief explanation of why it is needed

---

## ✏️ Step-by-Step Solution

### Step 1: [Step title]
Explain what you are doing and why, then show the work clearly.

### Step 2: [Step title]
Continue with the next logical step.

### Step 3: [Step title]
Keep going until solved.

(Add as many steps as needed. Each step should have a clear title and explanation.)

---

## ✅ Final Answer

> **Answer**: State the final answer clearly here.

---

## 💡 Why This Makes Sense
Explain in 1-2 sentences why the answer is reasonable. Help the student build intuition.

RULES:
- Write ALL math in plain English words. NEVER use dollar signs, LaTeX, backslashes, or symbols like ^, _, {, }.
  Example: Write "x squared plus 5x plus 6 equals zero" NOT "$x^2 + 5x + 6 = 0$".
  Example: Write "the square root of 16 is 4" NOT "sqrt(16) = 4".
- Keep paragraphs short — 2-3 sentences max.
- Use bold for important terms and answers.
- Use numbered lists for steps, bullet points for concepts.
- Add a blank line between every section for clean spacing.
- Each step must have a clear title in bold.
- Be encouraging and supportive. Speak directly to the student.`;

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
          JSON.stringify({ error: "AI usage limit reached. Please try again later." }),
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
