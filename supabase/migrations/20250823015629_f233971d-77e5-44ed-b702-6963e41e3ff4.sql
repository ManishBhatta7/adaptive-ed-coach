-- Create doubts table for student questions and doubts
CREATE TABLE public.doubts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  subject_area TEXT,
  difficulty_level TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'solved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  tags TEXT[],
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  solved_at TIMESTAMP WITH TIME ZONE,
  solved_by UUID
);

-- Create doubt_responses table for AI and teacher responses
CREATE TABLE public.doubt_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doubt_id UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  response_type TEXT DEFAULT 'ai' CHECK (response_type IN ('ai', 'teacher', 'peer')),
  responder_id UUID,
  is_solution BOOLEAN DEFAULT FALSE,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubt_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for doubts
CREATE POLICY "Students can view their own doubts" 
ON public.doubts 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own doubts" 
ON public.doubts 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own doubts" 
ON public.doubts 
FOR UPDATE 
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all doubts" 
ON public.doubts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
);

-- Create policies for doubt responses
CREATE POLICY "Users can view responses to their doubts" 
ON public.doubt_responses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.doubts 
    WHERE doubts.id = doubt_responses.doubt_id 
    AND doubts.student_id = auth.uid()
  )
);

CREATE POLICY "Teachers can create responses" 
ON public.doubt_responses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

CREATE POLICY "AI system can create responses" 
ON public.doubt_responses 
FOR INSERT 
WITH CHECK (response_type = 'ai');

-- Create function to update timestamps
CREATE TRIGGER update_doubts_updated_at
BEFORE UPDATE ON public.doubts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doubt_responses_updated_at
BEFORE UPDATE ON public.doubt_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_doubts_student_id ON public.doubts(student_id);
CREATE INDEX idx_doubts_status ON public.doubts(status);
CREATE INDEX idx_doubts_subject_area ON public.doubts(subject_area);
CREATE INDEX idx_doubt_responses_doubt_id ON public.doubt_responses(doubt_id);