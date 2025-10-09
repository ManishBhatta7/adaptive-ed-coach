# YouTube Content Import Edge Function
This function will be replaced with a new implementation that uses the YouTube API. Here's what you need to do:

1. In your Supabase dashboard, create a new Edge Function called "import-youtube-content"

2. Copy this code into the function:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportRequest {
  source_url: string;
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
}

serve(async (req: Request) => {
  try {
    const { method } = req;
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (method === 'POST') {
      const body: ImportRequest = await req.json();
      
      // Extract video ID from URL
      const videoId = extractVideoId(body.source_url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Get video details from YouTube API
      const apiKey = Deno.env.get('YOUTUBE_API_KEY');
      if (!apiKey) {
        throw new Error('YouTube API key not configured');
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
      );
      
      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = data.items[0];
      const content: YouTubeContent = {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        video_url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail_url: video.snippet.thumbnails.high.url,
        subject_area: body.filters?.subject_area,
        grade_level: body.filters?.grade_level,
        difficulty_level: body.filters?.difficulty_level
      };

      // Save to database
      const { error } = await supabaseClient
        .from('content')
        .insert([{
          title: content.title,
          description: content.description,
          video_url: content.video_url,
          thumbnail_url: content.thumbnail_url,
          subject_area: content.subject_area,
          grade_level: content.grade_level,
          difficulty_level: content.difficulty_level,
          source: 'youtube',
          source_id: content.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      return new Response(
        JSON.stringify({ message: 'Import successful', video: content }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );

    } else if (method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    throw new Error(`Method ${method} not allowed`);

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
});

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
```

3. Deploy the function

4. Set up these environment variables in your Supabase project:
- YOUTUBE_API_KEY: Your YouTube Data API v3 key

5. Create the required database table:

```sql
create table if not exists content (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  video_url text,
  thumbnail_url text,
  subject_area text,
  grade_level text,
  difficulty_level text,
  source text not null,
  source_id text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add RLS policies
alter table content enable row level security;

create policy "Enable read access for all users" on content
  for select using (true);

create policy "Enable insert for authenticated users only" on content
  for insert with check (auth.role() = 'authenticated');
```