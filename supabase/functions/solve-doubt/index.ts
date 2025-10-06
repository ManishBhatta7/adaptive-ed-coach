import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: doubt, error: doubtError } = await supabase
      .from('doubts')
      .select('*')
      .eq('id', doubtId)
      .maybeSingle();

    if (doubtError || !doubt) {
      return new Response(
        JSON.stringify({ error: 'Doubt not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingResponse } = await supabase
      .from('doubt_responses')
      .select('*')
      .eq('doubt_id', doubtId)
      .eq('response_type', 'ai')
      .maybeSingle();

    if (existingResponse) {
      return new Response(
        JSON.stringify({
          message: 'AI response already exists',
          response: existingResponse
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      return new Response(
        JSON.stringify({ error: 'DeepSeek API key not configured' }),
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

    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
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
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!deepseekResponse.ok) {
      const error = await deepseekResponse.json();
      console.error('DeepSeek API error:', error);
      throw new Error(`DeepSeek API error: ${error.error?.message || 'Unknown error'}`);
    }

    const aiData = await deepseekResponse.json();
    const aiResponseText = aiData.choices?.[0]?.message?.content || 'No response generated';

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
