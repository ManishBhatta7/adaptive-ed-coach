-- Step 2: Add Telegram and AI confidence columns to doubts and profiles tables

-- Add columns to doubts table for Telegram and teacher assignment
ALTER TABLE public.doubts
ADD COLUMN assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
ADD COLUMN escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN telegram_chat_id BIGINT,
ADD COLUMN telegram_message_id INTEGER;

-- Add indexes for faster queries
CREATE INDEX idx_doubts_assigned_to ON public.doubts(assigned_to);
CREATE INDEX idx_doubts_telegram_chat_id ON public.doubts(telegram_chat_id);
CREATE INDEX idx_doubts_ai_confidence ON public.doubts(ai_confidence_score);

-- Add Telegram fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN telegram_chat_id BIGINT UNIQUE,
ADD COLUMN telegram_username TEXT;

-- Create index for Telegram lookups
CREATE INDEX idx_profiles_telegram_chat_id ON public.profiles(telegram_chat_id);

-- Update RLS policy to allow AI system to update doubt assignment
CREATE POLICY "AI system can update doubt assignments"
ON public.doubts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Comment describing the columns
COMMENT ON COLUMN public.doubts.assigned_to IS 'Teacher assigned to resolve this doubt (NULL if AI-solved or unassigned)';
COMMENT ON COLUMN public.doubts.ai_confidence_score IS 'AI confidence score from 0.0 to 1.0 for auto-generated responses';
COMMENT ON COLUMN public.doubts.escalated_at IS 'Timestamp when doubt was escalated to a teacher due to low AI confidence';
COMMENT ON COLUMN public.doubts.telegram_chat_id IS 'Telegram chat ID of the student who submitted this doubt';
COMMENT ON COLUMN public.doubts.telegram_message_id IS 'Telegram message ID for tracking responses';
COMMENT ON COLUMN public.profiles.telegram_chat_id IS 'Linked Telegram chat ID for the user';
COMMENT ON COLUMN public.profiles.telegram_username IS 'Telegram username of the user';