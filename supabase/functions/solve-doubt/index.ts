import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_CONFIDENCE_THRESHOLD = 0.80; // Doubts with confidence < 0.80 are assigned to teachers

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

    // Generate AI response using OpenAI with confidence scoring
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

IMPORTANT: After providing your response, on a new line, add a confidence score rating your certainty in this response from 0.0 to 1.0 based on:
- Clarity of the student's question (well-defined vs vague)
- Complexity of the subject matter
- Your certainty in the explanation
- Whether this requires human teacher interaction

Format your final line as: "CONFIDENCE: 0.XX"

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
            content: 'You are an expert educational tutor who helps students understand concepts clearly and encouragingly. Always provide comprehensive explanations with examples and rate your confidence in your response.'
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
    const fullResponse = aiData.choices[0].message.content;

    // Extract confidence score from response
    const confidenceMatch = fullResponse.match(/CONFIDENCE:\s*(0?\.\d+|1\.0+)/i);
    const confidenceScore = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.75; // Default to 0.75 if not found
    
    // Remove confidence line from actual response
    const aiResponseText = fullResponse.replace(/\n*CONFIDENCE:\s*(0?\.\d+|1\.0+)\s*$/i, '').trim();

    console.log(`AI Confidence Score: ${confidenceScore}`);

    if (confidenceScore >= AI_CONFIDENCE_THRESHOLD) {
      // High confidence - save AI response and mark as solved
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

      // Update doubt status to 'resolved'
      await supabase
        .from('doubts')
        .update({ 
          status: 'resolved',
          ai_confidence_score: confidenceScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', doubtId);

      // Send Telegram notification if chat_id exists
      if (doubt.telegram_chat_id) {
        try {
          await supabase.functions.invoke('send-telegram-notification', {
            body: {
              chatId: doubt.telegram_chat_id,
              message: `✅ *Your doubt has been solved!*\n\n*Question:* ${doubt.title}\n\n*Answer:*\n${aiResponseText}\n\n_Confidence: ${(confidenceScore * 100).toFixed(0)}%_`,
              parseMode: 'Markdown'
            }
          });
        } catch (notifError) {
          console.error('Failed to send Telegram notification:', notifError);
          // Don't fail the whole operation if notification fails
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'AI solution generated successfully (high confidence)',
          response: savedResponse,
          confidence: confidenceScore,
          escalated: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Low confidence - assign to teacher
      console.log('Low confidence - escalating to teacher');

      // Find best available teacher based on subject expertise and workload
      const teacherId = await findBestTeacher(supabase, doubt.subject_area);

      if (!teacherId) {
        // No teachers available - save AI response but mark for review
        const { data: savedResponse, error: saveError } = await supabase
          .from('doubt_responses')
          .insert({
            doubt_id: doubtId,
            response_text: `${aiResponseText}\n\n⚠️ _Note: This response has lower confidence (${(confidenceScore * 100).toFixed(0)}%). A teacher will review it soon._`,
            response_type: 'ai',
            is_solution: false,
          })
          .select()
          .single();

        await supabase
          .from('doubts')
          .update({ 
            status: 'in_progress',
            ai_confidence_score: confidenceScore,
            escalated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', doubtId);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Low confidence - no teachers available, marked for review',
            response: savedResponse,
            confidence: confidenceScore,
            escalated: true,
            assigned_teacher: null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Assign to teacher
      await supabase
        .from('doubts')
        .update({ 
          status: 'in_progress',
          assigned_to: teacherId,
          ai_confidence_score: confidenceScore,
          escalated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', doubtId);

      // Save AI's preliminary response for teacher reference
      await supabase
        .from('doubt_responses')
        .insert({
          doubt_id: doubtId,
          response_text: `_[Preliminary AI Response - Confidence: ${(confidenceScore * 100).toFixed(0)}%]_\n\n${aiResponseText}`,
          response_type: 'ai',
          is_solution: false,
        });

      // Notify student via Telegram
      if (doubt.telegram_chat_id) {
        try {
          await supabase.functions.invoke('send-telegram-notification', {
            body: {
              chatId: doubt.telegram_chat_id,
              message: `📚 *Your doubt is being reviewed by a teacher*\n\n*Question:* ${doubt.title}\n\nYour doubt requires expert attention and has been assigned to a teacher. You'll receive a detailed response soon! 👨‍🏫`,
              parseMode: 'Markdown'
            }
          });
        } catch (notifError) {
          console.error('Failed to send Telegram notification:', notifError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Low confidence - assigned to teacher',
          confidence: confidenceScore,
          escalated: true,
          assigned_teacher: teacherId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error in solve-doubt function:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate solution',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function findBestTeacher(supabase: any, subjectArea: string | null): Promise<string | null> {
  try {
    // Get all teachers with their profiles
    const { data: teachers } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        profiles!inner(id, name),
        teacher_profiles(subjects)
      `)
      .eq('role', 'teacher');

    if (!teachers || teachers.length === 0) {
      return null;
    }

    // Filter by subject expertise if subject is specified
    let eligibleTeachers = teachers;
    if (subjectArea) {
      eligibleTeachers = teachers.filter((teacher: any) => {
        const subjects = teacher.teacher_profiles?.subjects || [];
        return subjects.some((s: string) => 
          s.toLowerCase().includes(subjectArea.toLowerCase()) ||
          subjectArea.toLowerCase().includes(s.toLowerCase())
        );
      });

      // If no teachers match the subject, fall back to all teachers
      if (eligibleTeachers.length === 0) {
        eligibleTeachers = teachers;
      }
    }

    // Calculate workload for each teacher (count of open assigned doubts)
    const teacherWorkloads = await Promise.all(
      eligibleTeachers.map(async (teacher: any) => {
        const { count } = await supabase
          .from('doubts')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_to', teacher.user_id)
          .in('status', ['open', 'in_progress']);

        return {
          teacherId: teacher.user_id,
          workload: count || 0
        };
      })
    );

    // Sort by workload (ascending) and return teacher with lowest workload
    teacherWorkloads.sort((a, b) => a.workload - b.workload);
    
    return teacherWorkloads[0]?.teacherId || null;

  } catch (error) {
    console.error('Error finding best teacher:', error);
    return null;
  }
}
