// @deno-types="https://esm.sh/v135/@types/node@20.10.6/index.d.ts"
// deno-lint-ignore-file

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: unknown;

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  prompt: string;
  sessionId: string;
  systemContext?: string;
  temperature?: number;
  model?: string;
}

interface Interaction {
  student_input?: string;
  ai_response?: string;
}

serve(async (req: Request) => {
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
    const body = (await req.json()) as RequestBody
    const { prompt, sessionId, systemContext, temperature, model } = body

    if (!prompt || !sessionId) throw new Error('Missing prompt or sessionId')

    // Fetch session context
    const [profileRes] = await Promise.all([
      supabase.from('profiles').select('learning_style, mastery_level').eq('id', user.id).single(),
    ])

    // Build message history
    const messages: Array<{ role: string; content: string }> = []
    
    if (systemContext) {
      messages.push({
        role: 'system',
        content: systemContext,
      })
    }

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
      const errorData = await response.json() as Record<string, unknown>
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json() as Record<string, unknown>
    const choices = data.choices as Array<{ message: { content: string } }> | undefined
    const aiResponse = choices?.[0]?.message?.content || 'No response'
    const usage = data.usage as { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number } | undefined

    return new Response(JSON.stringify({
      response: aiResponse,
      model: 'gpt-4',
      usage: {
        total_tokens: usage?.total_tokens,
        prompt_tokens: usage?.prompt_tokens,
        completion_tokens: usage?.completion_tokens,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('OpenAI chat error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request'
    return new Response(JSON.stringify({
      error: errorMessage,
      response: 'Sorry, I encountered an error processing your request.',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
