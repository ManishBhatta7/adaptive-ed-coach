-- Critical Fix: Add missing trigger on auth.users to automatically create profiles
-- This trigger should have been created earlier but was missing from migrations

-- First, ensure the profiles table exists with proper schema
-- This is a safety measure in case it was only created in the dashboard
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    bio TEXT,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    voice_consent BOOLEAN DEFAULT false,
    voice_consent_date TIMESTAMPTZ,
    telegram_chat_id TEXT,
    telegram_username TEXT,
    telegram_notifications_enabled BOOLEAN DEFAULT false,
    ai_confidence_threshold DECIMAL(3,2) DEFAULT 0.75,
    metacog_score INTEGER DEFAULT 0,
    total_reflections INTEGER DEFAULT 0,
    strategy_preferences JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create student_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    grade_level TEXT,
    learning_style TEXT,
    preferred_subjects TEXT[],
    goals TEXT[],
    strengths JSONB DEFAULT '[]'::jsonb,
    areas_for_improvement JSONB DEFAULT '[]'::jsonb,
    learning_preferences JSONB DEFAULT '{}'::jsonb,
    metacog_level TEXT DEFAULT 'beginner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Create teacher_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    subjects_taught TEXT[],
    years_experience INTEGER,
    qualifications TEXT[],
    bio TEXT,
    teaching_style TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the critical trigger that calls handle_new_user()
-- This trigger fires automatically when a new user signs up via auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger was created successfully
-- This will log confirmation in the migration output
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        RAISE NOTICE 'Trigger on_auth_user_created successfully created!';
    ELSE
        RAISE EXCEPTION 'Failed to create trigger on_auth_user_created';
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active DESC);

-- Add comments for documentation
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
'Automatically creates a profile entry in the profiles table and assigns a default role when a new user signs up through Supabase Auth.';

COMMENT ON TABLE public.profiles IS 
'Core user profile table containing basic information for all users (students, teachers, admins). Automatically populated via trigger when users sign up.';

COMMENT ON TABLE public.student_profiles IS 
'Extended profile information specific to students, including learning preferences and progress tracking.';

COMMENT ON TABLE public.teacher_profiles IS 
'Extended profile information specific to teachers, including teaching experience and qualifications.';
