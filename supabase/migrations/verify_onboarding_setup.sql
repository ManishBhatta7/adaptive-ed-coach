-- Verification Script for User Onboarding Backend Setup
-- Run this in Supabase SQL Editor to verify everything is configured correctly

-- ============================================================
-- 1. CHECK: Verify handle_new_user() function exists
-- ============================================================
SELECT 
    'handle_new_user function' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
        ) THEN 'Function is defined and ready to create profiles'
        ELSE 'CRITICAL: Function missing - profiles will not be created on signup!'
    END as notes
;

-- ============================================================
-- 2. CHECK: Verify auth.users trigger exists
-- ============================================================
SELECT 
    'on_auth_user_created trigger' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'on_auth_user_created'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'on_auth_user_created'
        ) THEN 'Trigger will automatically call handle_new_user() on signup'
        ELSE 'CRITICAL: Trigger missing - automatic profile creation will not work!'
    END as notes
;

-- ============================================================
-- 3. CHECK: Verify profiles table exists with required columns
-- ============================================================
SELECT 
    'profiles table' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'profiles'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'profiles'
        ) THEN (
            SELECT 'Columns: ' || string_agg(column_name, ', ' ORDER BY ordinal_position)
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'profiles'
        )
        ELSE 'Table missing - need to create profiles table!'
    END as notes
;

-- ============================================================
-- 4. CHECK: Verify user_roles table exists
-- ============================================================
SELECT 
    'user_roles table' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'user_roles'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'user_roles'
        ) THEN 'Table ready for role management'
        ELSE 'Table missing - roles cannot be assigned!'
    END as notes
;

-- ============================================================
-- 5. CHECK: Verify app_role enum type exists
-- ============================================================
SELECT 
    'app_role enum type' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_type 
            WHERE typname = 'app_role'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_type 
            WHERE typname = 'app_role'
        ) THEN (
            SELECT 'Values: ' || string_agg(enumlabel, ', ' ORDER BY enumsortorder)
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'app_role'
        )
        ELSE 'Enum type missing - cannot enforce role types!'
    END as notes
;

-- ============================================================
-- 6. CHECK: Verify RLS is enabled on profiles
-- ============================================================
SELECT 
    'RLS on profiles' as component,
    CASE 
        WHEN (
            SELECT relrowsecurity 
            FROM pg_class 
            WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace
        ) THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as status,
    CASE 
        WHEN (
            SELECT relrowsecurity 
            FROM pg_class 
            WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace
        ) THEN 'Row Level Security is properly configured'
        ELSE 'WARNING: RLS not enabled - security risk!'
    END as notes
;

-- ============================================================
-- 7. CHECK: Verify INSERT policy exists for profiles
-- ============================================================
SELECT 
    'profiles INSERT policy' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'profiles' AND cmd = 'INSERT'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'profiles' AND cmd = 'INSERT'
        ) THEN (
            SELECT 'Policy: ' || policyname 
            FROM pg_policies 
            WHERE tablename = 'profiles' AND cmd = 'INSERT' 
            LIMIT 1
        )
        ELSE 'No INSERT policy - profiles cannot be created!'
    END as notes
;

-- ============================================================
-- 8. CHECK: Verify student_profiles table exists
-- ============================================================
SELECT 
    'student_profiles table' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'student_profiles'
        ) THEN '✅ EXISTS'
        ELSE '⚠️ OPTIONAL'
    END as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'student_profiles'
        ) THEN 'Extended student profile data available'
        ELSE 'Optional: Can be created for additional student metadata'
    END as notes
;

-- ============================================================
-- 9. CHECK: Verify teacher_profiles table exists
-- ============================================================
SELECT 
    'teacher_profiles table' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'teacher_profiles'
        ) THEN '✅ EXISTS'
        ELSE '⚠️ OPTIONAL'
    END as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'teacher_profiles'
        ) THEN 'Extended teacher profile data available'
        ELSE 'Optional: Can be created for additional teacher metadata'
    END as notes
;

-- ============================================================
-- 10. SUMMARY: Overall Status
-- ============================================================
SELECT 
    '═══════════════════════════════════════════════════════' as separator,
    'SUMMARY: Overall Onboarding Setup Status' as component,
    CASE 
        WHEN (
            -- All critical components exist
            EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') AND
            EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles')
        ) THEN '✅ READY'
        ELSE '❌ NOT READY'
    END as status,
    CASE 
        WHEN (
            EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') AND
            EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles')
        ) THEN 'All critical components in place - user onboarding should work!'
        ELSE 'Missing critical components - review the checks above and run necessary migrations!'
    END as notes
;
