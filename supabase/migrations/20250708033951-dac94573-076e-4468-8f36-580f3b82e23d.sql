-- Create tables for imported educational content

-- Content categories table
CREATE TABLE public.content_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Educational content table
CREATE TABLE public.educational_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('course', 'lesson', 'quiz', 'article', 'video', 'document')),
  subject_area TEXT,
  grade_level TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  content_data JSONB, -- Store the actual content data
  source_url TEXT,
  source_id TEXT, -- ID from the original source
  category_id UUID REFERENCES public.content_categories(id),
  tags TEXT[], -- Array of tags for better organization
  is_active BOOLEAN DEFAULT true,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Questions/Quiz items table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.educational_content(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
  options JSONB, -- Store multiple choice options
  correct_answer TEXT,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Content import logs table
CREATE TABLE public.content_import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  error_details JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID, -- Can reference user who initiated import
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_import_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for content categories (public read, admin write)
CREATE POLICY "Anyone can view content categories" 
ON public.content_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage content categories" 
ON public.content_categories 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create policies for educational content (public read, admin write)
CREATE POLICY "Anyone can view active educational content" 
ON public.educational_content 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage educational content" 
ON public.educational_content 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create policies for quiz questions (public read, admin write)
CREATE POLICY "Anyone can view quiz questions" 
ON public.quiz_questions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage quiz questions" 
ON public.quiz_questions 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create policies for import logs (admin only)
CREATE POLICY "Authenticated users can view import logs" 
ON public.content_import_logs 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage import logs" 
ON public.content_import_logs 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_content_categories_updated_at
BEFORE UPDATE ON public.content_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_educational_content_updated_at
BEFORE UPDATE ON public.educational_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at
BEFORE UPDATE ON public.quiz_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_educational_content_subject_area ON public.educational_content(subject_area);
CREATE INDEX idx_educational_content_content_type ON public.educational_content(content_type);
CREATE INDEX idx_educational_content_grade_level ON public.educational_content(grade_level);
CREATE INDEX idx_educational_content_tags ON public.educational_content USING GIN(tags);
CREATE INDEX idx_educational_content_category_id ON public.educational_content(category_id);
CREATE INDEX idx_quiz_questions_content_id ON public.quiz_questions(content_id);
CREATE INDEX idx_content_import_logs_status ON public.content_import_logs(status);

-- Insert some default categories
INSERT INTO public.content_categories (name, description) VALUES
('Mathematics', 'Mathematical concepts, problems, and exercises'),
('Science', 'Physics, Chemistry, Biology and General Science'),
('Literature', 'Language arts, reading comprehension, and writing'),
('History', 'Historical events, timelines, and cultural studies'),
('Computer Science', 'Programming, algorithms, and technology concepts'),
('General Knowledge', 'Mixed topics and general awareness questions');