-- Update handle_new_user function to include school field from user metadata
-- This ensures that when a user signs up with a school, it's properly stored in the profile

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Insert into profiles with school field
    INSERT INTO public.profiles (id, name, email, role, school, joined_at, last_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
        NEW.raw_user_meta_data ->> 'school', -- Extract school from metadata if provided
        now(),
        now()
    );
    
    -- Insert default student role (if user_roles table exists)
    -- This is kept for backward compatibility
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_roles'
    ) THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'student'))
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function that automatically creates a user profile when a new user signs up. 
Extracts name, role, and school from user metadata and stores them in the profiles table.';
