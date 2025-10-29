-- Add school field to profiles table to support school-specific features
-- This allows users to optionally specify their school during onboarding

-- Add school column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'school'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN school TEXT;
        
        RAISE NOTICE 'Added school column to profiles table';
    ELSE
        RAISE NOTICE 'School column already exists in profiles table';
    END IF;
END $$;

-- Add index for better performance when querying by school
CREATE INDEX IF NOT EXISTS idx_profiles_school ON public.profiles(school) WHERE school IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.school IS 
'Optional school name that the user belongs to. Used for school-specific features and filtering.';
