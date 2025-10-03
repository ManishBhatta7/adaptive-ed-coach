-- Phase 4: Add Teacher Management Capabilities (Idempotent)

-- 1. Allow teachers to view their students' learning sessions for progress monitoring
DROP POLICY IF EXISTS "Teachers can view their students' learning sessions" ON public.learning_sessions;

CREATE POLICY "Teachers can view their students' learning sessions"
ON public.learning_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id = learning_sessions.user_id
    AND c.teacher_id = auth.uid()
    AND cs.is_active = true
  )
);

-- 2. Allow teachers to manage classroom membership (remove students if needed)
DROP POLICY IF EXISTS "Teachers can update classroom membership" ON public.classroom_students;
DROP POLICY IF EXISTS "Teachers can remove students from their classrooms" ON public.classroom_students;
DROP POLICY IF EXISTS "Admins can manage all classroom memberships" ON public.classroom_students;

CREATE POLICY "Teachers can update classroom membership"
ON public.classroom_students
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = classroom_students.classroom_id
    AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can remove students from their classrooms"
ON public.classroom_students
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = classroom_students.classroom_id
    AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all classroom memberships"
ON public.classroom_students
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));