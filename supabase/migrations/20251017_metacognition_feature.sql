-- Metacognition Feature Database Schema
-- Create reflections table for student metacognitive reflections

CREATE TABLE IF NOT EXISTS reflections (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  classroom_id uuid REFERENCES classrooms(id) ON DELETE CASCADE,
  
  -- Problem context
  problem_description text NOT NULL,
  subject_area text NOT NULL,
  
  -- Student's reflection
  strategy_used text NOT NULL CHECK (strategy_used IN ('Visualize', 'Formula', 'Example', 'Trial-and-error', 'Break-down', 'Other')),
  reflection_text text NOT NULL,
  was_helpful boolean NOT NULL DEFAULT true,
  difficulty_rating integer CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  
  -- Teacher evaluation
  teacher_rating integer CHECK (teacher_rating >= 0 AND teacher_rating <= 2),
  teacher_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  teacher_feedback text,
  
  -- AI-generated feedback
  ai_feedback text,
  feedback_generated_at timestamptz,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reflections_student_id ON reflections(student_id);
CREATE INDEX IF NOT EXISTS idx_reflections_classroom_id ON reflections(classroom_id);
CREATE INDEX IF NOT EXISTS idx_reflections_assignment_id ON reflections(assignment_id);
CREATE INDEX IF NOT EXISTS idx_reflections_created_at ON reflections(created_at);

-- Add metacognition scoring to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS metacog_score decimal(5,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_reflections integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb;

-- Create badges table for badge definitions
CREATE TABLE IF NOT EXISTS badge_definitions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  criteria jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert initial badge definitions
INSERT INTO badge_definitions (name, description, icon, criteria) VALUES 
('Reflector', 'Completed first reflection', '🤔', '{"min_reflections": 1}'),
('Deep Thinker', 'Submitted 10 quality reflections', '🧠', '{"min_reflections": 10, "min_avg_rating": 1.5}'),
('Strategy Master', 'Used all available strategies', '🎯', '{"unique_strategies": 6}'),
('Growth Mindset', 'Maintained consistent reflection practice', '🌱', '{"reflections_last_30_days": 5, "min_avg_rating": 1.0}')
ON CONFLICT (name) DO NOTHING;

-- Create student_badges junction table
CREATE TABLE IF NOT EXISTS student_badges (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(student_id, badge_id)
);

-- Add RLS policies
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

-- Reflections policies
CREATE POLICY "Students can view their own reflections" ON reflections
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create their own reflections" ON reflections
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own reflections" ON reflections
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Teachers can view reflections from their classrooms" ON reflections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classroom_members cm
      JOIN classrooms c ON c.id = cm.classroom_id
      WHERE c.teacher_id = auth.uid() 
      AND cm.classroom_id = reflections.classroom_id
    )
  );

CREATE POLICY "Teachers can rate reflections from their classrooms" ON reflections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM classroom_members cm
      JOIN classrooms c ON c.id = cm.classroom_id
      WHERE c.teacher_id = auth.uid() 
      AND cm.classroom_id = reflections.classroom_id
    )
  );

-- Badge definitions policies (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view badge definitions" ON badge_definitions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Student badges policies
CREATE POLICY "Students can view their own badges" ON student_badges
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view badges of their students" ON student_badges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classroom_members cm
      JOIN classrooms c ON c.id = cm.classroom_id
      WHERE c.teacher_id = auth.uid() 
      AND cm.student_id = student_badges.student_id
    )
  );

-- Function to automatically update metacognition scores
CREATE OR REPLACE FUNCTION update_metacog_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate metacog score for the student
  UPDATE profiles 
  SET 
    metacog_score = (
      SELECT COALESCE(
        (
          -- Base score from reflection quality (length and keywords)
          AVG(
            CASE 
              WHEN LENGTH(reflection_text) > 100 THEN 0.3
              WHEN LENGTH(reflection_text) > 50 THEN 0.2
              ELSE 0.1
            END +
            CASE 
              WHEN reflection_text ~* 'because|since|therefore|however|although' THEN 0.3
              ELSE 0.0
            END +
            -- Teacher rating component
            CASE 
              WHEN teacher_rating IS NOT NULL THEN teacher_rating * 0.4
              ELSE 0.0
            END
          ) * 10
        ), 0.0
      )
      FROM reflections 
      WHERE student_id = NEW.student_id
    ),
    total_reflections = (
      SELECT COUNT(*) 
      FROM reflections 
      WHERE student_id = NEW.student_id
    )
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update metacog score on reflection changes
CREATE OR REPLACE TRIGGER update_metacog_score_trigger
  AFTER INSERT OR UPDATE ON reflections
  FOR EACH ROW
  EXECUTE FUNCTION update_metacog_score();

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
  badge_record RECORD;
  student_data RECORD;
BEGIN
  -- Get current student data
  SELECT 
    p.*,
    COUNT(r.id) as total_reflections,
    AVG(r.teacher_rating) as avg_rating,
    COUNT(DISTINCT r.strategy_used) as unique_strategies,
    COUNT(CASE WHEN r.created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_reflections
  INTO student_data
  FROM profiles p
  LEFT JOIN reflections r ON r.student_id = p.id
  WHERE p.id = NEW.student_id
  GROUP BY p.id;
  
  -- Check each badge criteria
  FOR badge_record IN SELECT * FROM badge_definitions LOOP
    -- Check if student already has this badge
    IF NOT EXISTS (
      SELECT 1 FROM student_badges 
      WHERE student_id = NEW.student_id AND badge_id = badge_record.id
    ) THEN
      -- Check Reflector badge
      IF badge_record.name = 'Reflector' AND student_data.total_reflections >= 1 THEN
        INSERT INTO student_badges (student_id, badge_id) 
        VALUES (NEW.student_id, badge_record.id);
      END IF;
      
      -- Check Deep Thinker badge
      IF badge_record.name = 'Deep Thinker' AND 
         student_data.total_reflections >= 10 AND 
         student_data.avg_rating >= 1.5 THEN
        INSERT INTO student_badges (student_id, badge_id) 
        VALUES (NEW.student_id, badge_record.id);
      END IF;
      
      -- Check Strategy Master badge
      IF badge_record.name = 'Strategy Master' AND student_data.unique_strategies >= 6 THEN
        INSERT INTO student_badges (student_id, badge_id) 
        VALUES (NEW.student_id, badge_record.id);
      END IF;
      
      -- Check Growth Mindset badge
      IF badge_record.name = 'Growth Mindset' AND 
         student_data.recent_reflections >= 5 AND 
         student_data.avg_rating >= 1.0 THEN
        INSERT INTO student_badges (student_id, badge_id) 
        VALUES (NEW.student_id, badge_record.id);
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check badges on reflection changes
CREATE OR REPLACE TRIGGER check_badges_trigger
  AFTER INSERT OR UPDATE ON reflections
  FOR EACH ROW
  EXECUTE FUNCTION check_and_award_badges();