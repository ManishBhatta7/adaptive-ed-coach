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
    const { operation, data, context } = await req.json();

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result;

    switch (operation) {
      case 'analyze_progress':
        result = await analyzeStudentProgress(data, supabase, geminiApiKey);
        break;
        
      case 'generate_quiz':
        result = await generateQuiz(data, supabase, geminiApiKey);
        break;
        
      case 'create_study_material':
        result = await createStudyMaterial(data, geminiApiKey);
        break;
        
      case 'process_doubt':
        result = await processDoubt(data, supabase, geminiApiKey);
        break;
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return new Response(JSON.stringify({
      success: true,
      operation: operation,
      result: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in gemini-data-processor function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function analyzeStudentProgress(data: any, supabase: any, geminiApiKey: string) {
  const { student_id } = data;
  
  // Fetch student data
  const { data: doubts } = await supabase
    .from('doubts')
    .select('*')
    .eq('student_id', student_id);
    
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', student_id)
    .single();

  const prompt = `Analyze this student's progress:
  
Profile: ${JSON.stringify(profile)}
Doubts: ${JSON.stringify(doubts)}

Provide insights on:
1. Learning patterns
2. Subject strengths/weaknesses  
3. Recommendations for improvement
4. Personalized study plan

Return as structured JSON.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
    })
  });

  const result = await response.json();
  return result.candidates[0].content.parts[0].text;
}

async function generateQuiz(data: any, supabase: any, geminiApiKey: string) {
  const { subject, difficulty, topic } = data;
  
  const prompt = `Generate a quiz with 5 multiple choice questions about ${topic} in ${subject}.
  
Difficulty: ${difficulty}
  
Return as JSON with format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Why this is correct"
    }
  ]
}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 1024 }
    })
  });

  const result = await response.json();
  return result.candidates[0].content.parts[0].text;
}

async function createStudyMaterial(data: any, geminiApiKey: string) {
  const { topic, type, level } = data;
  
  const prompt = `Create ${type} study material for ${topic} at ${level} level.
  
Include:
- Key concepts
- Examples
- Practice exercises
- Memory aids

Format as structured content for easy reading.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    })
  });

  const result = await response.json();
  return result.candidates[0].content.parts[0].text;
}

async function processDoubt(data: any, supabase: any, geminiApiKey: string) {
  const { doubt_id, action } = data;
  
  const { data: doubt } = await supabase
    .from('doubts')
    .select('*')
    .eq('id', doubt_id)
    .single();

  if (!doubt) {
    throw new Error('Doubt not found');
  }

  const prompt = `Process this student doubt:
  
Title: ${doubt.title}
Description: ${doubt.description}
Subject: ${doubt.subject_area}
Difficulty: ${doubt.difficulty_level}

Action: ${action}

Provide a helpful, educational response that guides the student to understand the concept.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 1024 }
    })
  });

  const result = await response.json();
  return result.candidates[0].content.parts[0].text;
}