import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { doubtId } = await req.json();

    if (!doubtId) {
      return new Response(
        JSON.stringify({ error: 'Doubt ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the doubt details
    const { data: doubt, error: doubtError } = await supabase
      .from('doubts')
      .select('*')
      .eq('id', doubtId)
      .single();

    if (doubtError || !doubt) {
      return new Response(
        JSON.stringify({ error: 'Doubt not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if there's already an AI response
    const { data: existingResponse } = await supabase
      .from('doubt_responses')
      .select('*')
      .eq('doubt_id', doubtId)
      .eq('response_type', 'ai')
      .single();

    if (existingResponse) {
      return new Response(
        JSON.stringify({ 
          message: 'AI response already exists',
          response: existingResponse 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate AI response using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are an educational AI tutor helping a student with their doubt. Please provide a comprehensive, clear, and educational response to this student's question:

Title: ${doubt.title}
Description: ${doubt.description}
Subject: ${doubt.subject_area || 'General'}
Difficulty Level: ${doubt.difficulty_level || 'Medium'}

Guidelines for your response:
1. Be encouraging and supportive
2. Explain concepts step-by-step
3. Use simple language appropriate for the difficulty level
4. Include examples when helpful
5. Suggest additional resources or practice if relevant
6. End with a question to check understanding

Please provide a detailed, educational response that helps the student understand the concept thoroughly.`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational tutor who helps students understand concepts clearly and encouragingly. Always provide comprehensive explanations with examples.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 1000
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const aiData = await openAIResponse.json();
    const aiResponseText = aiData.choices[0].message.content;

    // Save the AI response to the database
    const { data: savedResponse, error: saveError } = await supabase
      .from('doubt_responses')
      .insert({
        doubt_id: doubtId,
        response_text: aiResponseText,
        response_type: 'ai',
        is_solution: true,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving AI response:', saveError);
      throw new Error('Failed to save AI response');
    }

    // Update doubt status to 'in_progress'
    await supabase
      .from('doubts')
      .update({ 
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', doubtId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'AI solution generated successfully',
        response: savedResponse
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in solve-doubt function:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate solution',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});