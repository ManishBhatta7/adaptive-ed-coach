# Supabase Configuration for Development

## Disable Email Confirmation (Development Only)

To allow users to sign up and immediately use the app without email verification:

### Option 1: Via Supabase Dashboard (Recommended for Development)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Under **Email Settings**:
   - **Disable** "Confirm email" toggle
   - This allows users to sign up without email verification

### Option 2: Via SQL (Alternative)

Run this SQL in your Supabase SQL Editor:

```sql
-- Disable email confirmation for development
UPDATE auth.config 
SET config = jsonb_set(
  config, 
  '{MAILER_AUTOCONFIRM}', 
  'true'::jsonb
);
```

## Production Setup

⚠️ **Important**: For production, you should:

1. **Re-enable email confirmation** for security
2. Configure an email service (SMTP or provider like SendGrid)
3. Customize email templates in Authentication → Email Templates
4. Set proper redirect URLs for email confirmation

## Current Setup

The app is configured to:
- ✅ Auto-login users after signup (when email confirmation is disabled)
- ✅ Fetch user profile immediately after registration
- ✅ Redirect students to `/dashboard`
- ✅ Redirect teachers to `/teacher-dashboard`
- ✅ Create user profile via database trigger (`handle_new_user`)

## Testing Signup

1. Make sure email confirmation is disabled in Supabase Dashboard
2. Go to `/signup`
3. Fill in the form with:
   - Name: Test Student
   - Email: test@example.com
   - Password: test123 (min 6 characters)
   - Role: Student
4. Click "Create account"
5. Should auto-login and redirect to `/dashboard`

## Environment Variables Required

Make sure these are set in Vercel (or your deployment platform):

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

And in Supabase Dashboard → Settings → API:
- Set the Site URL to your production domain
- Add your domain to the Redirect URLs list
