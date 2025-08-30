import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const aiPrompt = `
You are an AI designed to analyze student report cards. Extract the following information:
- Student's full name
- School name
- Grade level
- Term/semester
- GPA (if available)
- List of subjects with their scores and letter grades
- Teacher comments for each subject (if available)
- Overall assessment
- Areas of strength
- Areas needing improvement

Format the response as a JSON object with these fields. If you cannot find certain information, include the field with null or an empty value.
`

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = getSupabaseClient()
    if (!supabase) {
      return errorResponse('Supabase credentials are not configured', 500)
    }

    // Get JWT token from request headers and verify
    const token = getAuthToken(req)
    if (!token.ok) return errorResponse(token.error!, 401)
    const { user, error: userError } = await getUserFromToken(supabase, token.value!)
    if (userError || !user) {
      return errorResponse('Unauthorized: Invalid token', 401)
    }

    // Initialize OpenAI API
    const openai = getOpenAiClient()
    if (!openai) {
      return errorResponse('OpenAI API key not configured', 500)
    }

    // Parse the incoming file and userId
    const { file, userId, reqError } = await extractFileAndUserId(req)
    if (reqError) return errorResponse(reqError, 400)
    if (userId !== user.id) return errorResponse('User ID mismatch', 403)

    // Ensure the storage bucket exists
    const bucketStatus = await ensureStudentBucket(supabase)
    if (!bucketStatus.ok && bucketStatus.fatal) {
      return errorResponse(bucketStatus.error || 'Bucket creation error', 500)
    }

    // Store file in Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const fileName = `${userId}_${Date.now()}_${file.name}`
    const filePath = `report-cards/${fileName}`
    const uploadResult = await uploadReportImage(supabase, fileBuffer, file, filePath)
    if (!uploadResult.ok) {
      // Fallback to simulated data if upload fails
      const fallbackResult = generateFallbackAnalysis(userId, 'Upload failed')
      return successJsonResponse(fallbackResult)
    }
    const publicUrl = getPublicUrl(supabase, filePath)

    // Convert file to base64 for OpenAI Vision API
    const base64Image = toBase64(fileBuffer)

    // Analyze image with OpenAI Vision API
    try {
      const analysisResult = await analyzeWithAI(openai, file, base64Image)
      // Enhance with recommendations
      analysisResult.recommendations = generateRecommendations(analysisResult)
      // Store analysis results in the database
      await insertAnalysisDb(supabase, userId, publicUrl, analysisResult)
      return successJsonResponse({
        ...analysisResult,
        reportUrl: publicUrl
      })
    } catch (aiError) {
      // If AI fails, return a more basic analysis as fallback
      const fallbackResult = generateFallbackAnalysis(userId, publicUrl)
      return successJsonResponse(fallbackResult)
    }
  } catch (error) {
    console.error('General error:', error)
    return errorResponse(error.message, 500)
  }
})

// --- Helper functions below ---

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

function getOpenAiClient() {
  const openAiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openAiKey) return null
  const configuration = new Configuration({ apiKey: openAiKey })
  return new OpenAIApi(configuration)
}

function getAuthToken(req: Request): { ok: true, value: string } | { ok: false, error: string } {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, error: 'Missing or invalid authorization header' }
  }
  return { ok: true, value: authHeader.replace('Bearer ', '') }
}

async function getUserFromToken(supabase: any, token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  return { user, error }
}

async function extractFileAndUserId(req: Request): Promise<{
  file?: File,
  userId?: string,
  reqError?: string
}> {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    if (!file) return { reqError: 'No file uploaded' }
    if (!userId) return { reqError: 'User ID is required' }
    return { file, userId }
  } catch (e) {
    return { reqError: 'Malformed request' }
  }
}

async function ensureStudentBucket(supabase: any): Promise<{ ok: boolean, error?: string, fatal?: boolean }> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    if (error) {
      console.error('Error listing buckets:', error)
      return { ok: false, error: error.message, fatal: false }
    }
    const bucketExists = buckets?.some((b: any) => b.name === 'student-documents')
    if (bucketExists) return { ok: true }
    // Try to create
    const { error: createBucketError } = await supabase.storage.createBucket('student-documents', { public: true })
    if (createBucketError) {
      console.error('Create bucket error:', createBucketError)
      return { ok: false, error: createBucketError.message, fatal: false }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message || 'Unknown bucket error', fatal: true }
  }
}

async function uploadReportImage(supabase: any, fileBuffer: ArrayBuffer, file: File, filePath: string) {
  const { error: uploadError } = await supabase.storage
    .from('student-documents')
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      cacheControl: '3600',
    })
  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return { ok: false, error: uploadError.message }
  }
  return { ok: true }
}

function getPublicUrl(supabase: any, filePath: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from('student-documents')
    .getPublicUrl(filePath)
  return publicUrl
}

function toBase64(buffer: ArrayBuffer): string {
  return btoa(
    String.fromCharCode(...new Uint8Array(buffer))
  )
}

async function analyzeWithAI(openai: any, file: File, base64Image: string) {
  const response = await openai.createChatCompletion({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: aiPrompt
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this report card and extract the information described in my system prompt."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${file.type};base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1500
  })

  // Parse the AI response
  let analysisResult
  try {
    const aiResponseText = response.data.choices[0].message?.content || '{}'
    // Extract JSON from the response (the AI might wrap it in markdown)
    const jsonMatch = aiResponseText.match(/```json\n([\s\S]*?)\n```/) ||
                      aiResponseText.match(/```\n([\s\S]*?)\n```/) ||
                      [null, aiResponseText]
    const jsonText = jsonMatch[1] || aiResponseText
    analysisResult = JSON.parse(jsonText.trim())
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError)
    analysisResult = {
      error: 'Failed to parse AI analysis',
      studentName: 'Unknown',
      schoolName: 'Unknown',
      subjects: {}
    }
  }
  return analysisResult
}

async function insertAnalysisDb(supabase: any, userId: string, publicUrl: string, analysisResult: any) {
  const { error: dbError } = await supabase
    .from('report_analyses')
    .insert({
      user_id: userId,
      report_url: publicUrl,
      analysis_results: analysisResult,
      created_at: new Date().toISOString()
    })
  if (dbError) {
    console.error('Database insert error:', dbError)
  }
}

// --- Response & Helper composition functions ---

function successJsonResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// --- Recommendation and fallback logic (unchanged, clear helpers) ---

function generateRecommendations(analysisData: any) {
  const recommendations = []
  let weakestSubject = null
  let weakestScore = 100

  // Find the weakest subject
  if (analysisData.subjects) {
    for (const [subject, data] of Object.entries(analysisData.subjects)) {
      const score = (data as any).score
      if (score && typeof score === 'number' && score < weakestScore) {
        weakestScore = score
        weakestSubject = subject
      }
    }
  }

  if (weakestSubject) {
    recommendations.push(`Focus on improving your ${weakestSubject} skills with dedicated study time`)
  }

  // Add general recommendations
  recommendations.push('Set up a regular study schedule for all subjects')
  recommendations.push('Consider using AI-powered tutoring for challenging topics')
  recommendations.push('Track your progress with our analytics tools')

  return recommendations
}

function generateFallbackAnalysis(userId: string, reportUrl: string) {
  return {
    studentName: 'Student Name (AI extraction failed)',
    schoolName: 'School Name (AI extraction failed)',
    grade: 'Grade Level',
    term: 'Current Term',
    gpa: 'N/A',
    subjects: {
      Mathematics: {
        score: Math.floor(Math.random() * 30) + 70,
        letterGrade: 'B',
        comments: 'AI extraction failed, please try uploading a clearer image.'
      },
      Science: {
        score: Math.floor(Math.random() * 30) + 70,
        letterGrade: 'B+',
        comments: 'AI extraction failed, please try uploading a clearer image.'
      }
    },
    recommendations: [
      'Try uploading a clearer image of your report card',
      'Make sure all text in the report is clearly visible',
      'Consider manually entering your grades for more accurate analysis'
    ],
    reportUrl: reportUrl,
    note: 'AI processing failed. This is a fallback analysis.'
  }
}
