import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase Client with user's auth context
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    })

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Parse request body
    const { prompt, sessionId, systemContext, temperature, model } = await req.json()

    if (!prompt || !sessionId) throw new Error('Missing prompt or sessionId')

    // Fetch session context
    const [profileRes, historyRes] = await Promise.all([
      supabase.from('profiles').select('learning_style, mastery_level').eq('id', user.id).single(),
      supabase.from('ai_tutor_interactions')
        .select('interaction_type, student_input, ai_response')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(10)
    ])

    const learningStyle = profileRes.data?.learning_style || 'General'
    const masteryLevel = profileRes.data?.mastery_level || 'Intermediate'

    // Build message history
    const messages: any[] = []
    
    if (systemContext) {
      messages.push({
        role: 'system',
        content: systemContext,
      })
    }

    // Add conversation history
    historyRes.data?.forEach((interaction: any) => {
      if (interaction.student_input) {
        messages.push({
          role: 'user',
          content: interaction.student_input,
        })
      }
      if (interaction.ai_response) {
        messages.push({
          role: 'assistant',
          content: interaction.ai_response,
        })
      }
    })

    // Add current prompt
    messages.push({
      role: 'user',
      content: prompt,
    })

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4-turbo-preview',
        messages,
        temperature: temperature || 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    return new Response(JSON.stringify({
      response: aiResponse,
      model: 'gpt-4',
      usage: {
        total_tokens: data.usage?.total_tokens,
        prompt_tokens: data.usage?.prompt_tokens,
        completion_tokens: data.usage?.completion_tokens,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('OpenAI chat error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Failed to process request',
      response: 'Sorry, I encountered an error processing your request.',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
