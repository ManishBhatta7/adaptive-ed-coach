import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL_NAME = 'gemini-2.0-flash-lite';
const API_VERSION = 'v1beta';

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Setup & Validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
      throw new Error('Server Config Error: Missing Keys');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Auth Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) throw new Error('Unauthorized: Invalid token');

    // 4. Handle File Upload
    let formData;
    try {
      formData = await req.formData();
    } catch (e) {
      throw new Error('Invalid request: Expected FormData with a file.');
    }

    const file = formData.get('file');
    const userId = formData.get('userId');

    if (!file || !(file instanceof File)) throw new Error('No file uploaded');
    if (!userId) throw new Error('User ID is required');

    // 5. Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    // Sanitize filename to prevent issues
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${userId}_${Date.now()}_${safeName}`;
    const filePath = `report-cards/${fileName}`;

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find((b: any) => b.name === 'student-documents')) {
      await supabase.storage.createBucket('student-documents', { public: true });
    }

    const { error: uploadError } = await supabase.storage
      .from('student-documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('student-documents')
      .getPublicUrl(filePath);

    // 6. Analyze with Gemini Vision
    // FIX: Use standard library encodeBase64 to avoid stack overflow on large files
    const base64Image = encodeBase64(fileBuffer);
    
    // UPDATED PROMPT: Requesting actionable insights & explicit RetainLearn persona
    const prompt = `
      You are RetainLearn AI, an expert academic counselor. Analyze this report card image.
      
      Extract the data into this EXACT JSON structure:
      {
        "studentName": "string or null",
        "schoolName": "string or null",
        "gradeLevel": "string or null",
        "gpa": "string or null",
        "subjects": {
          "Subject Name": {
            "score": number,
            "letterGrade": "string",
            "comments": "string"
          }
        },
        "overallAssessment": "string (A short encouraging summary)",
        "areasOfStrength": ["string"],
        "areasNeedingImprovement": ["string"],
        "actionableInsights": ["string (Specific, practical steps to improve weak areas)"],
        "recommendedFocusAreas": ["string (Topics to prioritize)"]
      }
      If a field is not found, use null. Do not use markdown formatting.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/${API_VERSION}/models/${MODEL_NAME}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: file.type || 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${errText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    let analysisResult;
    try {
      analysisResult = JSON.parse(resultText);
    } catch (e) {
      console.error("JSON Parse Error:", resultText);
      analysisResult = { error: "Failed to parse AI response", raw: resultText };
    }

    // Add local recommendations if AI missed them
    if (!analysisResult.actionableInsights || analysisResult.actionableInsights.length === 0) {
      analysisResult.actionableInsights = generateFallbackInsights(analysisResult);
    }

    // 7. Save to Database
    const { error: dbError } = await supabase.from('report_analyses').insert({
      user_id: userId,
      report_url: publicUrl,
      analysis_results: analysisResult,
      created_at: new Date().toISOString()
    });
    
    if (dbError) console.error("DB Insert Error:", dbError);

    return new Response(JSON.stringify({
      ...analysisResult,
      reportUrl: publicUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateFallbackInsights(data: any) {
  const insights = [];
  if (data.subjects) {
    Object.entries(data.subjects).forEach(([sub, details]: [string, any]) => {
      const score = Number(details.score);
      if (!isNaN(score) && score < 75) {
        insights.push(`Dedicate 20 mins/day to ${sub} practice problems.`);
      }
    });
  }
  if (insights.length === 0) insights.push("Maintain your current study schedule and help peers.");
  return insights;
}