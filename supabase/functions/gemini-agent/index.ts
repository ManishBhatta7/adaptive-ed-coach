import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentRequest {
  action: string;
  context: {
    userMessage?: string;
    currentPage?: string;
    userRole?: string;
    data?: any;
  };
  capabilities?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, context, capabilities = [] }: AgentRequest = await req.json();

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    // Initialize Supabase client for data operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Define available capabilities for the agent
    const availableCapabilities = [
      "generate_images",
      "process_data", 
      "create_educational_content",
      "analyze_student_progress",
      "generate_quizzes",
      "provide_explanations",
      "create_study_materials"
    ];

    // Handle different action types
    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'render_structured_data') {
      systemPrompt = `You are an expert at converting structured data into beautiful HTML. 
Create clean, responsive HTML with Tailwind CSS classes for styling.
Return ONLY the HTML content, no JSON wrapper or markdown.`;
      
      userPrompt = `Convert this data to beautiful HTML: ${JSON.stringify(context.data, null, 2)}`;
      
    } else if (action === 'analyze_submission') {
      systemPrompt = `You are an educational AI that analyzes student submissions and provides constructive feedback.
Analyze the content and provide specific, actionable feedback to help the student improve.`;
      
      userPrompt = `Analyze this student submission:
Subject: ${context.data?.subject || 'General'}
Content: ${context.data?.content || context.userMessage}

Provide detailed feedback including:
1. Strengths in the response
2. Areas for improvement
3. Specific suggestions
4. A score out of 100`;

    } else if (action === 'generate_image') {
      // Call image generation function directly
      const imageResponse = await fetch(`${supabaseUrl}/functions/v1/gemini-image-generator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: context.userMessage || context.data?.prompt,
          style: context.data?.style || 'educational',
          format: context.data?.format || 'png',
          size: context.data?.size || '1024x1024'
        })
      });
      
      const imageResult = await imageResponse.json();
      
      return new Response(JSON.stringify({
        success: true,
        agent_response: {
          action_type: "image_generation",
          content: "Image generated successfully",
          image_data: imageResult,
          function_results: [{ function: "generate_image", result: imageResult }]
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } else {
      // Default coaching response
      systemPrompt = `You are an adaptive AI educational coach. Provide personalized, encouraging feedback that helps students learn and grow. Be specific, constructive, and motivating.`;
      userPrompt = context.userMessage || 'Please provide guidance.';
    }

    // Call Lovable AI (Free Gemini)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Lovable AI error:', error);
      throw new Error(`Lovable AI error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const agentResponse = data.choices?.[0]?.message?.content || 'No response generated';

    return new Response(JSON.stringify({
      success: true,
      agent_response: {
        action_type: action,
        content: agentResponse,
        data: context.data
      },
      raw_response: agentResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in gemini-agent function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});