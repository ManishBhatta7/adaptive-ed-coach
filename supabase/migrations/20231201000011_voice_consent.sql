-- Add voice consent fields to profiles table
ALTER TABLE profiles 
ADD COLUMN voice_consent BOOLEAN DEFAULT false,
ADD COLUMN voice_consent_date TIMESTAMPTZ;

-- Add index for voice consent queries
CREATE INDEX idx_profiles_voice_consent ON profiles(voice_consent) WHERE voice_consent IS NOT NULL;