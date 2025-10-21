-- Create content scaffolding tables
CREATE TABLE content_difficulty_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_name VARCHAR(50) NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'expert'
    level_number INTEGER NOT NULL CHECK (level_number >= 1 AND level_number <= 5),
    min_metacog_score DECIMAL(4,3) NOT NULL, -- Minimum score to access this level
    max_metacog_score DECIMAL(4,3) NOT NULL, -- Maximum score for this level
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(level_number)
);

CREATE TABLE adaptive_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(30) NOT NULL, -- 'problem', 'hint', 'scaffold', 'reflection_prompt'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    difficulty_level INTEGER REFERENCES content_difficulty_levels(level_number),
    subject_area VARCHAR(100),
    learning_objective VARCHAR(255),
    metacog_strategies TEXT[], -- Which strategies this content targets
    prerequisite_concepts TEXT[], -- What students should know first
    estimated_time_minutes INTEGER,
    content_metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_content_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id UUID REFERENCES adaptive_content(id) ON DELETE CASCADE,
    interaction_type VARCHAR(30) NOT NULL, -- 'viewed', 'attempted', 'completed', 'skipped'
    performance_score DECIMAL(4,3), -- How well they did (0-1)
    time_spent_seconds INTEGER,
    help_requests INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    interaction_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX(student_id, created_at)
);

CREATE TABLE scaffolding_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recommended_content_id UUID REFERENCES adaptive_content(id) ON DELETE CASCADE,
    recommendation_reason VARCHAR(100) NOT NULL, -- 'difficulty_adjustment', 'strategy_support', 'prerequisite_gap'
    confidence_score DECIMAL(4,3) NOT NULL, -- How confident the system is in this recommendation
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(student_id, recommended_content_id)
);

-- Create parent portal tables
CREATE TABLE parent_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hashed_password TEXT NOT NULL,
    phone_number VARCHAR(20),
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "weekly_summary": true}'::jsonb,
    is_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE TABLE parent_student_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES parent_accounts(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) DEFAULT 'parent', -- 'parent', 'guardian', 'caregiver'
    permission_level VARCHAR(20) DEFAULT 'full', -- 'full', 'limited', 'view_only'
    is_primary_contact BOOLEAN DEFAULT false,
    approved_by_teacher BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

CREATE TABLE parent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES parent_accounts(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'weekly_summary', 'achievement_earned', 'low_performance', 'teacher_message'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    is_read BOOLEAN DEFAULT false,
    sent_via_email BOOLEAN DEFAULT false,
    sent_via_sms BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE TABLE parent_teacher_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES parent_accounts(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('parent', 'teacher')),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    replied_to_message_id UUID REFERENCES parent_teacher_messages(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE TABLE parent_dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES parent_accounts(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    dashboard_layout JSONB DEFAULT '{"widgets": ["progress", "achievements", "recent_activity"], "refresh_frequency": "daily"}'::jsonb,
    privacy_settings JSONB DEFAULT '{"show_detailed_scores": true, "share_with_teacher": true}'::jsonb,
    alert_thresholds JSONB DEFAULT '{"low_metacog_score": 0.3, "infrequent_activity": 3}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- Create indexes for performance
CREATE INDEX idx_adaptive_content_difficulty ON adaptive_content(difficulty_level);
CREATE INDEX idx_adaptive_content_subject ON adaptive_content(subject_area);
CREATE INDEX idx_student_content_interactions_student_date ON student_content_interactions(student_id, created_at);
CREATE INDEX idx_scaffolding_recommendations_student_active ON scaffolding_recommendations(student_id, is_active);
CREATE INDEX idx_parent_accounts_email ON parent_accounts(email);
CREATE INDEX idx_parent_student_relationships_parent ON parent_student_relationships(parent_id);
CREATE INDEX idx_parent_student_relationships_student ON parent_student_relationships(student_id);
CREATE INDEX idx_parent_notifications_parent_unread ON parent_notifications(parent_id, is_read);
CREATE INDEX idx_parent_teacher_messages_participants ON parent_teacher_messages(parent_id, teacher_id, student_id);

-- Row Level Security
ALTER TABLE content_difficulty_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scaffolding_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_teacher_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_dashboard_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Content Scaffolding

-- Content difficulty levels - everyone can view
CREATE POLICY "Everyone can view difficulty levels" ON content_difficulty_levels
    FOR SELECT USING (true);

-- Adaptive content - students and teachers can view active content
CREATE POLICY "Students and teachers can view content" ON adaptive_content
    FOR SELECT USING (
        is_active = true AND (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('student', 'teacher'))
        )
    );

-- Student content interactions - students can manage their own interactions
CREATE POLICY "Students can manage their interactions" ON student_content_interactions
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view student interactions" ON student_content_interactions
    FOR SELECT USING (
        student_id IN (
            SELECT cm.student_id FROM classroom_members cm
            JOIN classrooms c ON c.id = cm.classroom_id
            WHERE c.teacher_id = auth.uid()
        )
    );

-- Scaffolding recommendations - students can view their recommendations
CREATE POLICY "Students can view their recommendations" ON scaffolding_recommendations
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage recommendations for their students" ON scaffolding_recommendations
    FOR ALL USING (
        student_id IN (
            SELECT cm.student_id FROM classroom_members cm
            JOIN classrooms c ON c.id = cm.classroom_id
            WHERE c.teacher_id = auth.uid()
        )
    );

-- RLS Policies for Parent Portal

-- Parent accounts - users can manage their own accounts
CREATE POLICY "Parents can manage their accounts" ON parent_accounts
    FOR ALL USING (id = auth.uid());

-- Parent-student relationships - parents can view their relationships
CREATE POLICY "Parents can view their relationships" ON parent_student_relationships
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Teachers can view relationships for their students" ON parent_student_relationships
    FOR SELECT USING (
        student_id IN (
            SELECT cm.student_id FROM classroom_members cm
            JOIN classrooms c ON c.id = cm.classroom_id
            WHERE c.teacher_id = auth.uid()
        )
    );

-- Parent notifications - parents can view their notifications
CREATE POLICY "Parents can view their notifications" ON parent_notifications
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parents can update notification read status" ON parent_notifications
    FOR UPDATE USING (parent_id = auth.uid());

-- Parent-teacher messages - parents and teachers can view relevant messages
CREATE POLICY "Parents can view their messages" ON parent_teacher_messages
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Teachers can view their messages" ON parent_teacher_messages
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Parents can send messages" ON parent_teacher_messages
    FOR INSERT WITH CHECK (parent_id = auth.uid() AND sender_type = 'parent');

CREATE POLICY "Teachers can send messages" ON parent_teacher_messages
    FOR INSERT WITH CHECK (teacher_id = auth.uid() AND sender_type = 'teacher');

-- Parent dashboard settings - parents can manage their settings
CREATE POLICY "Parents can manage their dashboard settings" ON parent_dashboard_settings
    FOR ALL USING (parent_id = auth.uid());

-- Insert default difficulty levels
INSERT INTO content_difficulty_levels (level_name, level_number, min_metacog_score, max_metacog_score, description) VALUES
('Beginner', 1, 0.0, 0.2, 'Basic problems with extensive scaffolding and hints'),
('Novice', 2, 0.2, 0.4, 'Simple problems with moderate guidance'),
('Intermediate', 3, 0.4, 0.6, 'Standard problems with minimal hints'),
('Advanced', 4, 0.6, 0.8, 'Challenging problems requiring strategic thinking'),
('Expert', 5, 0.8, 1.0, 'Complex problems with no additional support');

-- Functions for adaptive content system
CREATE OR REPLACE FUNCTION get_recommended_content_for_student(student_uuid UUID)
RETURNS TABLE (
    content_id UUID,
    content_title VARCHAR(255),
    content_type VARCHAR(30),
    difficulty_level INTEGER,
    recommendation_reason VARCHAR(100),
    confidence_score DECIMAL(4,3)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_metacog_score DECIMAL(4,3);
    student_difficulty_level INTEGER;
BEGIN
    -- Get student's current metacognition score
    SELECT metacog_score INTO student_metacog_score
    FROM profiles 
    WHERE id = student_uuid;
    
    -- Determine appropriate difficulty level
    SELECT level_number INTO student_difficulty_level
    FROM content_difficulty_levels
    WHERE student_metacog_score >= min_metacog_score 
      AND student_metacog_score <= max_metacog_score
    LIMIT 1;
    
    -- Return recommended content
    RETURN QUERY
    SELECT 
        sr.recommended_content_id,
        ac.title,
        ac.content_type,
        ac.difficulty_level,
        sr.recommendation_reason,
        sr.confidence_score
    FROM scaffolding_recommendations sr
    JOIN adaptive_content ac ON sr.recommended_content_id = ac.id
    WHERE sr.student_id = student_uuid 
      AND sr.is_active = true
      AND (sr.expires_at IS NULL OR sr.expires_at > NOW())
    ORDER BY sr.priority ASC, sr.confidence_score DESC
    LIMIT 10;
END;
$$;

CREATE OR REPLACE FUNCTION generate_scaffolding_recommendations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_record RECORD;
    appropriate_level INTEGER;
    content_record RECORD;
BEGIN
    -- Clear old recommendations
    DELETE FROM scaffolding_recommendations WHERE expires_at < NOW();
    
    -- Generate new recommendations for all active students
    FOR student_record IN 
        SELECT id, metacog_score, updated_at
        FROM profiles 
        WHERE role = 'student' 
          AND updated_at > NOW() - INTERVAL '7 days'
    LOOP
        -- Determine appropriate difficulty level
        SELECT level_number INTO appropriate_level
        FROM content_difficulty_levels
        WHERE student_record.metacog_score >= min_metacog_score 
          AND student_record.metacog_score <= max_metacog_score
        LIMIT 1;
        
        -- Recommend content at appropriate level
        FOR content_record IN
            SELECT id, title, difficulty_level
            FROM adaptive_content
            WHERE difficulty_level = appropriate_level
              AND is_active = true
              AND id NOT IN (
                  SELECT content_id 
                  FROM student_content_interactions 
                  WHERE student_id = student_record.id 
                    AND interaction_type = 'completed'
              )
            LIMIT 3
        LOOP
            INSERT INTO scaffolding_recommendations (
                student_id,
                recommended_content_id,
                recommendation_reason,
                confidence_score,
                priority,
                expires_at
            ) VALUES (
                student_record.id,
                content_record.id,
                'difficulty_adjustment',
                0.8, -- High confidence for level-appropriate content
                2,
                NOW() + INTERVAL '14 days'
            )
            ON CONFLICT (student_id, recommended_content_id) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$;

-- Function to generate parent progress reports
CREATE OR REPLACE FUNCTION generate_parent_progress_report(
    p_student_id UUID,
    p_parent_id UUID,
    p_period_days INTEGER DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    report JSONB := '{}'::jsonb;
    current_score DECIMAL(4,3);
    score_change DECIMAL(4,3);
    reflection_count INTEGER;
    achievement_count INTEGER;
    collaboration_count INTEGER;
    recent_achievements JSONB;
BEGIN
    -- Get current metacognition score
    SELECT metacog_score INTO current_score
    FROM profiles 
    WHERE id = p_student_id;
    
    -- Calculate score change over period
    SELECT 
        current_score - COALESCE(AVG(metacog_score), current_score) INTO score_change
    FROM student_progress_trends
    WHERE student_id = p_student_id 
      AND date >= CURRENT_DATE - INTERVAL (p_period_days || ' days')
      AND date < CURRENT_DATE - INTERVAL (p_period_days/2 || ' days');
    
    -- Count activities in period
    SELECT COUNT(*) INTO reflection_count
    FROM metacog_events
    WHERE user_id = p_student_id 
      AND event_type = 'reflection_submitted'
      AND created_at >= NOW() - INTERVAL (p_period_days || ' days');
    
    SELECT COUNT(*) INTO collaboration_count
    FROM metacog_events
    WHERE user_id = p_student_id 
      AND event_type IN ('peer_comment_added', 'reflection_shared')
      AND created_at >= NOW() - INTERVAL (p_period_days || ' days');
    
    SELECT COUNT(*) INTO achievement_count
    FROM student_achievements
    WHERE student_id = p_student_id 
      AND earned_at >= NOW() - INTERVAL (p_period_days || ' days');
    
    -- Get recent achievements
    SELECT jsonb_agg(
        jsonb_build_object(
            'name', achievement_name,
            'type', achievement_type,
            'points', points_awarded,
            'earned_at', earned_at
        )
    ) INTO recent_achievements
    FROM student_achievements
    WHERE student_id = p_student_id 
      AND earned_at >= NOW() - INTERVAL (p_period_days || ' days')
    ORDER BY earned_at DESC
    LIMIT 5;
    
    -- Build report
    report := jsonb_build_object(
        'period_days', p_period_days,
        'current_metacog_score', current_score,
        'score_change', COALESCE(score_change, 0),
        'reflection_count', reflection_count,
        'collaboration_count', collaboration_count,
        'achievement_count', achievement_count,
        'recent_achievements', COALESCE(recent_achievements, '[]'::jsonb),
        'generated_at', NOW()
    );
    
    RETURN report;
END;
$$;

-- Sample adaptive content
INSERT INTO adaptive_content (content_type, title, content, difficulty_level, subject_area, learning_objective, metacog_strategies, estimated_time_minutes) VALUES
('problem', 'Basic Algebra Problem', 'Solve for x: 2x + 3 = 7', 1, 'Mathematics', 'Solve simple linear equations', ARRAY['planning', 'checking'], 5),
('hint', 'Algebra Hint: Isolation Strategy', 'Try to isolate the variable by moving numbers to one side of the equation.', 1, 'Mathematics', 'Provide strategic guidance', ARRAY['planning'], 2),
('scaffold', 'Step-by-Step Equation Solving', 'Step 1: Identify the variable\nStep 2: Move constants to right side\nStep 3: Divide by coefficient', 2, 'Mathematics', 'Provide structured approach', ARRAY['planning', 'monitoring'], 3),
('reflection_prompt', 'Problem-Solving Reflection', 'What strategy did you use to solve this problem? How did you know it was working?', 3, 'Mathematics', 'Encourage metacognitive reflection', ARRAY['evaluation', 'reflection'], 5),
('problem', 'Advanced Quadratic Problem', 'Solve: x² - 5x + 6 = 0 using two different methods', 4, 'Mathematics', 'Apply multiple solution strategies', ARRAY['planning', 'evaluation', 'comparison'], 15);