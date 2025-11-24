
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
    // UPDATED: Now accepting 'question' and 'modelAnswer'
    const { submissionId, content, subject, assignmentType, question, modelAnswer } = await req.json();

    if (!content) {
      throw new Error('Content is required for analysis');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!geminiApiKey && !openaiApiKey) {
      throw new Error('No AI API key configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Analyzing submission:', { submissionId, subject, assignmentType });

    let analysisPrompt = '';
    
    if (assignmentType === 'answer_sheet') {
      // UPDATED: New Prompt for Line-by-Line Contextual Feedback
      analysisPrompt = `You are a strict academic grader. Compare the Student's Answer against the Model Answer line-by-line.

      ---
      CONTEXT:
      Question: ${question || 'General Request'}
      
      MODEL / CORRECT ANSWER:
      ${modelAnswer || 'Evaluate based on standard academic accuracy.'}
      
      STUDENT ANSWER:
      ${content}
      ---
      
      TASK:
      1. Compare the student's specific claims against the model answer.
      2. Provide "Line-by-Line" feedback: Quote the student's error and correct it immediately.
      3. Assign a score (0-100) based on how many key points from the model answer were hit.
      
      Format as JSON with keys: 
      - score (number)
      - line_by_line_feedback (array of strings, e.g. "Line 1: You said X, but the correct value is Y")
      - missing_concepts (array of strings)
      - overall_feedback (string)
      - strengths (array of strings)
      - improvements (array of strings)`;

    } else {
        // Keep existing logic for essays/others
        analysisPrompt = `Analyze this student submission:
        Content: ${content}
        Subject: ${subject || 'General'}
        Type: ${assignmentType}
        
        Format as JSON with keys: score, strengths, improvements, suggestions, encouragement, overall_feedback`;
    }

    let analysisResult;

    // ... (Keep existing OpenAI/Gemini Fetch Logic but use the new 'analysisPrompt') ...
    // For brevity, reusing your existing fetch logic block here
    
    if (openaiApiKey) {
        // ... existing OpenAI fetch code ...
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gpt-4o', // Use a smart model for logic
                messages: [
                    { role: 'system', content: 'You are an expert educational assessor. Return strictly valid JSON.' },
                    { role: 'user', content: analysisPrompt }
                ],
                temperature: 0.2 // Lower temperature for strict grading
            }),
        });
        // ... handle response ...
        const data = await openaiResponse.json();
        const text = data.choices[0].message.content;
        // Clean potential markdown code blocks
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');
        analysisResult = JSON.parse(jsonStr);
    } 
    else if (geminiApiKey) {
        // ... existing Gemini fetch code ...
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: analysisPrompt }] }]
            })
        });
        const data = await geminiResponse.json();
        const text = data.candidates[0].content.parts[0].text;
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');
        analysisResult = JSON.parse(jsonStr);
    }

    // ... (Keep existing Database Update Logic) ...
    if (submissionId && analysisResult) {
      await supabase.from('submissions').update({
          ai_feedback: analysisResult,
          score: analysisResult.score || 0,
          processed_at: new Date().toISOString(),
          status: 'processed'
        }).eq('id', submissionId);
    }

    return new Response(JSON.stringify({ success: true, analysis: analysisResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});