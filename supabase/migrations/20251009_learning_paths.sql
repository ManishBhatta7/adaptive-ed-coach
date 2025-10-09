-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create enum for step types
create type step_type as enum (
  'conversation',
  'video',
  'game',
  'experiment'
);

-- Create learning paths table
create table learning_paths (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  steps jsonb not null,
  is_public boolean default false,
  share_code text unique,
  subject text,
  grade_level text
);

-- Create function to generate unique share code
create or replace function generate_share_code()
returns trigger as $$
begin
  -- Generate a random 8-character share code
  new.share_code = substr(md5(random()::text), 1, 8);
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically generate share code
create trigger generate_share_code_trigger
before insert on learning_paths
for each row
when (new.share_code is null)
execute function generate_share_code();

-- Create index for share code lookups
create index learning_paths_share_code_idx on learning_paths(share_code);

-- Create table for student progress
create table learning_path_progress (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references auth.users(id),
  learning_path_id uuid references learning_paths(id),
  current_step integer default 0,
  points integer default 0,
  badges jsonb default '[]'::jsonb,
  completed_steps jsonb default '[]'::jsonb,
  started_at timestamp with time zone default now(),
  last_accessed_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  constraint unique_student_path unique (student_id, learning_path_id)
);