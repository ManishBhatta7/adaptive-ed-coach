-- Create classrooms table
CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    join_code TEXT UNIQUE NOT NULL,
    subject_area TEXT,
    grade_level TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Add index on join_code for fast lookups
    CONSTRAINT unique_join_code UNIQUE (join_code)
);

-- Enable RLS on classrooms
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for classrooms
CREATE POLICY "Teachers can view their classrooms" 
ON public.classrooms 
FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can manage their classrooms" 
ON public.classrooms 
FOR ALL 
USING (auth.uid() = teacher_id);

-- Create classroom_students junction table
CREATE TABLE IF NOT EXISTS public.classroom_students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure a student can only join a classroom once
    UNIQUE(classroom_id, student_id)
);

-- Enable RLS on classroom_students
ALTER TABLE public.classroom_students ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for classroom_students
CREATE POLICY "Students can view their classroom memberships" 
ON public.classroom_students 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can join classrooms" 
ON public.classroom_students 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can view their classroom members" 
ON public.classroom_students 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.classrooms 
    WHERE classrooms.id = classroom_students.classroom_id 
    AND classrooms.teacher_id = auth.uid()
));

-- Create function to generate unique join codes
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate a 6-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 6));
        
        -- Check if code already exists
        SELECT EXISTS(
            SELECT 1 FROM public.classrooms WHERE join_code = code
        ) INTO exists_check;
        
        -- Exit if unique
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger for updating timestamps
CREATE TRIGGER update_classrooms_updated_at
BEFORE UPDATE ON public.classrooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix the foreign key constraint for classroom_assignments
ALTER TABLE public.classroom_assignments 
ADD CONSTRAINT fk_classroom_assignments_classroom_id 
FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE CASCADE;