// NOTE: using Deno.serve directly. No imports needed for server.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL_NAME = 'gemini-2.0-flash-lite';
const API_VERSION = 'v1beta';

Deno.serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Environment Check
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Server configuration error: GEMINI_API_KEY is missing');
    }

    // 3. Parse Body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error('Invalid JSON body');
    }

    const { messages, studentProfile, language } = body;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Bad Request: "messages" array is required');
    }

    // 4. Extract Context Variables
    const learningStyle = studentProfile?.primaryLearningStyle || 'Visual';
    const coachingMode = studentProfile?.preferredCoachingMode || 'Encouraging';
    const subject = studentProfile?.hardestSubject || 'General Learning';
    const targetLang = language || 'en';

    // 5. Construct System Prompt (RetainLearn Persona)
    const systemInstruction = `
      ROLE:
      You are "RetainLearn Coach," an advanced AI tutor designed to adapt to student learning styles.
      
      CONTEXT:
      - Student Learning Style: ${learningStyle} (Visual, Auditory, Read/Write, Kinesthetic)
      - Coaching Mode: ${coachingMode}
      - Subject Focus: ${subject}
      - Language: ${targetLang}

      INSTRUCTIONS:
      1. Identify as "RetainLearn" if asked.
      2. If "Encouraging": Use positive reinforcement. If "Analytical": Be concise and data-driven.
      3. Adapt explanations to the "${learningStyle}" style (e.g., if Visual, describe diagrams; if Kinesthetic, suggest activities).
      4. DO NOT simply give the answer. Guide the student to the solution.
      5. Reply in ${targetLang}.
    `;

    // 6. Call Gemini API
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

    // 7. Handle Upstream API Errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error (${response.status}):`, errorText);
      throw new Error(`Gemini Provider Error: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error('Empty response from Gemini:', JSON.stringify(data));
      throw new Error('AI returned no content.');
    }

    return new Response(JSON.stringify({ reply }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('Edge Function Critical Error:', error.message);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});