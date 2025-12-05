import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL_NAME = 'gemini-2.0-flash-lite';
const API_VERSION = 'v1beta';

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Validate Method
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // 3. Parse Body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error('Invalid JSON body');
    }

    // 4. Handle different input formats (Fixes the crash)
    const { prompt, messages, systemPrompt } = body;
    let geminiContents = [];

    // Scenario A: Client sends a "messages" array (Chat History)
    if (messages && Array.isArray(messages)) {
      geminiContents = messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
    } 
    // Scenario B: Client sends a single "prompt" string
    else if (prompt) {
      geminiContents = [{
        role: 'user',
        parts: [{ text: prompt }]
      }];
    } else {
      throw new Error('Missing input: Payload must contain "messages" array or "prompt" string.');
    }

    // 5. API Key Check
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Server configuration error: GEMINI_API_KEY is missing');
    }

    // 6. Call Gemini API
    const finalSystemPrompt = systemPrompt || "You are a helpful AI assistant.";

    const response = await fetch(`https://generativelanguage.googleapis.com/${API_VERSION}/models/${MODEL_NAME}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        systemInstruction: {
          parts: [{ text: finalSystemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    // 7. Handle API Errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error (${response.status}):`, errorText);
      throw new Error(`Gemini Provider Error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error('Gemini returned no text:', JSON.stringify(data));
      throw new Error('AI returned no content.');
    }

    // 8. Return Success (Compatible with your Client)
    return new Response(JSON.stringify({
      success: true,
      response: generatedText, // AITutorService likely looks for this
      reply: generatedText,    // AITutorSystem looks for this (dual support)
      usage: data.usageMetadata || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Function Error:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});