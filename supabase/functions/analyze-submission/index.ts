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
    const { submissionId, content, subject, assignmentType } = await req.json();

    if (!content) {
      throw new Error('Content is required for analysis');
    }

    // Get API keys
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!geminiApiKey && !openaiApiKey) {
      throw new Error('No AI API key configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Analyzing submission:', { submissionId, subject, assignmentType });

    // Prepare analysis prompt based on assignment type
    let analysisPrompt = '';
    
    if (assignmentType === 'essay') {
      analysisPrompt = `Analyze this essay submission and provide detailed feedback:

Content: ${content}
Subject: ${subject || 'General'}

Please provide:
1. Overall assessment and score (0-100)
2. Strengths in writing and argumentation
3. Areas for improvement
4. Specific suggestions for enhancement
5. Grammar and style feedback
6. Structure and organization comments

Format as JSON with keys: score, strengths, improvements, suggestions, grammar, structure, overall_feedback`;

    } else if (assignmentType === 'answer_sheet') {
      analysisPrompt = `Analyze this answer sheet submission:

Content: ${content}
Subject: ${subject || 'General'}

Please provide:
1. Accuracy assessment and score (0-100)
2. Correct concepts identified
3. Misconceptions or errors
4. Completeness of the answer
5. Specific suggestions for improvement
6. Additional concepts to study

Format as JSON with keys: score, correct_concepts, errors, completeness, suggestions, study_recommendations, overall_feedback`;

    } else {
      analysisPrompt = `Analyze this student submission:

Content: ${content}
Subject: ${subject || 'General'}
Type: ${assignmentType}

Please provide constructive educational feedback including:
1. Overall score (0-100) 
2. Key strengths demonstrated
3. Areas needing improvement
4. Specific actionable suggestions
5. Encouragement and next steps

Format as JSON with keys: score, strengths, improvements, suggestions, encouragement, overall_feedback`;
    }

    let analysisResult;

    // Try OpenAI first (usually better for analysis)
    if (openaiApiKey) {
      try {
        console.log('Using OpenAI for analysis');
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            messages: [
              {
                role: 'system',
                content: 'You are an expert educational assessor. Provide detailed, constructive feedback that helps students learn and improve. Always be encouraging while being honest about areas for growth.'
              },
              {
                role: 'user',
                content: analysisPrompt
              }
            ],
            max_completion_tokens: 1000,
            temperature: 0.3
          }),
        });

        if (!openaiResponse.ok) {
          throw new Error('OpenAI API failed');
        }

        const openaiData = await openaiResponse.json();
        const feedbackText = openaiData.choices[0].message.content;
        
        // Try to parse as JSON, fallback to structured text
        try {
          analysisResult = JSON.parse(feedbackText);
        } catch {
          analysisResult = {
            score: 75,
            overall_feedback: feedbackText,
            strengths: ['Submission received and analyzed'],
            improvements: ['Continue practicing and learning'],
            suggestions: ['Review feedback carefully']
          };
        }

        console.log('OpenAI analysis completed');
        
      } catch (error) {
        console.error('OpenAI failed:', error instanceof Error ? error.message : 'Unknown error');
        
        if (!geminiApiKey) {
          throw new Error('OpenAI failed and no Gemini backup available');
        }
      }
    }

    // Fallback to Gemini if OpenAI failed or not available
    if (!analysisResult && geminiApiKey) {
      console.log('Using Gemini for analysis');
      
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: analysisPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!geminiResponse.ok) {
        throw new Error('Gemini API failed');
      }

      const geminiData = await geminiResponse.json();
      const feedbackText = geminiData.candidates[0].content.parts[0].text;
      
      // Try to parse as JSON, fallback to structured text
      try {
        analysisResult = JSON.parse(feedbackText);
      } catch {
        analysisResult = {
          score: 75,
          overall_feedback: feedbackText,
          strengths: ['Submission received and analyzed'],
          improvements: ['Continue practicing and learning'],  
          suggestions: ['Review feedback carefully']
        };
      }

      console.log('Gemini analysis completed');
    }

    // Update submission in database if submissionId provided
    if (submissionId && analysisResult) {
      console.log('Updating submission with feedback');
      
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          ai_feedback: analysisResult,
          score: analysisResult.score || 0,
          processed_at: new Date().toISOString(),
          status: 'processed'
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('Error updating submission:', updateError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult,
      submissionId: submissionId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in analyze-submission function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});