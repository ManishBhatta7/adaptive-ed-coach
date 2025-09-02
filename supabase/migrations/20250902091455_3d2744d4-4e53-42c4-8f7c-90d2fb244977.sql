-- Fix remaining function search path issues
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.sync_profile_role() SET search_path = public;

-- Create RLS policies for new tables

-- Assignments policies
DROP POLICY IF EXISTS "Anyone can view active assignments" ON public.assignments;
CREATE POLICY "Anyone can view active assignments" 
ON public.assignments 
FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Teachers can manage their assignments" ON public.assignments;
CREATE POLICY "Teachers can manage their assignments" 
ON public.assignments 
FOR ALL 
USING (auth.uid() = teacher_id);

-- Learning sessions policies  
DROP POLICY IF EXISTS "Users can view their own learning sessions" ON public.learning_sessions;
CREATE POLICY "Users can view their own learning sessions" 
ON public.learning_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own learning sessions" ON public.learning_sessions;
CREATE POLICY "Users can create their own learning sessions" 
ON public.learning_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Classrooms policies
DROP POLICY IF EXISTS "Teachers can view their classrooms" ON public.classrooms;
CREATE POLICY "Teachers can view their classrooms" 
ON public.classrooms 
FOR SELECT 
USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can manage their classrooms" ON public.classrooms;
CREATE POLICY "Teachers can manage their classrooms" 
ON public.classrooms 
FOR ALL 
USING (auth.uid() = teacher_id);

-- Classroom students policies
DROP POLICY IF EXISTS "Students can view their classroom memberships" ON public.classroom_students;
CREATE POLICY "Students can view their classroom memberships" 
ON public.classroom_students 
FOR SELECT 
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can join classrooms" ON public.classroom_students;
CREATE POLICY "Students can join classrooms" 
ON public.classroom_students 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can manage their classroom students" ON public.classroom_students;
CREATE POLICY "Teachers can manage their classroom students" 
ON public.classroom_students 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.classrooms 
        WHERE classrooms.id = classroom_students.classroom_id 
        AND classrooms.teacher_id = auth.uid()
    )
);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_classrooms_updated_at
BEFORE UPDATE ON public.classrooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();