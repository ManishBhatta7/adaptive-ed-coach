import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Initialize Supabase Client with the USER'S Auth Context
    // We use the Authorization header so RLS policies still apply if needed
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    })

    // 3. Verify User & Get ID
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // 4. Parse Request Body
    const { prompt, sessionId } = await req.json()

    if (!prompt || !sessionId) throw new Error('Missing prompt or sessionId')

    // 5. SECURELY Fetch Context (Server-Side)
    // We fetch the profile and recent history here. The client CANNOT fake this.
    const [profileRes, historyRes] = await Promise.all([
      supabase.from('profiles').select('learning_style, mastery_level').eq('id', user.id).single(),
      supabase.from('ai_tutor_interactions')
        .select('interaction_type, student_input, ai_response')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(10) // Context window of last 10 messages
    ])

    const learningStyle = profileRes.data?.learning_style || 'General'
    const masteryLevel = profileRes.data?.mastery_level || 'Intermediate'

    // 6. Construct the System Prompt (The "Secret Sauce")
    const systemInstruction = `
      You are AdaptiveEd, an AI Tutor.
      Target Audience: ${masteryLevel} student.
      Learning Style: ${learningStyle}.
      
      Instructions:
      1. If the style is 'Visual', use ASCII diagrams or vivid metaphors.
      2. If 'Kinesthetic', suggest real-world experiments.
      3. Do NOT provide answers directly. Ask guiding questions (Socratic method).
      4. Keep responses concise (max 150 words).
    `

    // 7. Format History for Gemini
    // Gemini expects specific role formats ('user' vs 'model')
    const chatHistory = (historyRes.data || []).flatMap(msg => [
      { role: 'user', parts: [{ text: msg.student_input }] },
      { role: 'model', parts: [{ text: msg.ai_response }] }
    ])

    // Add current user prompt
    const finalPayload = {
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      system_instruction: {
        parts: [{ text: systemInstruction }]
      }
    }

    // 8. Call Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      }
    )

    const geminiData = await geminiRes.json()
    
    // Extract text (add error handling for safety ratings if needed)
    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble thinking right now. Try again?"

    // 9. PERSISTENCE LAYER (Server-Side)
    // Save to DB immediately. Even if the client disconnects, data is safe.
    const { error: dbError } = await supabase.from('ai_tutor_interactions').insert({
      session_id: sessionId,
      interaction_type: 'question',
      student_input: prompt,
      ai_response: aiText,
      confidence_score: 0.95 // You can parse this from Gemini metadata if available
    })

    if (dbError) console.error('Failed to log conversation:', dbError)

    // 10. Return Response to Client
    return new Response(JSON.stringify({ response: aiText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})