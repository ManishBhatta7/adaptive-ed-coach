-- Metacognition Event Tracking System
-- Append-only event store for the metacognition learning loop

CREATE TABLE IF NOT EXISTS metacog_events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN (
    'reflection_submitted',
    'micro_action_performed', 
    'teacher_feedback_given',
    'strategy_suggestion_shown',
    'retry_attempted',
    'think_aloud_recorded'
  )),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id uuid,
  activity_id text,
  
  -- Event payload (JSON)
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_metacog_events_user_id ON metacog_events(user_id);
CREATE INDEX IF NOT EXISTS idx_metacog_events_type ON metacog_events(event_type);
CREATE INDEX IF NOT EXISTS idx_metacog_events_created_at ON metacog_events(created_at);
CREATE INDEX IF NOT EXISTS idx_metacog_events_user_type ON metacog_events(user_id, event_type);

-- Add RLS policies
ALTER TABLE metacog_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events" ON metacog_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own events" ON metacog_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Teachers can view student events from their classrooms" ON metacog_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classroom_members cm
      JOIN classrooms c ON c.id = cm.classroom_id
      WHERE c.teacher_id = auth.uid() 
      AND cm.student_id = metacog_events.user_id
    )
  );

-- Update profiles table to include strategy preferences
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_strategies jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS metacog_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reflection_quality jsonb DEFAULT '{"positive": 0, "total": 0}'::jsonb;

-- Create strategy tips table
CREATE TABLE IF NOT EXISTS strategy_tips (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  strategy text NOT NULL,
  tip_text text NOT NULL,
  tip_type text NOT NULL DEFAULT 'general' CHECK (tip_type IN ('general', 'subject_specific', 'difficulty_based')),
  subject_area text,
  min_difficulty integer DEFAULT 1,
  max_difficulty integer DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

-- Insert sample strategy tips
INSERT INTO strategy_tips (strategy, tip_text, tip_type) VALUES 
('Visualize', 'Try drawing a diagram or sketch to represent the problem visually.', 'general'),
('Visualize', 'Create a concept map connecting the main ideas.', 'general'),
('Formula', 'Write down all known variables before applying formulas.', 'general'),
('Formula', 'Check your units to make sure the formula makes sense.', 'general'),
('Example', 'Think of a similar problem you''ve solved before.', 'general'),
('Example', 'Try working through a simpler version first.', 'general'),
('Trial-and-error', 'Make a hypothesis and test it systematically.', 'general'),
('Trial-and-error', 'Keep track of what you''ve tried so you don''t repeat mistakes.', 'general'),
('Break-down', 'Identify the smaller steps needed to reach the solution.', 'general'),
('Break-down', 'Solve one piece at a time, then combine your answers.', 'general'),
('Other', 'Explain the problem out loud to clarify your thinking.', 'general'),
('Other', 'Ask yourself: What is the question really asking?', 'general')
ON CONFLICT DO NOTHING;

-- Enable RLS for strategy_tips
ALTER TABLE strategy_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view strategy tips" ON strategy_tips
  FOR SELECT USING (auth.role() = 'authenticated');

-- Function to log metacognition events
CREATE OR REPLACE FUNCTION log_metacog_event(
  p_event_type text,
  p_user_id uuid,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_session_id uuid DEFAULT NULL,
  p_activity_id text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO metacog_events (event_type, user_id, session_id, activity_id, payload)
  VALUES (p_event_type, p_user_id, p_session_id, p_activity_id, p_payload)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get strategy suggestions
CREATE OR REPLACE FUNCTION get_strategy_suggestions(
  p_strategy text,
  p_subject_area text DEFAULT NULL,
  p_limit integer DEFAULT 2
)
RETURNS TABLE(tip_text text, tip_type text) AS $$
BEGIN
  RETURN QUERY
  SELECT st.tip_text, st.tip_type
  FROM strategy_tips st
  WHERE st.strategy = p_strategy
    AND (p_subject_area IS NULL OR st.subject_area IS NULL OR st.subject_area = p_subject_area)
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate reflection quality score
CREATE OR REPLACE FUNCTION calculate_reflection_quality(reflection_text text, helpful_flag boolean)
RETURNS decimal AS $$
DECLARE
  quality_score decimal := 0.0;
  word_count integer;
  has_explanatory_words boolean;
BEGIN
  -- Count words
  word_count := array_length(string_to_array(reflection_text, ' '), 1);
  
  -- Check for explanatory words
  has_explanatory_words := reflection_text ~* 'because|since|therefore|however|although|so|then|when|if|why|how';
  
  -- Calculate quality score
  IF word_count >= 5 THEN
    quality_score := quality_score + 0.5;
  END IF;
  
  IF has_explanatory_words THEN
    quality_score := quality_score + 0.3;
  END IF;
  
  IF helpful_flag THEN
    quality_score := quality_score + 0.2;
  END IF;
  
  RETURN LEAST(quality_score, 1.0);
END;
$$ LANGUAGE plpgsql;

-- Update the reflection trigger to log events
CREATE OR REPLACE FUNCTION log_reflection_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the reflection submission event
  PERFORM log_metacog_event(
    'reflection_submitted',
    NEW.student_id,
    jsonb_build_object(
      'activity_id', COALESCE(NEW.assignment_id::text, 'general'),
      'strategy_choice', NEW.strategy_used,
      'reflection_text', NEW.reflection_text,
      'helpful_flag', NEW.was_helpful,
      'difficulty_rating', NEW.difficulty_rating,
      'reflection_quality', calculate_reflection_quality(NEW.reflection_text, NEW.was_helpful)
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for logging reflection events
CREATE OR REPLACE TRIGGER log_reflection_event_trigger
  AFTER INSERT ON reflections
  FOR EACH ROW
  EXECUTE FUNCTION log_reflection_event();