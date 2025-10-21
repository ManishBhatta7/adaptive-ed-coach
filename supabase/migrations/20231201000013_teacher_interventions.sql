-- Create teacher intervention tables
CREATE TABLE intervention_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    intervention_type VARCHAR(50) NOT NULL, -- 'strategy_reminder', 'personal_check_in', 'resource_suggestion', 'group_discussion', 'one_on_one'
    trigger_conditions JSONB DEFAULT '{}'::jsonb, -- Conditions that suggest this intervention
    content_template TEXT NOT NULL, -- Template with placeholders
    estimated_duration INTEGER, -- in minutes
    requires_meeting BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_system_template BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teacher_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES intervention_templates(id) ON DELETE SET NULL,
    intervention_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL, -- Actual intervention content
    trigger_reason JSONB DEFAULT '{}'::jsonb, -- Why this intervention was triggered
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 1=urgent, 5=low
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    scheduled_for TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    completion_notes TEXT,
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    student_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE intervention_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervention_id UUID REFERENCES teacher_interventions(id) ON DELETE CASCADE,
    resource_type VARCHAR(30) NOT NULL, -- 'article', 'video', 'exercise', 'strategy_guide', 'reflection_prompt'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT,
    content TEXT,
    is_required BOOLEAN DEFAULT false,
    estimated_time INTEGER, -- in minutes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE intervention_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'low_metacog_score', 'declining_performance', 'infrequent_reflection', 'strategy_struggles'
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    data_points JSONB DEFAULT '{}'::jsonb, -- Supporting data for the alert
    suggested_interventions UUID[], -- Array of intervention template IDs
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE student_support_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_name VARCHAR(255) NOT NULL,
    description TEXT,
    goals JSONB DEFAULT '[]'::jsonb, -- Array of specific goals
    current_challenges JSONB DEFAULT '[]'::jsonb, -- Current areas needing support
    strategies_to_focus JSONB DEFAULT '[]'::jsonb, -- Metacognitive strategies to emphasize
    target_metacog_score DECIMAL(3,2),
    review_frequency INTEGER DEFAULT 7, -- days between reviews
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_intervention_templates_type ON intervention_templates(intervention_type);
CREATE INDEX idx_teacher_interventions_teacher ON teacher_interventions(teacher_id);
CREATE INDEX idx_teacher_interventions_student ON teacher_interventions(student_id);
CREATE INDEX idx_teacher_interventions_status ON teacher_interventions(status);
CREATE INDEX idx_teacher_interventions_scheduled ON teacher_interventions(scheduled_for);
CREATE INDEX idx_intervention_alerts_teacher ON intervention_alerts(teacher_id);
CREATE INDEX idx_intervention_alerts_unread ON intervention_alerts(teacher_id, is_read) WHERE is_read = false;
CREATE INDEX idx_student_support_plans_student ON student_support_plans(student_id);
CREATE INDEX idx_student_support_plans_teacher ON student_support_plans(teacher_id);

-- Row Level Security
ALTER TABLE intervention_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_support_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Intervention Templates: Teachers can view all, create their own
CREATE POLICY "Teachers can view intervention templates" ON intervention_templates
    FOR SELECT USING (
        is_system_template = true OR 
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Teachers can create intervention templates" ON intervention_templates
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Teachers can update their templates" ON intervention_templates
    FOR UPDATE USING (
        created_by = auth.uid() OR
        (is_system_template = false AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'))
    );

-- Teacher Interventions: Teachers see interventions for their students
CREATE POLICY "Teachers can manage student interventions" ON teacher_interventions
    FOR ALL USING (
        teacher_id = auth.uid() OR
        (student_id IN (
            SELECT cm.student_id FROM classroom_members cm
            JOIN classrooms c ON c.id = cm.classroom_id
            WHERE c.teacher_id = auth.uid()
        ))
    );

CREATE POLICY "Students can view their interventions" ON teacher_interventions
    FOR SELECT USING (student_id = auth.uid());

-- Intervention Resources: Teachers and target students can view
CREATE POLICY "Teachers and students can view intervention resources" ON intervention_resources
    FOR SELECT USING (
        intervention_id IN (
            SELECT id FROM teacher_interventions 
            WHERE teacher_id = auth.uid() OR student_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can manage intervention resources" ON intervention_resources
    FOR ALL USING (
        intervention_id IN (
            SELECT id FROM teacher_interventions WHERE teacher_id = auth.uid()
        )
    );

-- Intervention Alerts: Teachers see alerts for their students
CREATE POLICY "Teachers can view their alerts" ON intervention_alerts
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can manage their alerts" ON intervention_alerts
    FOR UPDATE USING (teacher_id = auth.uid());

-- Support Plans: Teachers and students can view relevant plans
CREATE POLICY "Teachers can manage support plans" ON student_support_plans
    FOR ALL USING (
        teacher_id = auth.uid() OR
        student_id IN (
            SELECT cm.student_id FROM classroom_members cm
            JOIN classrooms c ON c.id = cm.classroom_id
            WHERE c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can view their support plans" ON student_support_plans
    FOR SELECT USING (student_id = auth.uid());

-- System intervention templates
INSERT INTO intervention_templates (name, description, intervention_type, trigger_conditions, content_template, estimated_duration, requires_meeting, is_system_template) VALUES 
('Low Metacognition Check-in', 'Personal meeting for students with consistently low metacognitive scores', 'personal_check_in', 
 '{"min_score": 0.3, "trend": "declining"}', 
 'Hi {{student_name}}, I''ve noticed your reflection scores have been lower recently. Let''s schedule a quick chat to discuss strategies that might help you think through problems more effectively. What''s been challenging for you lately?', 
 15, true, true),

('Strategy Reminder', 'Gentle reminder about specific metacognitive strategies', 'strategy_reminder', 
 '{"strategy_usage": "low", "specific_strategy": "planning"}', 
 'Remember to try the {{strategy_name}} strategy we discussed! Here''s a quick reminder: {{strategy_description}}. Try using this on your next problem and see how it goes.', 
 5, false, true),

('Resource Suggestion', 'Share helpful learning resources', 'resource_suggestion', 
 '{"performance_area": "struggling"}', 
 'I found some resources that might help with {{topic}}. Check out these materials when you have a chance: {{resources}}. Let me know if you find them helpful!', 
 10, false, true),

('Group Discussion Prompt', 'Facilitate peer learning through group discussion', 'group_discussion', 
 '{"peer_collaboration": "low"}', 
 'Let''s organize a small group discussion about {{topic}}. You and {{peer_names}} could benefit from sharing your different approaches to this type of problem.', 
 30, true, true),

('One-on-One Strategy Session', 'Intensive individual support session', 'one_on_one', 
 '{"multiple_struggles": true, "urgency": "high"}', 
 'I''d like to schedule a focused session to work on your problem-solving strategies. We''ll practice the {{strategies}} techniques and develop a personalized approach that works for you.', 
 45, true, true);

-- Functions for intervention management
CREATE OR REPLACE FUNCTION trigger_intervention_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_record RECORD;
    teacher_id UUID;
    alert_data JSONB;
BEGIN
    -- Check for low metacognition scores
    FOR student_record IN 
        SELECT p.id, p.name, p.metacog_score, cm.classroom_id,
               c.teacher_id as teacher_id
        FROM profiles p
        JOIN classroom_members cm ON p.id = cm.student_id
        JOIN classrooms c ON cm.classroom_id = c.id
        WHERE p.role = 'student' 
          AND p.metacog_score < 0.4
          AND p.updated_at > NOW() - INTERVAL '24 hours'
    LOOP
        -- Check if alert already exists recently
        IF NOT EXISTS (
            SELECT 1 FROM intervention_alerts 
            WHERE student_id = student_record.id 
              AND teacher_id = student_record.teacher_id
              AND alert_type = 'low_metacog_score'
              AND created_at > NOW() - INTERVAL '7 days'
        ) THEN
            INSERT INTO intervention_alerts (
                teacher_id, student_id, alert_type, severity, title, description, data_points,
                suggested_interventions
            ) VALUES (
                student_record.teacher_id,
                student_record.id,
                'low_metacog_score',
                CASE 
                    WHEN student_record.metacog_score < 0.2 THEN 'urgent'
                    WHEN student_record.metacog_score < 0.3 THEN 'high'
                    ELSE 'medium'
                END,
                student_record.name || ' has a low metacognition score',
                'Student is showing signs of metacognitive difficulties and may benefit from targeted interventions.',
                jsonb_build_object(
                    'current_score', student_record.metacog_score,
                    'threshold', 0.4,
                    'last_updated', student_record.updated_at
                ),
                (SELECT ARRAY[id] FROM intervention_templates WHERE intervention_type = 'personal_check_in' AND is_system_template = true LIMIT 1)
            );
        END IF;
    END LOOP;

    -- Check for infrequent reflection
    FOR student_record IN 
        SELECT p.id, p.name, cm.classroom_id, c.teacher_id,
               COUNT(me.id) as reflection_count
        FROM profiles p
        JOIN classroom_members cm ON p.id = cm.student_id
        JOIN classrooms c ON cm.classroom_id = c.id
        LEFT JOIN metacog_events me ON p.id = me.user_id 
            AND me.event_type = 'reflection_submitted'
            AND me.created_at > NOW() - INTERVAL '7 days'
        WHERE p.role = 'student'
        GROUP BY p.id, p.name, cm.classroom_id, c.teacher_id
        HAVING COUNT(me.id) < 2
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM intervention_alerts 
            WHERE student_id = student_record.id 
              AND teacher_id = student_record.teacher_id
              AND alert_type = 'infrequent_reflection'
              AND created_at > NOW() - INTERVAL '7 days'
        ) THEN
            INSERT INTO intervention_alerts (
                teacher_id, student_id, alert_type, severity, title, description, data_points,
                suggested_interventions
            ) VALUES (
                student_record.teacher_id,
                student_record.id,
                'infrequent_reflection',
                'medium',
                student_record.name || ' has been reflecting infrequently',
                'Student has submitted fewer than 2 reflections in the past week.',
                jsonb_build_object(
                    'reflection_count', student_record.reflection_count,
                    'time_period', '7 days',
                    'expected_minimum', 2
                ),
                (SELECT ARRAY[id] FROM intervention_templates WHERE intervention_type = 'strategy_reminder' AND is_system_template = true LIMIT 1)
            );
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION create_intervention_from_template(
    p_teacher_id UUID,
    p_student_id UUID,
    p_template_id UUID,
    p_scheduled_for TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template_record RECORD;
    intervention_id UUID;
    student_name TEXT;
BEGIN
    -- Get template details
    SELECT * INTO template_record 
    FROM intervention_templates 
    WHERE id = p_template_id;
    
    IF template_record IS NULL THEN
        RAISE EXCEPTION 'Template not found';
    END IF;
    
    -- Get student name for template substitution
    SELECT name INTO student_name 
    FROM profiles 
    WHERE id = p_student_id;
    
    -- Create intervention
    INSERT INTO teacher_interventions (
        teacher_id, student_id, template_id, intervention_type, 
        title, description, content, priority, scheduled_for
    ) VALUES (
        p_teacher_id, p_student_id, p_template_id, template_record.intervention_type,
        template_record.name,
        template_record.description,
        replace(template_record.content_template, '{{student_name}}', student_name),
        3, -- default priority
        COALESCE(p_scheduled_for, CASE WHEN template_record.requires_meeting THEN NOW() + INTERVAL '1 day' ELSE NOW() END)
    )
    RETURNING id INTO intervention_id;
    
    RETURN intervention_id;
END;
$$;