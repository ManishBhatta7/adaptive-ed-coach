import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReflectionData {
  problem_description: string;
  strategy_used: string;
  reflection_text: string;
  was_helpful: boolean;
  difficulty_rating?: number;
  teacher_rating?: number;
}

interface FeedbackRequest {
  reflectionId: string;
  reflection: ReflectionData;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { method } = req;

    if (method !== 'POST') {
      throw new Error(`Method ${method} not allowed`);
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body: FeedbackRequest = await req.json();
    const { reflectionId, reflection } = body;

    if (!reflectionId || !reflection) {
      throw new Error('Missing reflectionId or reflection data');
    }

    // Get DeepSeek API key
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    // Prepare the AI prompt
    const prompt = generateFeedbackPrompt(reflection);

    // Call DeepSeek API
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an educational AI assistant helping to provide constructive feedback on student metacognitive reflections. Focus on encouraging deeper thinking, recognizing good strategies, and suggesting improvements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!deepseekResponse.ok) {
      console.error('DeepSeek API error:', await deepseekResponse.text());
      throw new Error('Failed to generate AI feedback');
    }

    const deepseekData = await deepseekResponse.json();
    const feedback = deepseekData.choices?.[0]?.message?.content?.trim();

    if (!feedback) {
      throw new Error('No feedback generated from AI');
    }

    // Update the reflection with AI feedback
    const { error: updateError } = await supabaseClient
      .from('reflections')
      .update({
        ai_feedback: feedback,
        feedback_generated_at: new Date().toISOString(),
      })
      .eq('id', reflectionId);

    if (updateError) {
      console.error('Error updating reflection:', updateError);
      throw new Error('Failed to save AI feedback to database');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        feedback,
        message: 'AI feedback generated successfully' 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generate-metacog-feedback:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
});

function generateFeedbackPrompt(reflection: ReflectionData): string {
  const { 
    problem_description, 
    strategy_used, 
    reflection_text, 
    was_helpful, 
    difficulty_rating, 
    teacher_rating 
  } = reflection;

  return `Please provide constructive feedback on this student's metacognitive reflection:

**Problem:** ${problem_description}

**Strategy Used:** ${strategy_used}

**Student's Reflection:** ${reflection_text}

**Strategy Effectiveness:** ${was_helpful ? 'Student found it helpful' : 'Student found it not helpful'}

**Difficulty Level:** ${difficulty_rating ? `${difficulty_rating}/5` : 'Not specified'}

${teacher_rating !== undefined ? `**Teacher Rating:** ${teacher_rating}/2` : ''}

Please provide feedback that:
1. Acknowledges what the student did well in their reflection
2. Suggests ways to deepen their metacognitive thinking
3. Offers specific strategies or questions they could consider next time
4. Encourages continued self-reflection

Keep your response to 2-3 sentences, focused on being encouraging and constructive.`;
}