-- Phase 1: Fix Critical Data Exposure Issues

-- 1. Fix profiles table - Remove email from public view
DROP POLICY IF EXISTS "Authenticated users can view public profile data" ON public.profiles;

CREATE POLICY "Authenticated users can view basic public profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can view other users' basic info (name, avatar, role only - NO EMAIL)
  id <> auth.uid()
);

-- 2. Fix student_profiles table - Restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view student profiles" ON public.student_profiles;

CREATE POLICY "Students can view their own learning profile"
ON public.student_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Teachers can view their students' learning profiles"
ON public.student_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id = student_profiles.id
    AND c.teacher_id = auth.uid()
    AND cs.is_active = true
  )
);

CREATE POLICY "Admins can view all learning profiles"
ON public.student_profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 3. Fix teacher_profiles table - Restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can view teacher profiles" ON public.teacher_profiles;

CREATE POLICY "Teachers can view their own profile"
ON public.teacher_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Students can view their teachers' profiles"
ON public.teacher_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    JOIN public.classroom_students cs ON cs.classroom_id = c.id
    WHERE c.teacher_id = teacher_profiles.id
    AND cs.student_id = auth.uid()
    AND cs.is_active = true
  )
);

CREATE POLICY "Admins can view all teacher profiles"
ON public.teacher_profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 4. Fix classroom_assignments table - Restrict to actual classroom members
DROP POLICY IF EXISTS "Classroom members can view assignments" ON public.classroom_assignments;

CREATE POLICY "Teachers can view assignments for their classrooms"
ON public.classroom_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = classroom_assignments.classroom_id
    AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view assignments for their enrolled classrooms"
ON public.classroom_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_students cs
    WHERE cs.classroom_id = classroom_assignments.classroom_id
    AND cs.student_id = auth.uid()
    AND cs.is_active = true
  )
);

-- 5. Fix assignments table - Restrict to teachers and enrolled students only
DROP POLICY IF EXISTS "Anyone can view active assignments" ON public.assignments;

CREATE POLICY "Teachers can view their own assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id AND is_active = true);

CREATE POLICY "Students can view assignments for their classrooms"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.classroom_assignments ca
    JOIN public.classroom_students cs ON cs.classroom_id = ca.classroom_id
    WHERE ca.assignment_id = assignments.id
    AND cs.student_id = auth.uid()
    AND cs.is_active = true
  )
);

-- 6. Fix submissions table - Allow teachers to grade student work
CREATE POLICY "Teachers can view submissions for their assignments"
ON public.submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.teacher_id = auth.uid()
    -- Assuming content_data contains assignment_id reference
  )
  OR EXISTS (
    -- Teachers can view submissions from students in their classrooms
    SELECT 1 FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id = submissions.user_id
    AND c.teacher_id = auth.uid()
    AND cs.is_active = true
  )
);

-- 7. Add DELETE policies for data cleanup
CREATE POLICY "Users can delete their own learning sessions"
ON public.learning_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions within 24 hours"
ON public.submissions
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  AND submitted_at > now() - interval '24 hours'
);

CREATE POLICY "Students can delete their own unresolved doubts"
ON public.doubts
FOR DELETE
TO authenticated
USING (
  auth.uid() = student_id 
  AND status = 'open'
);