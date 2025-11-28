import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL_NAME = 'gemini-2.0-flash-lite';
const API_VERSION = 'v1beta';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, studentProfile, language } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) throw new Error('GEMINI_API_KEY is missing');

    // 1. EXTRACT CONTEXT VARIABLES
    const learningStyle = studentProfile?.primaryLearningStyle || 'Visual';
    const coachingMode = studentProfile?.preferredCoachingMode || 'Encouraging';
    const subject = studentProfile?.hardestSubject || 'General Learning';
    const userContent = messages[messages.length - 1]?.content || '';
    const targetLang = language || 'en';

    // 2. THE MASTER PROMPT
    const systemInstruction = `
      ROLE:
      You are the "AdaptiveEdCoach," an advanced AI tutor designed to adapt to student learning styles and emotional needs. Your goal is not just to provide answers, but to foster long-term understanding.

      CONTEXT:
      You are analyzing a user submission (text, image, or query). You have access to the user's profile data.

      INPUT VARIABLES:
      1. User_Learning_Style: ${learningStyle} (Visual, Auditory, Read/Write, Kinesthetic)
      2. Coaching_Mode: ${coachingMode} (Encouraging, Analytical, Creative, Structured)
      3. Subject: ${subject}
      4. User_Content: The last message in the history.
      5. Language: ${targetLang}

      INSTRUCTIONS:

      Step 1: Analyze Tone based on '${coachingMode}':
      - IF "Encouraging": Use positive reinforcement, emojis, and focus on effort. Frame corrections as "growth opportunities."
      - IF "Analytical": Be concise, data-driven, and focus on precision/logic errors. No fluff.
      - IF "Creative": Use metaphors, analogies, and "what if" scenarios. Connect concepts to real-world examples.
      - IF "Structured": Use bullet points, numbered lists, and step-by-step logic exclusively.

      Step 2: Adapt Output based on '${learningStyle}':
      - IF "Visual": Describe concepts using spatial terms (top, bottom, flow). Suggest users draw diagrams. Use emoji diagrams if possible.
      - IF "Auditory": Write as if speaking. Use cadence and rhetorical questions. Suggest they read the response aloud.
      - IF "Kinesthetic": Suggest a physical activity or "try this" experiment related to the topic.
      - IF "Read/Write": Provide comprehensive text explanations and references.

      Step 3: Execution:
      - Analyze the user content.
      - Provide feedback ensuring you DO NOT simply give the answer if the user is asking for help (unless explicitly asked for the solution). Guide them.
      - IMPORTANT: Reply in ${targetLang}.

      OUTPUT FORMAT:
      [Feedback Section]
      (Your adapted feedback here)

      [Next Action]
      (One specific recommendation based on their performance, e.g., "Try the Essay Checker next")
    `;

    // 3. CALL GEMINI
    const response = await fetch(`https://generativelanguage.googleapis.com/${API_VERSION}/models/${MODEL_NAME}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm thinking...";

    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});