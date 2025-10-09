import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportRequest {
  source_url?: string;
  content_type?: string;
  filters?: {
    subject_area?: string;
    grade_level?: string;
    difficulty_level?: string;
  };
}

interface YouTubeContent {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  subject_area?: string;
  grade_level?: string;
  difficulty_level?: string;
  transcript?: string;
  ai_summary?: string;
  ai_key_points?: string[];
  ai_quiz_questions?: {
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  }[];
    options?: any;
    correct_answer?: string;
    explanation?: string;
    difficulty_level?: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const body: ImportRequest = await req.json();
      console.log('Import request received:', body);

      // Create import log entry
      const { data: importLog, error: logError } = await supabase
        .from('content_import_logs')
        .insert({
          import_source: body.source_url || 'Study Rays Network',
          status: 'in_progress',
          total_items: 0,
          processed_items: 0,
          successful_imports: 0,
          failed_imports: 0
        })
        .select()
        .single();

      if (logError) {
        console.error('Error creating import log:', logError);
        return new Response(
          JSON.stringify({ error: 'Failed to create import log' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Import log created:', importLog.id);

      // Start background import process (no await, runs in background)
      Promise.resolve().then(() => performContentImport(supabase, importLog.id, body));

      return new Response(
        JSON.stringify({ 
          message: 'Import started successfully',
          import_id: importLog.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET request - return import status
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const importId = url.searchParams.get('import_id');

      if (importId) {
        const { data: importLog, error } = await supabase
          .from('content_import_logs')
          .select('*')
          .eq('id', importId)
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Import log not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(importLog),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return all recent import logs
      const { data: importLogs, error } = await supabase
        .from('content_import_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch import logs' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(importLogs),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in content import function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function performContentImport(supabase: any, importLogId: string, request: ImportRequest) {
  try {
    console.log('Starting content import for log ID:', importLogId);

    // Update import status
    await supabase
      .from('content_import_logs')
      .update({ status: 'in_progress' })
      .eq('id', importLogId);

    // Fetch content from YouTube
    const content = await fetchYouTubeContent(request);
    
    console.log(`Fetched ${content.length} videos from YouTube`);

    // Update total items count
    await supabase
      .from('content_import_logs')
      .update({ total_items: content.length })
      .eq('id', importLogId);

    let successfulImports = 0;
    let failedImports = 0;
    const errors: string[] = [];

    // Process each content item
    for (let i = 0; i < content.length; i++) {
      const item = content[i];
      
      try {
        await importContentItem(supabase, item);
        successfulImports++;
        console.log(`Successfully imported item ${i + 1}/${content.length}: ${item.title}`);
      } catch (error) {
        failedImports++;
        const errorMsg = `Failed to import "${item.title}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }

      // Update progress
      await supabase
        .from('content_import_logs')
        .update({ 
          processed_items: i + 1,
          successful_imports: successfulImports,
          failed_imports: failedImports
        })
        .eq('id', importLogId);
    }

    // Mark import as completed
    await supabase
      .from('content_import_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        error_details: errors.length > 0 ? { errors } : null
      })
      .eq('id', importLogId);

    console.log(`Import completed. Success: ${successfulImports}, Failed: ${failedImports}`);

  } catch (error) {
    console.error('Import failed:', error);
    
    // Mark import as failed
    await supabase
      .from('content_import_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      .eq('id', importLogId);
  }
}

async function fetchStudyRaysContent(request: ImportRequest): Promise<StudyRaysContent[]> {
  // For now, return mock data since we don't have the actual Study Rays API details
  // This should be replaced with actual API calls once we have the correct endpoints
  
  console.log('Fetching content with filters:', request.filters);
  
  // Mock data representing Study Rays Network content
  const mockContent: StudyRaysContent[] = [
    {
      id: 'sr_math_001',
      title: 'Basic Algebra Concepts',
      description: 'Introduction to algebraic expressions and equations',
      content_type: 'lesson',
      subject_area: 'Mathematics',
      grade_level: '8th Grade',
      difficulty_level: 'beginner',
      content_data: {
        objectives: ['Understand variables', 'Solve linear equations', 'Work with algebraic expressions'],
        duration: '45 minutes',
        materials: ['Calculator', 'Worksheets']
      },
      tags: ['algebra', 'mathematics', 'equations'],
      questions: [
        {
          question_text: 'What is the value of x in the equation 2x + 5 = 13?',
          question_type: 'multiple_choice',
          options: { a: '3', b: '4', c: '5', d: '6' },
          correct_answer: 'b',
          explanation: '2x = 13 - 5 = 8, so x = 4',
          difficulty_level: 'medium'
        }
      ]
    },
    {
      id: 'sr_sci_001',
      title: 'Photosynthesis Process',
      description: 'Understanding how plants make their own food',
      content_type: 'article',
      subject_area: 'Science',
      grade_level: '7th Grade',
      difficulty_level: 'intermediate',
      content_data: {
        sections: ['Introduction', 'Light Reactions', 'Calvin Cycle', 'Importance'],
        diagrams: ['chloroplast_structure.png', 'photosynthesis_equation.png']
      },
      tags: ['biology', 'plants', 'photosynthesis'],
      questions: [
        {
          question_text: 'What are the main products of photosynthesis?',
          question_type: 'multiple_choice',
          options: { 
            a: 'Carbon dioxide and water', 
            b: 'Glucose and oxygen', 
            c: 'Nitrogen and carbon', 
            d: 'Water and sunlight' 
          },
          correct_answer: 'b',
          explanation: 'Photosynthesis produces glucose (sugar) and oxygen as main products',
          difficulty_level: 'easy'
        }
      ]
    },
    {
      id: 'sr_hist_001',
      title: 'Independence Movement of India',
      description: 'Key events and leaders in India\'s struggle for independence',
      content_type: 'course',
      subject_area: 'History',
      grade_level: '10th Grade',
      difficulty_level: 'intermediate',
      content_data: {
        chapters: [
          'Early Resistance Movements',
          'Gandhi and Non-Violence',
          'Quit India Movement',
          'Partition and Independence'
        ],
        timeline: '1857-1947',
        key_figures: ['Mahatma Gandhi', 'Jawaharlal Nehru', 'Subhas Chandra Bose']
      },
      tags: ['independence', 'gandhi', 'india', 'history'],
      questions: [
        {
          question_text: 'In which year did the Quit India Movement begin?',
          question_type: 'short_answer',
          correct_answer: '1942',
          explanation: 'The Quit India Movement was launched by Gandhi on August 8, 1942',
          difficulty_level: 'medium'
        }
      ]
    }
  ];

  // Apply filters if provided
  let filteredContent = mockContent;
  
  if (request.filters?.subject_area) {
    filteredContent = filteredContent.filter(item => 
      item.subject_area?.toLowerCase().includes(request.filters!.subject_area!.toLowerCase())
    );
  }
  
  if (request.filters?.grade_level) {
    filteredContent = filteredContent.filter(item => 
      item.grade_level?.toLowerCase().includes(request.filters!.grade_level!.toLowerCase())
    );
  }
  
  if (request.filters?.difficulty_level) {
    filteredContent = filteredContent.filter(item => 
      item.difficulty_level === request.filters!.difficulty_level
    );
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return filteredContent;
}

async function importContentItem(supabase: any, item: StudyRaysContent) {
  // Get or create category
  let categoryId = null;
  if (item.subject_area) {
    const { data: category } = await supabase
      .from('content_categories')
      .select('id')
      .ilike('name', `%${item.subject_area}%`)
      .single();
    
    categoryId = category?.id;
  }

  // Insert educational content
  const { data: contentData, error: contentError } = await supabase
    .from('educational_content')
    .insert({
      title: item.title,
      description: item.description,
      content_type: item.content_type,
      subject_area: item.subject_area,
      grade_level: item.grade_level,
      difficulty_level: item.difficulty_level,
      content_data: item.content_data,
      source_id: item.id,
      category_id: categoryId,
      tags: item.tags,
      source_url: 'Study Rays Network'
    })
    .select()
    .single();

  if (contentError) {
    throw new Error(`Failed to insert content: ${contentError.message}`);
  }

  // Insert questions if any
  if (item.questions && item.questions.length > 0) {
    const questionsToInsert = item.questions.map(question => ({
      content_id: contentData.id,
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      difficulty_level: question.difficulty_level
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Failed to insert questions:', questionsError);
      // Don't throw here, as content was successfully inserted
    }
  }

  return contentData;
}