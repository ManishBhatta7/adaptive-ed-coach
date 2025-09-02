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

    // Check if this is a rendering request
    if (action === 'render_structured_data' && context.renderMode) {
      const renderPrompt = `Convert the following structured data into beautiful, well-formatted HTML content that can be rendered in a browser. 

IMPORTANT RULES:
1. Return ONLY the HTML content, no JSON wrapper
2. Use proper HTML tags and structure
3. Include inline CSS classes for styling (use Tailwind-like classes)
4. Make it visually appealing and educational
5. If the data includes function calls or images, render them appropriately
6. Use semantic HTML elements
7. Make the content responsive and accessible

Structured Data to Render:
${JSON.stringify(context.structuredData, null, 2)}

User Request: ${context.userMessage}

Generate beautiful HTML content now:`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: renderPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      const htmlContent = data.candidates[0].content.parts[0].text;

      return new Response(JSON.stringify({
        success: true,
        agent_response: {
          content: htmlContent,
          content_type: 'html'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = `You are an adaptive AI educational coach that provides personalized, context-aware feedback and guidance.

## CORE CAPABILITIES:
1. **Personalized Analysis** - Analyze student work considering their learning history and style
2. **Progress-Aware Coaching** - Provide feedback that acknowledges growth patterns and trends
3. **Learning Style Adaptation** - Adjust feedback style based on student's learning preferences
4. **Longitudinal Tracking** - Reference past performance to show improvement and identify patterns
5. **Image Generation** - Create educational visuals tailored to student's learning style
6. **Holistic Support** - Address both academic and motivational needs

## PERSONALIZATION PRINCIPLES:
- Reference student's learning journey and progress over time
- Adapt communication style to match their learning preferences
- Build on identified strengths while addressing improvement areas
- Provide context-aware recommendations based on performance patterns
- Show understanding of their unique learning profile

## IMAGE GENERATION:
CRITICAL: When the user requests ANY visual content (images, diagrams, charts, illustrations, graphics, pictures, visuals), you MUST call the "generate_image" function.

Image generation triggers include requests for:
- Educational diagrams (water cycle, cell structure, mathematical graphs, etc.)
- Illustrations (historical events, scientific processes, literary scenes)
- Charts and graphs (data visualization, progress charts, comparison tables)
- Visual learning aids (mind maps, concept maps, flowcharts)
- Infographics (summarizing information visually)
- Any request containing words like: "show me", "create a diagram", "visualize", "illustrate", "draw", "picture", "image", "graphic"

When creating educational visuals, consider the student's learning style:
- Visual learners: Rich diagrams, mind maps, colorful illustrations
- Reading/Writing learners: Text-heavy infographics, structured outlines
- Logical learners: Flowcharts, systematic diagrams, step-by-step visuals
- Kinesthetic learners: Interactive elements, hands-on activity illustrations

For image generation requests, you MUST:
1. Always include function_calls in your response
2. Use descriptive, detailed prompts that specify educational context
3. Include appropriate style parameters (educational, clean, informative)
4. Support both PNG and JPG formats based on user preference
5. Provide clear descriptions of what will be generated

## RESPONSE APPROACH:
- Start with personal acknowledgment of their progress/effort
- Reference specific patterns from their learning history when available
- Provide learning-style appropriate suggestions
- Include both immediate feedback and long-term growth guidance
- End with encouragement that acknowledges their learning journey

Be personal, growth-focused, and adaptive to each student's unique learning path.

Available capabilities: ${availableCapabilities.join(', ')}

Current context:
- Action: ${action}
- User Message: ${context.userMessage || 'No specific message'}
- Current Page: ${context.currentPage || 'Unknown'}
- User Role: ${context.userRole || 'student'}

RESPONSE FORMAT:
IMPORTANT: Always respond with valid JSON in this exact format:
{
  "action_type": "image_generation" | "data_analysis" | "text_response" | "educational_content",
  "content": "Descriptive message about what you're doing...",
  "function_calls": [
    {
      "function": "generate_image" | "process_data" | "create_educational_content",
      "parameters": {
        "prompt": "detailed description for image generation",
        "style": "educational",
        "format": "png" | "jpg",
        "width": 1024,
        "height": 768
      }
    }
  ],
  "ui_updates": {
    "message": "User-friendly status message",
    "data_type": "image" | "data" | "text",
    "format_options": ["png", "jpg"] // for images
  },
  "next_steps": ["Action 1", "Action 2"]
}

EDUCATIONAL FOCUS:
- Always prioritize educational value in your responses
- Provide clear, age-appropriate explanations
- Include learning objectives when creating content
- Suggest follow-up activities or questions
- Adapt complexity to the user's role (student/teacher)

Be intelligent, proactive, and educational in your responses. Always aim to enhance learning outcomes.`;

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
            case 'generate_images':
              // Call image generation function with format support
              const params = {
                prompt: funcCall.parameters.prompt || funcCall.parameters.description,
                format: context.imageSpecs?.format || funcCall.parameters.format || 'png',
                quality: context.imageSpecs?.quality || funcCall.parameters.quality || 'high',
                width: context.imageSpecs?.width || 1024,
                height: context.imageSpecs?.height || 768
              };
              
              console.log('Calling image generator with params:', params);
              
              const imageResponse = await fetch(`${supabaseUrl}/functions/v1/gemini-image-generator`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
              });
              result = await imageResponse.json();
              console.log('Image generation result:', result);
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