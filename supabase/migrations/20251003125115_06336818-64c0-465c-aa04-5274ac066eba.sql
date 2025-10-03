-- Phase 3: Add Missing INSERT Policy for Profiles

-- The profiles table is missing an INSERT policy
-- Profiles should only be created by the auth system trigger (handle_new_user)
-- We need to allow the system to insert profiles for new users

-- This policy should never be hit by regular users since profiles are created
-- by the handle_new_user() trigger, but we add it for completeness
DROP POLICY IF EXISTS "System can create user profiles" ON public.profiles;

CREATE POLICY "System can create user profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Note: This allows users to create their own profile if somehow the trigger fails
-- but in practice, the trigger creates the profile automatically on signup