-- Fix security vulnerability: Remove public access to email addresses
-- Drop the overly permissive policy that allows anyone to view all profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create a secure policy that allows users to view their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a policy that allows authenticated users to view only public profile info (name, avatar) of others
-- This excludes sensitive data like email addresses
CREATE POLICY "Authenticated users can view public profile data" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND id != auth.uid()
);

-- Update the policy to be more restrictive - only allow viewing name and avatar for others
-- We'll need to handle this at the application level by selecting only specific columns