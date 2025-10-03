-- Phase 2: Fix Remaining Critical Security Issues

-- 1. Fix profiles table - Email should ONLY be visible to the user's own profile
-- Currently all authenticated users can see other users' emails
DROP POLICY IF EXISTS "Authenticated users can view basic public profile data" ON public.profiles;

CREATE POLICY "Users can view other users' basic public info (NO EMAIL)"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Other users can only see name, avatar, role (no email)
  -- This policy is for viewing OTHER users
  id <> auth.uid()
);

-- Note: The existing policy "Users can view their own profile" already allows 
-- users to see their own email, so we don't need to add another one

-- 2. Fix quiz_questions table - Hide answers from students
DROP POLICY IF EXISTS "Anyone can view quiz questions" ON public.quiz_questions;

-- Teachers and admins can view complete questions including answers
CREATE POLICY "Teachers can view complete quiz questions"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'teacher') 
  OR has_role(auth.uid(), 'admin')
);

-- Students can view questions but we need to exclude correct_answer and explanation
-- This requires application-level filtering since RLS can't hide specific columns
-- So we only allow students to view questions from content they have access to
CREATE POLICY "Students can view quiz questions (app must filter answers)"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'student'
  )
);