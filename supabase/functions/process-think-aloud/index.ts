import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThinkAloudRequest {
  audio_data: string; // base64 encoded audio
  duration: number;
  student_id: string;
}

interface AnalysisResult {
  strategyWords: string[];
  qualityScore: number;
  insights: string[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { audio_data, duration, student_id }: ThinkAloudRequest = await req.json();

    if (!audio_data || !student_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Convert base64 to audio file (WebM)
    const audioBuffer = Uint8Array.from(atob(audio_data), c => c.charCodeAt(0));
    
    // 2. Use OpenAI Whisper API for transcription
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create form data for Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const transcriptResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!transcriptResponse.ok) {
      console.error('Whisper API error:', await transcriptResponse.text());
      return new Response(
        JSON.stringify({ error: 'Transcription failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transcriptResult = await transcriptResponse.json();
    const transcript = transcriptResult.text;

    // 3. Analyze the transcript for metacognitive strategies
    const analysis = await analyzeTranscript(transcript, openaiKey);

    // 4. Store results (optional - could be stored in database)
    const result = {
      transcript,
      analysis,
      duration,
      processed_at: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing think-aloud:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeTranscript(transcript: string, openaiKey: string): Promise<AnalysisResult> {
  const strategyKeywords = [
    // Planning strategies
    'plan', 'planning', 'strategy', 'approach', 'organize', 'structure',
    // Monitoring strategies  
    'check', 'checking', 'verify', 'monitor', 'track', 'review',
    // Evaluation strategies
    'evaluate', 'assess', 'reflect', 'think about', 'consider',
    // Problem-solving strategies
    'break down', 'step by step', 'analyze', 'compare', 'contrast',
    // Self-regulation strategies
    'focus', 'concentrate', 'pause', 'slow down', 'speed up'
  ];

  // Simple keyword detection
  const detectedWords = strategyKeywords.filter(keyword => 
    transcript.toLowerCase().includes(keyword.toLowerCase())
  );

  // Use GPT to analyze the transcript more deeply
  const analysisPrompt = `
Analyze this student's think-aloud transcript for metacognitive strategies and learning quality:

Transcript: "${transcript}"

Please evaluate:
1. Quality of metacognitive thinking (0-1 scale)
2. Specific learning strategies mentioned or demonstrated
3. Areas for improvement or insights

Respond in JSON format:
{
  "qualityScore": <number between 0 and 1>,
  "strategies": [<list of strategies detected>],
  "insights": [<list of helpful insights for the student>]
}
`;

  try {
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an educational AI analyzing student metacognition.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (gptResponse.ok) {
      const gptResult = await gptResponse.json();
      const analysisText = gptResult.choices[0]?.message?.content;
      
      try {
        const parsed = JSON.parse(analysisText);
        return {
          strategyWords: [...new Set([...detectedWords, ...(parsed.strategies || [])])],
          qualityScore: Math.max(0, Math.min(1, parsed.qualityScore || 0)),
          insights: parsed.insights || [],
        };
      } catch (parseError) {
        console.error('Error parsing GPT response:', parseError);
      }
    }
  } catch (error) {
    console.error('Error with GPT analysis:', error);
  }

  // Fallback analysis if GPT fails
  const wordCount = transcript.split(' ').length;
  const strategyDensity = detectedWords.length / Math.max(wordCount, 1);
  
  return {
    strategyWords: detectedWords,
    qualityScore: Math.min(1, strategyDensity * 2 + (wordCount > 20 ? 0.3 : 0)), // Basic heuristic
    insights: generateBasicInsights(detectedWords, transcript),
  };
}

function generateBasicInsights(strategyWords: string[], transcript: string): string[] {
  const insights: string[] = [];
  
  if (strategyWords.length === 0) {
    insights.push("Try to verbalize your thinking process more explicitly");
    insights.push("Consider describing the strategies you're using");
  }
  
  if (transcript.length < 100) {
    insights.push("Try to explain your thought process in more detail");
  }
  
  if (strategyWords.includes('plan') || strategyWords.includes('planning')) {
    insights.push("Great job showing planning strategies!");
  }
  
  if (strategyWords.includes('check') || strategyWords.includes('verify')) {
    insights.push("Excellent self-monitoring behavior detected");
  }
  
  if (!strategyWords.some(w => ['evaluate', 'assess', 'reflect'].includes(w))) {
    insights.push("Consider reflecting on whether your approach is working");
  }
  
  return insights;
}