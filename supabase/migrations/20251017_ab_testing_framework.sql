-- A/B Testing Framework for Metacognition Features
-- Allows testing different reflection templates and measuring effectiveness

CREATE TABLE IF NOT EXISTS ab_experiments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  
  -- Experiment configuration
  feature_type text NOT NULL CHECK (feature_type IN ('reflection_template', 'hint_style', 'strategy_suggestion')),
  target_population jsonb DEFAULT '{}'::jsonb, -- criteria for who sees the experiment
  traffic_split decimal DEFAULT 0.5 CHECK (traffic_split >= 0 AND traffic_split <= 1),
  
  -- Variants
  control_variant jsonb NOT NULL,
  treatment_variant jsonb NOT NULL,
  
  -- Timing
  start_date timestamptz,
  end_date timestamptz,
  
  -- Success metrics
  success_metrics jsonb DEFAULT '["reflection_quality", "completion_rate", "engagement_time"]'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS ab_assignments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  experiment_id uuid NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  variant text NOT NULL CHECK (variant IN ('control', 'treatment')),
  assigned_at timestamptz DEFAULT now(),
  
  UNIQUE(experiment_id, user_id)
);

CREATE TABLE IF NOT EXISTS ab_events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  experiment_id uuid NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  variant text NOT NULL CHECK (variant IN ('control', 'treatment')),
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment ON ab_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user ON ab_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_experiment ON ab_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_user_variant ON ab_events(user_id, variant);

-- Enable RLS
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Teachers can manage experiments for their students" ON ab_experiments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classrooms 
      WHERE teacher_id = auth.uid()
    ) OR 
    auth.uid() = created_by
  );

CREATE POLICY "Users can view their own assignments" ON ab_assignments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage assignments" ON ab_assignments
  FOR ALL USING (true); -- Will be restricted by application logic

CREATE POLICY "Users can create their own events" ON ab_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers can view events for their experiments" ON ab_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ab_experiments 
      WHERE ab_experiments.id = ab_events.experiment_id 
      AND created_by = auth.uid()
    )
  );

-- Insert sample A/B experiments
INSERT INTO ab_experiments (
  name, 
  description, 
  feature_type, 
  control_variant, 
  treatment_variant,
  status
) VALUES 
(
  'reflection_template_study',
  'Test short vs detailed reflection prompts',
  'reflection_template',
  '{
    "template": "Which strategy did you use and was it helpful?",
    "max_length": 100,
    "guidance": "brief"
  }',
  '{
    "template": "Explain in 15 words how you solved this, then expand to help someone confused.",
    "max_length": 200,
    "guidance": "detailed"
  }',
  'draft'
),
(
  'hint_immediacy_test',
  'Test immediate vs delayed hints',
  'hint_style',
  '{
    "timing": "immediate",
    "verbosity": "standard"
  }',
  '{
    "timing": "after_attempt",
    "verbosity": "minimal"
  }',
  'draft'
);

-- Function to assign users to experiments
CREATE OR REPLACE FUNCTION assign_user_to_experiment(
  p_user_id uuid,
  p_experiment_name text
)
RETURNS text AS $$
DECLARE
  experiment_record ab_experiments%ROWTYPE;
  existing_assignment text;
  random_value decimal;
  assigned_variant text;
BEGIN
  -- Get experiment details
  SELECT * INTO experiment_record 
  FROM ab_experiments 
  WHERE name = p_experiment_name AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN 'control'; -- Default to control if experiment not found/active
  END IF;
  
  -- Check if user already assigned
  SELECT variant INTO existing_assignment
  FROM ab_assignments
  WHERE experiment_id = experiment_record.id AND user_id = p_user_id;
  
  IF FOUND THEN
    RETURN existing_assignment;
  END IF;
  
  -- Assign based on traffic split
  random_value := random();
  IF random_value < experiment_record.traffic_split THEN
    assigned_variant := 'treatment';
  ELSE
    assigned_variant := 'control';
  END IF;
  
  -- Record assignment
  INSERT INTO ab_assignments (experiment_id, user_id, variant)
  VALUES (experiment_record.id, p_user_id, assigned_variant);
  
  RETURN assigned_variant;
END;
$$ LANGUAGE plpgsql;

-- Function to log A/B test events
CREATE OR REPLACE FUNCTION log_ab_event(
  p_user_id uuid,
  p_experiment_name text,
  p_event_type text,
  p_event_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
DECLARE
  experiment_id uuid;
  user_variant text;
BEGIN
  -- Get experiment ID
  SELECT id INTO experiment_id
  FROM ab_experiments
  WHERE name = p_experiment_name AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN; -- No active experiment
  END IF;
  
  -- Get user's variant
  SELECT variant INTO user_variant
  FROM ab_assignments
  WHERE experiment_id = experiment_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN; -- User not in experiment
  END IF;
  
  -- Log event
  INSERT INTO ab_events (experiment_id, user_id, variant, event_type, event_data)
  VALUES (experiment_id, p_user_id, user_variant, p_event_type, p_event_data);
END;
$$ LANGUAGE plpgsql;

-- Function to get experiment results
CREATE OR REPLACE FUNCTION get_experiment_results(p_experiment_name text)
RETURNS TABLE (
  variant text,
  users_count bigint,
  events_count bigint,
  avg_reflection_quality decimal,
  completion_rate decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.variant,
    COUNT(DISTINCT a.user_id) as users_count,
    COUNT(e.id) as events_count,
    AVG(COALESCE((e.event_data->>'quality')::decimal, 0)) as avg_reflection_quality,
    (COUNT(CASE WHEN e.event_type = 'reflection_completed' THEN 1 END)::decimal / 
     NULLIF(COUNT(CASE WHEN e.event_type = 'reflection_started' THEN 1 END), 0)) as completion_rate
  FROM ab_assignments a
  JOIN ab_experiments exp ON exp.id = a.experiment_id
  LEFT JOIN ab_events e ON e.experiment_id = a.experiment_id AND e.user_id = a.user_id
  WHERE exp.name = p_experiment_name
  GROUP BY a.variant;
END;
$$ LANGUAGE plpgsql;

-- View for easy experiment monitoring
CREATE OR REPLACE VIEW experiment_dashboard AS
SELECT 
  e.name,
  e.description,
  e.status,
  e.feature_type,
  e.traffic_split,
  COUNT(DISTINCT a.user_id) as total_users,
  COUNT(DISTINCT CASE WHEN a.variant = 'control' THEN a.user_id END) as control_users,
  COUNT(DISTINCT CASE WHEN a.variant = 'treatment' THEN a.user_id END) as treatment_users,
  COUNT(ev.id) as total_events,
  e.start_date,
  e.end_date
FROM ab_experiments e
LEFT JOIN ab_assignments a ON a.experiment_id = e.id
LEFT JOIN ab_events ev ON ev.experiment_id = e.id
GROUP BY e.id, e.name, e.description, e.status, e.feature_type, e.traffic_split, e.start_date, e.end_date;

-- Grant permissions
GRANT SELECT ON experiment_dashboard TO authenticated;