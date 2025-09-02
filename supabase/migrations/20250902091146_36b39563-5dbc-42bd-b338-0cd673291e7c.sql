-- Fix function search path security issues
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.sync_profile_role() SET search_path = public;

-- Create missing tables for submissions and progress tracking
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assignment_type TEXT NOT NULL, -- 'answer_sheet', 'essay', 'report_card', 'voice_reading'
    content_data JSONB NOT NULL DEFAULT '{}',
    ai_feedback JSONB,
    score INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' -- 'pending', 'processed', 'failed'
);

-- Enable RLS on submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for submissions
CREATE POLICY "Users can view their own submissions" 
ON public.submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions" 
ON public.submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" 
ON public.submissions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignment_type TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    total_points INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS on assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for assignments
CREATE POLICY "Anyone can view active assignments" 
ON public.assignments 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Teachers can manage their assignments" 
ON public.assignments 
FOR ALL 
USING (auth.uid() = teacher_id);

-- Create classroom_assignments junction table
CREATE TABLE IF NOT EXISTS public.classroom_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    classroom_id UUID NOT NULL,
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(classroom_id, assignment_id)
);

-- Enable RLS on classroom_assignments
ALTER TABLE public.classroom_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for classroom_assignments
CREATE POLICY "Classroom members can view assignments" 
ON public.classroom_assignments 
FOR SELECT 
USING (true); -- Will be refined based on classroom membership

-- Create learning_sessions table for progress tracking
CREATE TABLE IF NOT EXISTS public.learning_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL, -- 'quiz', 'study', 'practice', 'assessment'
    subject_area TEXT,
    topic TEXT,
    duration_minutes INTEGER,
    score FLOAT,
    performance_data JSONB DEFAULT '{}',
    insights JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on learning_sessions
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for learning_sessions
CREATE POLICY "Users can view their own learning sessions" 
ON public.learning_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own learning sessions" 
ON public.learning_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updating timestamps
CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();