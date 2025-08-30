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

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
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

    const systemPrompt = `You are an intelligent educational AI agent that acts as a processing layer between frontend user interactions and backend operations. 

Your role is to:
1. Interpret user actions and requests
2. Decide what operations to perform based on the context
3. Generate appropriate responses or call specific functions
4. Return structured data for the frontend to consume

Available capabilities: ${availableCapabilities.join(', ')}

Current context:
- Action: ${action}
- User Message: ${context.userMessage || 'No specific message'}
- Current Page: ${context.currentPage || 'Unknown'}
- User Role: ${context.userRole || 'student'}

Based on the user's action and context, you need to:
1. Analyze what the user is trying to accomplish
2. Determine if you need to generate content, call functions, or process data
3. Respond with a structured JSON format that includes:
   - action_type: The type of action to perform
   - content: Any generated content
   - function_calls: Array of functions to call with parameters
   - ui_updates: Suggested UI changes or data to display
   - next_steps: Suggested follow-up actions for the user

Be intelligent, proactive, and educational in your responses.`;

    const prompt = `User Action: "${action}"
${context.userMessage ? `User Message: "${context.userMessage}"` : ''}

Please analyze this request and provide a comprehensive response that helps accomplish the user's goal.`;

    // Call Gemini to process the request
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\n${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const agentResponse = data.candidates[0].content.parts[0].text;

    // Try to parse as JSON, fallback to text response
    let structuredResponse;
    try {
      structuredResponse = JSON.parse(agentResponse);
    } catch {
      structuredResponse = {
        action_type: "text_response",
        content: agentResponse,
        function_calls: [],
        ui_updates: { message: agentResponse },
        next_steps: ["Continue the conversation"]
      };
    }

    // Execute any function calls the agent requested
    if (structuredResponse.function_calls && structuredResponse.function_calls.length > 0) {
      const functionResults = [];
      
      for (const funcCall of structuredResponse.function_calls) {
        try {
          let result;
          
          switch (funcCall.function) {
            case 'generate_image':
              // Call image generation function
              const imageResponse = await fetch(`${supabaseUrl}/functions/v1/gemini-image-generator`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(funcCall.parameters)
              });
              result = await imageResponse.json();
              break;
              
            case 'process_data':
              // Call data processing function
              const dataResponse = await fetch(`${supabaseUrl}/functions/v1/gemini-data-processor`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(funcCall.parameters)
              });
              result = await dataResponse.json();
              break;
              
            default:
              result = { error: `Unknown function: ${funcCall.function}` };
          }
          
          functionResults.push({
            function: funcCall.function,
            result: result
          });
        } catch (error) {
          functionResults.push({
            function: funcCall.function,
            error: error.message
          });
        }
      }
      
      structuredResponse.function_results = functionResults;
    }

    return new Response(JSON.stringify({
      success: true,
      agent_response: structuredResponse,
      raw_response: agentResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in gemini-agent function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});