# User Onboarding & Profile Creation - Backend Setup

## Overview

This document details the complete backend setup for automatic user onboarding and profile creation in the Adaptive Ed Coach platform.

## Architecture

When a user signs up, the following automatic workflow occurs:

```
User Signup (Frontend)
    ↓
Supabase Auth (auth.users INSERT)
    ↓
Database Trigger: on_auth_user_created
    ↓
Function: handle_new_user()
    ↓
┌───────────────────────────────┐
│  1. Create profiles entry     │
│  2. Create user_roles entry   │
│  3. Return success            │
└───────────────────────────────┘
    ↓
Frontend fetches profile
    ↓
User redirected to dashboard
```

## Critical Components

### 1. Auth Trigger

**File:** `20251029_create_auth_user_trigger.sql`

```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

**Purpose:** Automatically fires when a new user signs up via Supabase Auth.

**Status:** ⚠️ **This was MISSING and has been added in the latest migration**

### 2. Profile Creation Function

**File:** `20250903024331_fd639ce4-6349-4869-9618-382ba3625882.sql`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Insert into profiles
    INSERT INTO public.profiles (id, name, email, role, joined_at, last_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
        now(),
        now()
    );
    
    -- Insert default student role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'student'));
    
    RETURN NEW;
END;
$function$;
```

**Purpose:** Creates user profile and assigns role when triggered.

**Key Features:**
- Extracts `name` and `role` from user metadata
- Defaults to 'student' role if not specified
- Creates entries in both `profiles` and `user_roles` tables
- Uses SECURITY DEFINER to bypass RLS during creation

### 3. Database Tables

#### profiles Table

```sql
CREATE TABLE public.profiles (
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
```

#### user_roles Table

```sql
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);
```

#### app_role Enum

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');
```

### 4. Row Level Security (RLS)

#### Profiles Table Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- System can create user profiles (via trigger)
CREATE POLICY "System can create user profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

#### User Roles Policies

```sql
-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users get default student role on creation
CREATE POLICY "Users get default student role on creation"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'student');

-- Admins can manage all roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

## Frontend Integration

### Signup Flow (useAuth.tsx)

```typescript
const register = async (name: string, email: string, password: string, role: 'student' | 'teacher' = 'student'): Promise<boolean> => {
  try {
    console.log('Registering user with role:', role);
    
    // Store role and name in user_metadata for the trigger function
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },  // ← This metadata is read by handle_new_user()
      }
    });

    if (error) throw error;

    // If session is created, user is auto-logged in
    if (data.session) {
      setSession(data.session);
      setIsAuthenticated(true);
      
      // Wait for profile to be created by trigger
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch the newly created profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profile) {
        setCurrentUser(profile as StudentProfile);
        setIsTeacher(profile.role === 'teacher');
      }
      
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};
```

## Configuration Requirements

### Supabase Dashboard Settings

1. **Disable Email Confirmation (Development)**
   - Navigate to: **Authentication** → **Providers** → **Email**
   - Toggle OFF: "Confirm email"
   - This allows immediate login after signup

2. **Site URL Configuration**
   - Navigate to: **Settings** → **API**
   - Set "Site URL" to your production domain
   - Add redirect URLs for development and production

3. **Environment Variables**
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Testing the Setup

### 1. Run Verification Script

Execute the verification script in Supabase SQL Editor:

```bash
# File: supabase/migrations/verify_onboarding_setup.sql
```

This will check:
- ✅ handle_new_user() function exists
- ✅ on_auth_user_created trigger exists
- ✅ profiles table with required columns
- ✅ user_roles table exists
- ✅ RLS policies are configured
- ✅ All components working together

### 2. Test Signup Flow

1. Navigate to `/signup` in your application
2. Fill in the form:
   - Name: Test Student
   - Email: test@example.com
   - Password: test123456
   - Role: Student
3. Click "Create account"

**Expected Result:**
- User is created in `auth.users`
- Trigger fires automatically
- Profile created in `profiles` table
- Role created in `user_roles` table
- User auto-logged in (if email confirmation disabled)
- Redirected to `/dashboard`

### 3. Verify in Database

```sql
-- Check if user was created
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'test@example.com';

-- Check if profile was created
SELECT * FROM profiles 
WHERE email = 'test@example.com';

-- Check if role was assigned
SELECT * FROM user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```

## Troubleshooting

### Profile Not Created

**Symptoms:** User signs up but no profile is created

**Solutions:**
1. Verify trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Check function exists and is correct:
   ```sql
   \df handle_new_user
   ```
3. Review Supabase logs for errors
4. Ensure RLS policies allow INSERT

### Role Assignment Failed

**Symptoms:** Profile created but no role assigned

**Solutions:**
1. Verify `user_roles` table exists
2. Check `app_role` enum type exists
3. Ensure user metadata includes role:
   ```typescript
   options: { data: { name, role } }
   ```

### Email Confirmation Required

**Symptoms:** User created but can't login immediately

**Solutions:**
1. Disable email confirmation in Supabase Dashboard
2. OR set up SMTP email service for production
3. Check `confirmed_at` field in `auth.users`

## Migration Order

For a fresh setup, run migrations in this order:

1. `20250721033743` - Create user_roles table and app_role enum
2. `20250903024331` - Update handle_new_user() function
3. `20251003125254` - Add INSERT policy for profiles
4. **`20251029_create_auth_user_trigger.sql`** - ⚠️ NEW: Create the critical auth trigger
5. `verify_onboarding_setup.sql` - Verify everything works

## Security Considerations

1. **SECURITY DEFINER**: The `handle_new_user()` function uses `SECURITY DEFINER` to bypass RLS during profile creation. This is necessary but means the function must be carefully audited.

2. **User Metadata**: Never trust user-provided metadata for security decisions. The role in metadata is only for initial setup; actual role checks use the `user_roles` table.

3. **RLS Policies**: All tables must have proper RLS policies to prevent unauthorized access.

4. **Email Verification**: For production, always enable email verification to prevent fake accounts.

## Additional Features

### Extended Profile Tables

For role-specific data, create additional tables:

- `student_profiles` - Learning preferences, grade level, etc.
- `teacher_profiles` - Subjects taught, experience, etc.

These can be populated:
- Automatically (modify `handle_new_user()`)
- During onboarding flow (separate API calls)
- Later by the user (profile settings)

## Conclusion

The backend setup for user onboarding is now complete with the addition of the critical `on_auth_user_created` trigger. All components work together to provide seamless automatic profile creation when users sign up.

**Key Fix Applied:** The missing database trigger has been added in migration `20251029_create_auth_user_trigger.sql`.

Run the verification script to ensure everything is working correctly!
