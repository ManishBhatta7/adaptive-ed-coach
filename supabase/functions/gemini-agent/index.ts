import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentRequest {
  action: string;
  context: any;
  conversationHistory?: any[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. DIAGNOSTIC CHECK: Validate Secrets immediately
    const missingVars = [];
    if (!Deno.env.get('GEMINI_API_KEY')) missingVars.push('GEMINI_API_KEY');
    if (!Deno.env.get('SUPABASE_URL')) missingVars.push('SUPABASE_URL');
    if (!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

    // If secrets are missing, return a descriptive 200 OK error (so frontend displays it)
    if (missingVars.length > 0) {
      console.error(`Missing Secrets: ${missingVars.join(', ')}`);
      return new Response(JSON.stringify({
        success: false,
        error: `CONFIG ERROR: Missing secrets on server: ${missingVars.join(', ')}. Run 'npx supabase secrets set' to fix.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, context, conversationHistory = [] }: AgentRequest = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- Image Generation Handler ---
    if (action === 'generate_image') {
      const imageResponse = await fetch(`${supabaseUrl}/functions/v1/gemini-image-generator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: context.userMessage || context.data?.prompt,
          style: context.data?.style || 'educational',
          format: 'png',
          size: '1024x1024'
        })
      });
      
      const imageResult = await imageResponse.json();
      return new Response(JSON.stringify({
        success: true,
        agent_response: {
          action_type: "image_generation",
          content: "Image generated successfully",
          image_data: imageResult
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- Prompt Selection Logic ---
    let systemPrompt = `You are a helpful educational AI assistant.`;
    let userPrompt = context.userMessage || 'Provide guidance.';

    if (action === 'analyze_my_progress') {
      systemPrompt = `You are an expert educational data analyst. Analyze the student's performance data and provide actionable insights.`;
      userPrompt = `Analyze this student's academic performance: ${JSON.stringify(context.data?.performances || [])}`;
    } else if (action === 'create_quiz') {
      systemPrompt = `You are a rapid-response assessment engine. Output ONLY the quiz content.`;
      const qCount = context.data?.questionCount || 5;
      userPrompt = `${context.userMessage}\n\nGenerate a ${qCount}-question quiz.`;
    }

    // --- Direct Gemini API Call ---
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Request: ${userPrompt}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Gemini API Error: ${err.error?.message || 'Unknown'}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    return new Response(JSON.stringify({
      success: true,
      agent_response: {
        action_type: action,
        content: text,
        data: context.data
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    // Catch-all: Return error as JSON instead of crashing with 500
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});