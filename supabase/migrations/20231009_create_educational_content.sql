-- Create the content table for YouTube videos and shorts
create table if not exists educational_content (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  source varchar(50) not null,
  source_id varchar(50) not null,
  content_type varchar(20) not null,
  is_short boolean default false,
  duration text,
  subject_area varchar(50),
  grade_level varchar(20),
  difficulty_level varchar(20),
  transcript text,
  ai_summary text,
  ai_key_points jsonb,
  ai_quiz_questions jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(source, source_id)
);

-- Add RLS policies
alter table educational_content enable row level security;

-- Allow read access for all authenticated users
create policy "Enable read access for authenticated users" 
  on educational_content for select 
  using (auth.role() = 'authenticated');

-- Allow insert/update access for authenticated users
create policy "Enable insert for authenticated users" 
  on educational_content for insert 
  with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" 
  on educational_content for update 
  using (auth.role() = 'authenticated');

-- Create an index for faster searches
create index idx_educational_content_source_id on educational_content(source, source_id);