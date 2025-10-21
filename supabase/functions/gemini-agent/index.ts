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
      
    } else if (action === 'analyze_my_progress') {
      systemPrompt = `You are an expert educational data analyst and learning coach. Analyze student performance data comprehensively and provide actionable insights.`;
      
      const performanceData = context.data?.performances || [];
      const recentActivity = context.data?.recentActivity || [];
      
      userPrompt = `Analyze this student's academic performance:

Total Submissions: ${performanceData.length}
Recent Activity: ${JSON.stringify(recentActivity, null, 2)}
Learning Style: ${context.data?.learningStyle || 'Not identified'}

Provide a detailed analysis covering:
1. **Overall Performance Trends**: Are they improving, declining, or staying consistent?
2. **Subject-Specific Insights**: Strengths and weaknesses by subject
3. **Key Achievements**: What are they doing well?
4. **Areas for Improvement**: Specific topics or skills that need work
5. **Personalized Recommendations**: 3-5 actionable steps they can take
6. **Motivational Insights**: Encouraging observations and growth opportunities

Format your response with clear headings and bullet points.`;
      
    } else if (action === 'create_study_plan') {
      systemPrompt = `You are an expert study coach and time management specialist. Create personalized, realistic study plans.`;
      
      userPrompt = `${context.userMessage}\n\nStudent Context:\nLearning Style: ${context.data?.learningStyle || 'Not specified'}\nRecent Performance: ${context.data?.recentActivity?.length || 0} recent submissions\n\nCreate a comprehensive study plan with:\n1. Daily schedule with time blocks\n2. Subject prioritization based on performance\n3. Study techniques matched to learning style\n4. Break and rest periods\n5. Weekly goals and milestones\n6. Tips for staying motivated`;
      
    } else if (action === 'create_quiz') {
      systemPrompt = `You are an expert educational content creator specializing in assessment design. Create engaging, challenging quizzes.`;
      
      userPrompt = `${context.userMessage}\n\nCreate a comprehensive practice quiz with:\n- 10 questions of varying difficulty (easy, medium, hard)\n- Mix of question types (multiple choice, true/false, short answer)\n- Clear, unambiguous questions\n- Detailed explanations for answers\n- Learning objectives for each question\n\nFormat the quiz clearly with numbering and sections.`;
      
    } else if (action === 'explain_concept') {
      systemPrompt = `You are an expert educator who excels at explaining complex concepts simply. Use the Feynman Technique: explain as if teaching a beginner.`;
      
      userPrompt = `${context.userMessage}\n\nExplain this concept comprehensively:\n1. **Simple Definition**: What is it in one sentence?\n2. **Core Concepts**: Break down the key ideas\n3. **Real-World Analogy**: Relate it to everyday life\n4. **Step-by-Step Examples**: Show how it works\n5. **Common Misconceptions**: What people get wrong\n6. **Practice Questions**: 2-3 questions to test understanding\n\nUse simple language and visual descriptions where helpful.`;
      
    } else if (action === 'help_with_doubts') {
      systemPrompt = `You are a patient, supportive tutor who helps students overcome learning challenges with empathy and expertise.`;
      
      userPrompt = `${context.userMessage}\n\nHelp this student with their learning challenges by:\n1. **Understanding the Issue**: Identify the core problem\n2. **Breaking It Down**: Simplify the difficult parts\n3. **Multiple Approaches**: Offer different ways to understand\n4. **Practice Strategy**: How to improve\n5. **Resources**: Where to learn more\n6. **Encouragement**: Positive reinforcement\n\nBe encouraging and build confidence.`;
      
    } else {
      // Default coaching response with context
      systemPrompt = `You are an adaptive AI educational coach powered by advanced AI. You provide personalized, encouraging feedback that helps students learn and grow. 
      
You have access to the student's context:
- Name: ${context.data?.name || 'Student'}
- Learning Style: ${context.data?.learningStyle || 'Not identified'}
- Recent Performance: ${context.data?.recentActivity?.length || 0} submissions

Adapt your response to their needs. Be specific, constructive, motivating, and personalized. Use markdown formatting for clarity.`;
      
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