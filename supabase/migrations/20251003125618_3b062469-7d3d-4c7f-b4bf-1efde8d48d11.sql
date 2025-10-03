-- Phase 5: Create Secure Profile Views to Hide Email Column

-- Create a view for public profile data that excludes sensitive fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  name,
  avatar,
  role,
  joined_at,
  last_active
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Add RLS policy for the view (even though views inherit base table policies)
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Create a secure function for admins to access full profile data including emails
CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  avatar text,
  role text,
  joined_at timestamptz,
  last_active timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    email,
    avatar,
    role,
    joined_at,
    last_active
  FROM public.profiles
  WHERE has_role(auth.uid(), 'admin');
$$;

-- Grant execute permission to authenticated users (function internally checks admin role)
GRANT EXECUTE ON FUNCTION public.get_all_profiles_admin() TO authenticated;