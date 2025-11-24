import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL_NAME = 'gemini-2.0-flash-lite';
const API_VERSION = 'v1beta';

// === HELPER: STREAMING UPLOAD ===
async function uploadToGemini(fileUrl: string, apiKey: string) {
  console.log(`[Stream] Downloading: ${fileUrl}`);
  
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) throw new Error(`Failed to fetch file: ${fileRes.statusText}`);
  
  const contentLength = fileRes.headers.get('content-length');
  let mimeType = fileRes.headers.get('content-type') || 'application/octet-stream';
  
  const lowerUrl = fileUrl.toLowerCase();
  if (lowerUrl.endsWith('.pdf')) mimeType = 'application/pdf';
  else if (lowerUrl.endsWith('.png')) mimeType = 'image/png';
  else if (lowerUrl.match(/\.jpe?g$/)) mimeType = 'image/jpeg';

  console.log(`[Stream] Uploading ${contentLength} bytes (${mimeType}) to Google...`);

  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
  
  const googleRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'raw',
      'X-Goog-Upload-Command': 'start, upload, finalize',
      'X-Goog-Upload-Header-Content-Length': contentLength || '',
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': mimeType, 
    },
    body: fileRes.body
  });

  if (!googleRes.ok) {
    const errText = await googleRes.text();
    throw new Error(`Gemini File API Error: ${errText}`);
  }

  const json = await googleRes.json();
  return { file_data: { mime_type: mimeType, file_uri: json.file.uri } };
}

// Retry Logic
async function generateWithRetry(url: string, options: any, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        if (i === retries) return res;
        console.warn(`Quota Hit. Waiting 2s...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      return res;
    } catch (e) { if (i === retries) throw e; }
  }
  throw new Error("Retry failed");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { submissionId, questionPaperUrl, markingSchemeUrl, fileUrl } = await req.json();

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY is missing');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`[Analyze] Processing Submission: ${submissionId}`);

    const contentParts = [];

    // === 1. "TUTOR-STYLE" PROMPT ===
    contentParts.push({ text: `
      You are an encouraging but strict academic tutor.
      
      DOCUMENTS PROVIDED:
      1. Student Answer Sheet
      2. Question Paper
      3. Marking Scheme / Rubric
      
      YOUR TASK:
      Analyze every single question attempted by the student.
      
      GRADING RULES:
      1. **Per-Question Check:** Compare student's answer vs. Marking Scheme.
      2. **Encouragement:** For correct answers, explicitly praise the specific concept they understood (e.g., "Q1: Great job applying Newton's Second Law correctly.").
      3. **Constructive Feedback:** For incorrect answers, explain the gap without being mean (e.g., "Q3: You identified the formula but forgot the negative sign.").
      4. **Vague Answer Penalty:** If the student writes generic fluff, deduct marks.
      
      OUTPUT REQUIREMENTS:
      - "line_by_line_feedback": Must list EVERY question attempted (e.g., "Q1: Correct... Q2: Partial...").
      - "strengths": List the specific topics/skills the student has mastered based on their CORRECT answers.
      - "improvements": For every INCORRECT answer, map it to a specific "Action Item" (e.g., "Review Chapter 4 (Thermodynamics) to understand entropy better.").
      - "overall_feedback": Start with encouragement ("Good effort!"), summarize the performance, and end with a "Steps Going Forward" section.
      
      OUTPUT SCHEMA (JSON ONLY):
      {
        "score": number, // 0-100
        "line_by_line_feedback": ["string"],
        "missing_concepts": ["string"],
        "overall_feedback": "string",
        "strengths": ["string"],
        "improvements": ["string"]
      }
    `});

    // A. Student File
    if (fileUrl) {
      contentParts.push({ text: "--- STUDENT ANSWER SHEET ---" });
      contentParts.push(await uploadToGemini(fileUrl, geminiApiKey));
    } else {
      throw new Error("No student file provided.");
    }

    // B. Context Files
    if (questionPaperUrl) {
      contentParts.push({ text: "--- QUESTION PAPER ---" });
      contentParts.push(await uploadToGemini(questionPaperUrl, geminiApiKey));
    }

    if (markingSchemeUrl) {
      contentParts.push({ text: "--- MARKING SCHEME ---" });
      contentParts.push(await uploadToGemini(markingSchemeUrl, geminiApiKey));
    }

    // === 2. CALL GEMINI ===
    console.log(`[Analyze] Sending parts to ${MODEL_NAME}...`);
    
    const generateUrl = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${MODEL_NAME}:generateContent?key=${geminiApiKey}`;
    
    const geminiRes = await generateWithRetry(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: contentParts }],
        generationConfig: {
          responseMimeType: "application/json", 
          temperature: 0.0, // Strict for grading
          maxOutputTokens: 8192,
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      if (geminiRes.status === 429) throw new Error("Quota Exceeded. Please try again later.");
      throw new Error(`AI Error: ${errText}`);
    }

    const aiData = await geminiRes.json();
    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) throw new Error("AI returned empty response.");

    // === 3. PARSE JSON ===
    let result;
    try {
      result = JSON.parse(rawText);
    } catch (e) {
      console.error("JSON Parse Fail. Raw Text:", rawText);
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         result = JSON.parse(jsonMatch[0]);
      } else {
         throw new Error(`Failed to parse AI Output: ${rawText.substring(0, 100)}...`);
      }
    }

    // === 4. SAVE ===
    if (submissionId) {
      await supabase.from('submissions').update({
        ai_feedback: result,
        score: result.score,
        processed_at: new Date().toISOString(),
        status: 'processed'
      }).eq('id', submissionId);
    }

    return new Response(JSON.stringify({ success: true, analysis: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Critical Error:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});