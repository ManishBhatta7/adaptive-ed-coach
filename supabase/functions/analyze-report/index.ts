
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

  // Ensure only POST requests are handled
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    console.log('Initializing Supabase client')
    console.log('URL available:', !!supabaseUrl)
    console.log('Service key available:', !!supabaseServiceKey)
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get JWT token from request headers
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header:', authHeader)
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extract and verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    console.log('Token received, verifying user...')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User verification error:', userError)
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log('User verified:', user.id)

    // Initialize OpenAI API
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      console.error('OpenAI API key not configured')
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const configuration = new Configuration({
      apiKey: openAiKey,
    })
    const openai = new OpenAIApi(configuration)

    // Parse the incoming file
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate user ID
    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: 'User ID mismatch' }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Ensure the storage bucket exists
    console.log('Checking if bucket exists...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError)
    }
    
    const bucketExists = buckets?.some(b => b.name === 'student-documents')
    
    if (!bucketExists) {
      console.log('Bucket does not exist, creating...')
      const { error: createBucketError } = await supabase.storage.createBucket('student-documents', {
        public: true
      })
      
      if (createBucketError) {
        console.error('Create bucket error:', createBucketError)
        // Continue execution - we'll handle missing bucket in the upload logic
      } else {
        console.log('Bucket created successfully')
      }
    } else {
      console.log('Bucket already exists')
    }

    // Store file in Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const fileName = `${userId}_${Date.now()}_${file.name}`
    const filePath = `report-cards/${fileName}`

    console.log(`Uploading file to ${filePath}`)
    const { error: uploadError } = await supabase.storage
      .from('student-documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      
      // Fallback to using simulated data if we can't upload the file
      console.log('Using fallback data since upload failed')
      const fallbackResult = generateFallbackAnalysis(userId, 'Upload failed')
      
      return new Response(JSON.stringify(fallbackResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('student-documents')
      .getPublicUrl(filePath)
      
    console.log('File uploaded, public URL:', publicUrl)

    // Convert file to base64 for OpenAI Vision API
    const base64Image = btoa(
      String.fromCharCode(...new Uint8Array(fileBuffer))
    )

    // Analyze image with OpenAI Vision API
    try {
      console.log('Sending to OpenAI for analysis...')
      const response = await openai.createChatCompletion({
        model: "gpt-4-vision-preview",
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

      // Enhance the analysis with recommendations based on extracted data
      analysisResult.recommendations = generateRecommendations(analysisResult)
      
      // Store analysis results in the database
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
        // If the table doesn't exist, we'll still return the analysis
        console.log('Continuing despite database error - will return analysis to user')
      }

      return new Response(JSON.stringify({
        ...analysisResult,
        reportUrl: publicUrl
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (aiError) {
      console.error('AI processing error:', aiError)
      
      // If AI fails, return a more basic analysis as fallback
      const fallbackResult = generateFallbackAnalysis(userId, publicUrl)
      
      return new Response(JSON.stringify(fallbackResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
  } catch (error) {
    console.error('General error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Function to generate recommendations based on analysis
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

// Function to generate a fallback analysis when AI processing fails
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
