-- Real-Time Collaboration System Migration
-- Week 7-8 Advanced Features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =============================================
-- COLLABORATION SESSIONS
-- =============================================

-- Main collaboration sessions table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('problem_solving', 'peer_review', 'discussion', 'study_group')),
    host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    max_participants INTEGER DEFAULT 4 CHECK (max_participants BETWEEN 2 AND 20),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    problem_content TEXT,
    target_strategies TEXT[],
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    session_config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Session participants junction table
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('host', 'participant', 'observer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    contribution_count INTEGER DEFAULT 0,
    metacog_score_before DECIMAL(3,2),
    metacog_score_after DECIMAL(3,2),
    engagement_score DECIMAL(3,2),
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    UNIQUE(session_id, user_id)
);

-- Session messages for real-time chat
CREATE TABLE IF NOT EXISTS session_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    user_avatar TEXT,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'strategy_share', 'reflection', 'question', 'insight', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    reactions JSONB DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared strategies within sessions
CREATE TABLE IF NOT EXISTS shared_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    strategy_name VARCHAR(255) NOT NULL,
    description TEXT,
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    shared_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    shared_by_name VARCHAR(255),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    implementation_notes TEXT,
    evidence_provided TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy votes
CREATE TABLE IF NOT EXISTS strategy_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID NOT NULL REFERENCES shared_strategies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(strategy_id, user_id)
);

-- =============================================
-- AI TUTORING SYSTEM
-- =============================================

-- AI tutor sessions
CREATE TABLE IF NOT EXISTS ai_tutor_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_type VARCHAR(50) DEFAULT 'adaptive_tutoring' CHECK (session_type IN ('adaptive_tutoring', 'hint_generation', 'problem_scaffolding', 'concept_explanation')),
    context_data JSONB NOT NULL DEFAULT '{}',
    current_problem TEXT,
    learning_objectives TEXT[],
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_interactions INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2)
);

-- AI tutor interactions
CREATE TABLE IF NOT EXISTS ai_tutor_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ai_tutor_sessions(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('question', 'hint', 'explanation', 'feedback', 'scaffold', 'assessment')),
    student_input TEXT,
    ai_response TEXT NOT NULL,
    response_quality_score DECIMAL(3,2),
    student_satisfaction INTEGER CHECK (student_satisfaction BETWEEN 1 AND 5),
    helped_learning BOOLEAN,
    metacognitive_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_time_ms INTEGER,
    confidence_score DECIMAL(3,2)
);

-- AI tutor knowledge base
CREATE TABLE IF NOT EXISTS ai_tutor_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concept_name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    prerequisites TEXT[],
    learning_strategies JSONB DEFAULT '{}',
    common_misconceptions JSONB DEFAULT '{}',
    example_problems JSONB DEFAULT '{}',
    scaffolding_templates JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ASSESSMENT INTEGRATION
-- =============================================

-- Comprehensive assessments
CREATE TABLE IF NOT EXISTS comprehensive_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('metacognitive', 'formative', 'summative', 'diagnostic', 'peer_assessment')),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    instructions TEXT,
    time_limit_minutes INTEGER,
    total_points INTEGER DEFAULT 0,
    passing_score DECIMAL(5,2),
    rubric JSONB DEFAULT '{}',
    adaptive_scoring BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment questions
CREATE TABLE IF NOT EXISTS assessment_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES comprehensive_assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer', 'essay', 'reflection', 'strategy_selection', 'self_assessment')),
    options JSONB DEFAULT '{}',
    correct_answers JSONB DEFAULT '{}',
    points INTEGER DEFAULT 1,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    metacognitive_dimension VARCHAR(50),
    order_index INTEGER,
    required BOOLEAN DEFAULT TRUE,
    feedback_template TEXT
);

-- Student assessment attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES comprehensive_assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'timed_out')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_score DECIMAL(5,2),
    percentage_score DECIMAL(5,2),
    time_spent_minutes INTEGER,
    metacognitive_insights JSONB DEFAULT '{}',
    feedback_generated TEXT,
    improvement_suggestions JSONB DEFAULT '{}'
);

-- Student responses to assessment questions
CREATE TABLE IF NOT EXISTS assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    response_data JSONB NOT NULL,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    time_spent_seconds INTEGER,
    reflection_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PWA AND MOBILE FEATURES
-- =============================================

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- Offline data sync
CREATE TABLE IF NOT EXISTS offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    operation_data JSONB NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'conflicted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT
);

-- Mobile app preferences
CREATE TABLE IF NOT EXISTS mobile_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_settings JSONB DEFAULT '{}',
    theme_preferences JSONB DEFAULT '{}',
    accessibility_settings JSONB DEFAULT '{}',
    offline_mode_enabled BOOLEAN DEFAULT TRUE,
    data_usage_limit_mb INTEGER,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================
-- EXTERNAL LMS INTEGRATION
-- =============================================

-- LMS connections
CREATE TABLE IF NOT EXISTS lms_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    lms_type VARCHAR(50) NOT NULL CHECK (lms_type IN ('canvas', 'blackboard', 'moodle', 'google_classroom', 'schoology')),
    lms_course_id VARCHAR(255) NOT NULL,
    connection_config JSONB NOT NULL DEFAULT '{}',
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'connected' CHECK (sync_status IN ('connected', 'error', 'disconnected')),
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LMS grade sync
CREATE TABLE IF NOT EXISTS lms_grade_sync (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES lms_integrations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assignment_type VARCHAR(50) NOT NULL,
    assignment_id VARCHAR(255),
    metacog_score DECIMAL(3,2),
    lms_grade DECIMAL(5,2),
    sync_status VARCHAR(20) DEFAULT 'pending',
    synced_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SECURITY AND PRIVACY
-- =============================================

-- Audit log for educational data
CREATE TABLE IF NOT EXISTS educational_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    compliance_flags JSONB DEFAULT '{}'
);

-- Data encryption keys (for FERPA compliance)
CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_name VARCHAR(100) NOT NULL UNIQUE,
    encrypted_key TEXT NOT NULL,
    key_version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Privacy settings per user
CREATE TABLE IF NOT EXISTS privacy_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    data_sharing_consent BOOLEAN DEFAULT FALSE,
    analytics_tracking BOOLEAN DEFAULT TRUE,
    parent_notifications BOOLEAN DEFAULT TRUE,
    peer_visibility BOOLEAN DEFAULT TRUE,
    research_participation BOOLEAN DEFAULT FALSE,
    data_retention_period INTEGER DEFAULT 2555, -- 7 years in days (FERPA requirement)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================
-- SYSTEM ADMINISTRATION
-- =============================================

-- System configuration
CREATE TABLE IF NOT EXISTS system_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    last_modified_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health monitoring
CREATE TABLE IF NOT EXISTS system_health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(20),
    threshold_warning DECIMAL(10,2),
    threshold_critical DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical')),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance optimization cache
CREATE TABLE IF NOT EXISTS performance_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    cache_data JSONB NOT NULL,
    cache_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MULTILINGUAL SUPPORT
-- =============================================

-- Language translations
CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    translation_key VARCHAR(255) NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    context_notes TEXT,
    translator_id UUID REFERENCES profiles(id),
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(translation_key, language_code)
);

-- User language preferences
CREATE TABLE IF NOT EXISTS user_language_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    primary_language VARCHAR(10) DEFAULT 'en',
    secondary_languages VARCHAR(10)[],
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    time_format VARCHAR(10) DEFAULT '12h',
    number_format VARCHAR(20) DEFAULT 'US',
    timezone VARCHAR(50) DEFAULT 'UTC',
    cultural_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Collaboration sessions indexes
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_host_id ON collaboration_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_status ON collaboration_sessions(status);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_created_at ON collaboration_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_session_type ON collaboration_sessions(session_type);

-- Session participants indexes
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_active ON session_participants(session_id, is_active);

-- Session messages indexes
CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_created_at ON session_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_messages_user_id ON session_messages(user_id);

-- AI tutor indexes
CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_student_id ON ai_tutor_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_interactions_session_id ON ai_tutor_interactions(session_id);

-- Assessment indexes
CREATE INDEX IF NOT EXISTS idx_comprehensive_assessments_classroom_id ON comprehensive_assessments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student_id ON assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment_id ON assessment_attempts(assessment_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_educational_audit_log_user_id ON educational_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_educational_audit_log_created_at ON educational_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_cache_key ON performance_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_performance_cache_expires ON performance_cache(expires_at);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprehensive_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

-- Collaboration sessions policies
CREATE POLICY "Users can view public sessions or their own sessions" ON collaboration_sessions
    FOR SELECT USING (
        status IN ('waiting', 'active') OR 
        host_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM session_participants sp WHERE sp.session_id = id AND sp.user_id = auth.uid())
    );

CREATE POLICY "Users can create sessions" ON collaboration_sessions
    FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their sessions" ON collaboration_sessions
    FOR UPDATE USING (auth.uid() = host_id);

-- Session participants policies
CREATE POLICY "Participants can view session participants" ON session_participants
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM collaboration_sessions cs WHERE cs.id = session_id AND (
            cs.host_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM session_participants sp2 WHERE sp2.session_id = cs.id AND sp2.user_id = auth.uid())
        ))
    );

CREATE POLICY "Users can join sessions" ON session_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Session messages policies
CREATE POLICY "Session participants can view messages" ON session_messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM session_participants sp WHERE sp.session_id = session_messages.session_id AND sp.user_id = auth.uid())
    );

CREATE POLICY "Session participants can send messages" ON session_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (SELECT 1 FROM session_participants sp WHERE sp.session_id = session_messages.session_id AND sp.user_id = auth.uid())
    );

-- AI tutor sessions policies
CREATE POLICY "Students can view their own AI tutor sessions" ON ai_tutor_sessions
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create AI tutor sessions" ON ai_tutor_sessions
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Assessment policies
CREATE POLICY "Teachers can view assessments in their classrooms" ON comprehensive_assessments
    FOR SELECT USING (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM classroom_memberships cm WHERE cm.classroom_id = comprehensive_assessments.classroom_id AND cm.user_id = auth.uid() AND cm.role = 'teacher')
    );

CREATE POLICY "Students can view published assessments in their classrooms" ON comprehensive_assessments
    FOR SELECT USING (
        is_published = true AND 
        EXISTS (SELECT 1 FROM classroom_memberships cm WHERE cm.classroom_id = comprehensive_assessments.classroom_id AND cm.user_id = auth.uid() AND cm.role = 'student')
    );

-- Privacy settings policies
CREATE POLICY "Users can manage their own privacy settings" ON privacy_settings
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- DATABASE FUNCTIONS
-- =============================================

-- Function to update session participant count
CREATE OR REPLACE FUNCTION update_session_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the current_participants count in collaboration_sessions
    UPDATE collaboration_sessions 
    SET metadata = COALESCE(metadata, '{}') || jsonb_build_object(
        'current_participants', 
        (SELECT COUNT(*) FROM session_participants WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) AND is_active = true)
    )
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to generate AI tutor response
CREATE OR REPLACE FUNCTION generate_ai_tutor_response(
    session_id_param UUID,
    student_input_param TEXT,
    interaction_type_param VARCHAR(50)
)
RETURNS UUID AS $$
DECLARE
    interaction_id UUID;
    ai_response TEXT;
    context_data JSONB;
BEGIN
    -- Get session context
    SELECT ts.context_data INTO context_data
    FROM ai_tutor_sessions ts
    WHERE ts.id = session_id_param;
    
    -- Generate AI response (simplified - in production, this would call external AI service)
    CASE interaction_type_param
        WHEN 'hint' THEN
            ai_response := 'Here''s a hint: Try breaking down the problem into smaller steps and consider what strategy might work best.';
        WHEN 'explanation' THEN
            ai_response := 'Let me explain this concept: ' || student_input_param || '. This relates to metacognitive awareness...';
        WHEN 'feedback' THEN
            ai_response := 'Good work! Your approach shows metacognitive thinking. Consider how you might reflect on this process.';
        ELSE
            ai_response := 'I understand you''re working on: ' || student_input_param || '. What strategy are you considering?';
    END CASE;
    
    -- Insert interaction record
    INSERT INTO ai_tutor_interactions (
        session_id, 
        interaction_type, 
        student_input, 
        ai_response,
        response_quality_score,
        confidence_score
    ) VALUES (
        session_id_param,
        interaction_type_param,
        student_input_param,
        ai_response,
        0.85, -- Default quality score
        0.90  -- Default confidence
    ) RETURNING id INTO interaction_id;
    
    -- Update session interaction count
    UPDATE ai_tutor_sessions 
    SET total_interactions = total_interactions + 1
    WHERE id = session_id_param;
    
    RETURN interaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate comprehensive assessment score
CREATE OR REPLACE FUNCTION calculate_assessment_score(attempt_id_param UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_points DECIMAL(5,2) := 0;
    earned_points DECIMAL(5,2) := 0;
    percentage DECIMAL(5,2);
BEGIN
    -- Calculate total possible points and earned points
    SELECT 
        SUM(aq.points),
        SUM(COALESCE(ar.points_earned, 0))
    INTO total_points, earned_points
    FROM assessment_questions aq
    LEFT JOIN assessment_responses ar ON ar.question_id = aq.id AND ar.attempt_id = attempt_id_param
    INNER JOIN assessment_attempts aa ON aa.id = attempt_id_param
    WHERE aq.assessment_id = aa.assessment_id;
    
    -- Calculate percentage
    IF total_points > 0 THEN
        percentage := (earned_points / total_points) * 100;
    ELSE
        percentage := 0;
    END IF;
    
    -- Update the attempt record
    UPDATE assessment_attempts 
    SET 
        total_score = earned_points,
        percentage_score = percentage,
        completed_at = NOW(),
        status = 'completed'
    WHERE id = attempt_id_param;
    
    RETURN percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM performance_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to sync data with external LMS
CREATE OR REPLACE FUNCTION sync_lms_grades(integration_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    sync_count INTEGER := 0;
    sync_record RECORD;
BEGIN
    -- Process pending grade syncs for this integration
    FOR sync_record IN 
        SELECT * FROM lms_grade_sync 
        WHERE integration_id = integration_id_param 
        AND sync_status = 'pending'
        LIMIT 100
    LOOP
        -- In production, this would make API calls to the LMS
        -- For now, we'll just mark as synced
        UPDATE lms_grade_sync 
        SET 
            sync_status = 'synced',
            synced_at = NOW()
        WHERE id = sync_record.id;
        
        sync_count := sync_count + 1;
    END LOOP;
    
    -- Update integration last sync time
    UPDATE lms_integrations 
    SET last_sync_at = NOW()
    WHERE id = integration_id_param;
    
    RETURN sync_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for updating session participant counts
CREATE TRIGGER trigger_update_session_participant_count
    AFTER INSERT OR UPDATE OR DELETE ON session_participants
    FOR EACH ROW EXECUTE FUNCTION update_session_participant_count();

-- Trigger for updating strategy vote counts
CREATE OR REPLACE FUNCTION update_strategy_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE shared_strategies 
        SET 
            upvotes = (SELECT COUNT(*) FROM strategy_votes WHERE strategy_id = NEW.strategy_id AND vote_type = 'up'),
            downvotes = (SELECT COUNT(*) FROM strategy_votes WHERE strategy_id = NEW.strategy_id AND vote_type = 'down')
        WHERE id = NEW.strategy_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE shared_strategies 
        SET 
            upvotes = (SELECT COUNT(*) FROM strategy_votes WHERE strategy_id = OLD.strategy_id AND vote_type = 'up'),
            downvotes = (SELECT COUNT(*) FROM strategy_votes WHERE strategy_id = OLD.strategy_id AND vote_type = 'down')
        WHERE id = OLD.strategy_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_strategy_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON strategy_votes
    FOR EACH ROW EXECUTE FUNCTION update_strategy_vote_counts();

-- Audit log trigger for sensitive operations
CREATE OR REPLACE FUNCTION log_educational_data_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO educational_audit_log (
        user_id,
        action_type,
        resource_type,
        resource_id,
        details
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'timestamp', NOW(),
            'table', TG_TABLE_NAME,
            'operation', TG_OP
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to sensitive tables
CREATE TRIGGER trigger_audit_comprehensive_assessments
    AFTER INSERT OR UPDATE OR DELETE ON comprehensive_assessments
    FOR EACH ROW EXECUTE FUNCTION log_educational_data_access();

CREATE TRIGGER trigger_audit_assessment_responses
    AFTER INSERT OR UPDATE OR DELETE ON assessment_responses
    FOR EACH ROW EXECUTE FUNCTION log_educational_data_access();

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default system configuration
INSERT INTO system_configuration (config_key, config_value, description) VALUES
('ai_tutor_enabled', 'true', 'Enable AI tutoring system'),
('max_collaboration_sessions', '50', 'Maximum concurrent collaboration sessions'),
('default_session_timeout', '60', 'Default session timeout in minutes'),
('lms_sync_interval', '3600', 'LMS sync interval in seconds'),
('cache_ttl_default', '1800', 'Default cache TTL in seconds'),
('performance_monitoring', 'true', 'Enable performance monitoring'),
('data_encryption_enabled', 'true', 'Enable data encryption for FERPA compliance')
ON CONFLICT (config_key) DO NOTHING;

-- Insert default AI tutor knowledge
INSERT INTO ai_tutor_knowledge (concept_name, description, difficulty_level, learning_strategies) VALUES
('Metacognitive Awareness', 'Understanding one''s own thinking processes', 1, '{"strategies": ["reflection", "self_questioning", "think_aloud"]}'),
('Problem Decomposition', 'Breaking complex problems into smaller parts', 2, '{"strategies": ["chunking", "visualization", "step_by_step"]}'),
('Strategy Selection', 'Choosing appropriate problem-solving strategies', 3, '{"strategies": ["comparison", "trial_and_error", "systematic_approach"]}'),
('Self-Regulation', 'Monitoring and controlling learning processes', 4, '{"strategies": ["goal_setting", "progress_monitoring", "adjustment"]}'),
('Collaborative Learning', 'Learning effectively with peers', 2, '{"strategies": ["active_listening", "perspective_taking", "consensus_building"]}')
ON CONFLICT (concept_name) DO NOTHING;

-- Insert supported languages
INSERT INTO translations (translation_key, language_code, translated_text, approval_status) VALUES
('welcome_message', 'en', 'Welcome to the Adaptive Education Coach!', 'approved'),
('welcome_message', 'es', '¡Bienvenido al Entrenador de Educación Adaptiva!', 'approved'),
('welcome_message', 'fr', 'Bienvenue dans le Coach d''Éducation Adaptative!', 'approved'),
('start_collaboration', 'en', 'Start Collaboration', 'approved'),
('start_collaboration', 'es', 'Iniciar Colaboración', 'approved'),
('start_collaboration', 'fr', 'Commencer la Collaboration', 'approved')
ON CONFLICT (translation_key, language_code) DO NOTHING;

-- =============================================
-- SCHEDULED JOBS (using pg_cron)
-- =============================================

-- Clean up expired cache entries every hour
SELECT cron.schedule('cleanup-cache', '0 * * * *', 'SELECT cleanup_expired_cache();');

-- Sync LMS data every hour
SELECT cron.schedule('lms-sync', '15 * * * *', 'SELECT sync_lms_grades(id) FROM lms_integrations WHERE sync_enabled = true;');

-- Generate daily system health reports
SELECT cron.schedule('health-check', '0 6 * * *', 'INSERT INTO system_health_metrics (metric_name, metric_value) VALUES (''daily_active_users'', (SELECT COUNT(DISTINCT user_id) FROM educational_audit_log WHERE created_at >= NOW() - INTERVAL ''24 hours''));');

COMMIT;