-- Security and Privacy System Migration
-- Creates tables for security settings, audit logs, privacy requests, and FERPA compliance

-- Create enums for security system
DO $$ BEGIN
    CREATE TYPE audit_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE privacy_request_type AS ENUM ('export', 'delete', 'rectify', 'restrict', 'object');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('pending', 'processing', 'completed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM ('open', 'investigating', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE data_access_action AS ENUM ('view', 'export', 'modify', 'delete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Security Settings table (system-wide security configuration)
CREATE TABLE IF NOT EXISTS security_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    two_factor_enabled BOOLEAN DEFAULT false,
    session_timeout_minutes INTEGER DEFAULT 30,
    password_policy JSONB NOT NULL DEFAULT '{
        "min_length": 8,
        "require_uppercase": true,
        "require_lowercase": true,
        "require_numbers": true,
        "require_symbols": false,
        "password_expiry_days": 90
    }',
    data_retention_days INTEGER DEFAULT 365,
    encryption_enabled BOOLEAN DEFAULT true,
    audit_logging_enabled BOOLEAN DEFAULT true,
    ferpa_compliance_enabled BOOLEAN DEFAULT true,
    privacy_settings JSONB NOT NULL DEFAULT '{
        "allow_analytics": false,
        "allow_third_party_cookies": false,
        "data_sharing_consent": false,
        "marketing_consent": false
    }',
    ip_whitelist TEXT[] DEFAULT '{}',
    allowed_domains TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs table (comprehensive activity logging)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- login, logout, create_user, update_settings, etc.
    resource_type TEXT NOT NULL, -- user, classroom, assessment, etc.
    resource_id TEXT, -- ID of the affected resource
    details JSONB DEFAULT '{}', -- Additional context about the action
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity audit_severity DEFAULT 'low',
    session_id TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    INDEX (user_id),
    INDEX (action_type),
    INDEX (resource_type),
    INDEX (timestamp DESC),
    INDEX (severity)
);

-- Privacy Requests table (GDPR/FERPA data requests)
CREATE TABLE IF NOT EXISTS privacy_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type privacy_request_type NOT NULL,
    status request_status DEFAULT 'pending',
    description TEXT,
    requested_data_types TEXT[] DEFAULT '{}', -- specific data types requested
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    export_file_path TEXT, -- for data export requests
    retention_override_until TIMESTAMP WITH TIME ZONE, -- for retention extension requests
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX (user_id),
    INDEX (request_type),
    INDEX (status),
    INDEX (requested_at DESC)
);

-- Security Incidents table (security event tracking)
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity audit_severity NOT NULL,
    status incident_status DEFAULT 'open',
    category TEXT, -- 'breach', 'suspicious_activity', 'policy_violation', etc.
    affected_users UUID[], -- array of user IDs affected
    reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    evidence JSONB DEFAULT '{}', -- logs, screenshots, etc.
    remediation_actions TEXT[],
    follow_up_required BOOLEAN DEFAULT false,
    INDEX (severity),
    INDEX (status),
    INDEX (category),
    INDEX (reported_at DESC)
);

-- Data Access Logs table (FERPA compliance tracking)
CREATE TABLE IF NOT EXISTS data_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- student whose data was accessed
    data_type TEXT NOT NULL, -- 'grades', 'assessments', 'personal_info', etc.
    action data_access_action NOT NULL,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    justification TEXT, -- reason for accessing student data
    educational_interest BOOLEAN DEFAULT false, -- legitimate educational interest
    parent_consent BOOLEAN DEFAULT false, -- explicit parent consent
    disclosure_recipient TEXT, -- if data was shared with third party
    retention_until TIMESTAMP WITH TIME ZONE, -- when this access log should be purged
    INDEX (user_id),
    INDEX (student_id),
    INDEX (data_type),
    INDEX (action),
    INDEX (accessed_at DESC)
);

-- Data Encryption Keys table (key management)
CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name TEXT UNIQUE NOT NULL,
    key_type TEXT NOT NULL, -- 'AES-256', 'RSA-2048', etc.
    key_usage TEXT NOT NULL, -- 'data_encryption', 'backup_encryption', etc.
    key_hash TEXT NOT NULL, -- hash of the key for verification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    rotated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    INDEX (key_name),
    INDEX (key_usage),
    INDEX (is_active)
);

-- Consent Records table (tracking user consents)
CREATE TABLE IF NOT EXISTS consent_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL, -- 'data_processing', 'analytics', 'marketing', etc.
    consented BOOLEAN NOT NULL,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consent_method TEXT, -- 'registration', 'settings_change', 'api', etc.
    ip_address INET,
    user_agent TEXT,
    parent_consent BOOLEAN DEFAULT false, -- for minors
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    withdrawal_reason TEXT,
    INDEX (user_id),
    INDEX (consent_type),
    INDEX (consent_date DESC)
);

-- User Sessions table (session management and security)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    login_method TEXT DEFAULT 'email', -- 'email', 'google', 'microsoft', etc.
    two_factor_verified BOOLEAN DEFAULT false,
    device_fingerprint TEXT,
    location_country TEXT,
    location_city TEXT,
    INDEX (session_token),
    INDEX (user_id),
    INDEX (expires_at),
    INDEX (last_activity DESC)
);

-- Add RLS policies
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Security Settings policies (admin only)
CREATE POLICY "Only admins can manage security settings" ON security_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Audit Logs policies
CREATE POLICY "Admins and teachers can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Privacy Requests policies
CREATE POLICY "Users can manage their own privacy requests" ON privacy_requests
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all privacy requests" ON privacy_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Security Incidents policies
CREATE POLICY "Admins and teachers can manage security incidents" ON security_incidents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Data Access Logs policies
CREATE POLICY "Users can view logs of their own data access" ON data_access_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can view logs of access to their data" ON data_access_logs
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all data access logs" ON data_access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can log data access" ON data_access_logs
    FOR INSERT WITH CHECK (true);

-- Encryption Keys policies (admin only)
CREATE POLICY "Only admins can manage encryption keys" ON encryption_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Consent Records policies
CREATE POLICY "Users can manage their own consent records" ON consent_records
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all consent records" ON consent_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- User Sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can manage sessions" ON user_sessions
    FOR INSERT WITH CHECK (true);

-- Functions for security and privacy operations

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action_type TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_severity audit_severity DEFAULT 'low'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action_type,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        severity,
        session_id
    ) VALUES (
        auth.uid(),
        p_action_type,
        p_resource_type,
        p_resource_id,
        p_details,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent',
        p_severity,
        current_setting('request.jwt.claims', true)::json->>'session_id'
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Function to export user data (GDPR compliance)
CREATE OR REPLACE FUNCTION export_user_data(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_data JSONB := '{}';
    profile_data RECORD;
BEGIN
    -- Check if the requester is the user themselves or an admin
    IF auth.uid() != user_id_param AND NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Export profile data
    SELECT * INTO profile_data FROM profiles WHERE id = user_id_param;
    user_data := user_data || jsonb_build_object('profile', row_to_json(profile_data));
    
    -- Export assessment results
    user_data := user_data || jsonb_build_object('assessments', (
        SELECT jsonb_agg(row_to_json(ar))
        FROM assessment_results ar
        WHERE ar.student_id = user_id_param
    ));
    
    -- Export reflection entries
    user_data := user_data || jsonb_build_object('reflections', (
        SELECT jsonb_agg(row_to_json(re))
        FROM reflection_entries re
        WHERE re.student_id = user_id_param
    ));
    
    -- Export collaboration data
    user_data := user_data || jsonb_build_object('collaborations', (
        SELECT jsonb_agg(row_to_json(cs))
        FROM collaboration_sessions cs
        WHERE cs.created_by = user_id_param OR user_id_param = ANY(cs.participants)
    ));
    
    -- Log the data export
    PERFORM log_audit_event(
        'data_export',
        'user_data',
        user_id_param::text,
        jsonb_build_object('exported_by', auth.uid()),
        'medium'
    );
    
    RETURN user_data;
END;
$$;

-- Function to anonymize user data
CREATE OR REPLACE FUNCTION anonymize_user_data(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the requester is an admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Anonymize profile data
    UPDATE profiles 
    SET 
        name = 'Anonymous User ' || substr(id::text, 1, 8),
        email = 'anonymous_' || substr(id::text, 1, 8) || '@deleted.local',
        bio = NULL,
        avatar_url = NULL,
        updated_at = NOW()
    WHERE id = user_id_param;
    
    -- Anonymize reflection entries (keep data for research but remove PII)
    UPDATE reflection_entries
    SET 
        content = 'Content anonymized',
        updated_at = NOW()
    WHERE student_id = user_id_param;
    
    -- Log the anonymization
    PERFORM log_audit_event(
        'data_anonymization',
        'user_data',
        user_id_param::text,
        jsonb_build_object('anonymized_by', auth.uid()),
        'high'
    );
    
    RETURN true;
END;
$$;

-- Function to log data access for FERPA compliance
CREATE OR REPLACE FUNCTION log_data_access(
    p_student_id UUID,
    p_data_type TEXT,
    p_action data_access_action,
    p_justification TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    access_log_id UUID;
BEGIN
    INSERT INTO data_access_logs (
        user_id,
        student_id,
        data_type,
        action,
        ip_address,
        user_agent,
        justification,
        educational_interest
    ) VALUES (
        auth.uid(),
        p_student_id,
        p_data_type,
        p_action,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent',
        p_justification,
        true -- Assuming educational interest for app usage
    )
    RETURNING id INTO access_log_id;
    
    RETURN access_log_id;
END;
$$;

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    retention_days INTEGER;
    cleanup_count INTEGER := 0;
BEGIN
    -- Get retention period from settings
    SELECT data_retention_days INTO retention_days 
    FROM security_settings 
    LIMIT 1;
    
    IF retention_days IS NULL THEN
        retention_days := 365; -- Default retention period
    END IF;
    
    -- Clean up old audit logs
    DELETE FROM audit_logs 
    WHERE timestamp < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    -- Clean up old data access logs
    DELETE FROM data_access_logs 
    WHERE accessed_at < NOW() - INTERVAL '1 day' * retention_days
    AND retention_until IS NULL;
    
    -- Clean up expired sessions
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR last_activity < NOW() - INTERVAL '30 days';
    
    -- Log the cleanup operation
    PERFORM log_audit_event(
        'data_cleanup',
        'system',
        NULL,
        jsonb_build_object('records_cleaned', cleanup_count, 'retention_days', retention_days),
        'low'
    );
    
    RETURN cleanup_count;
END;
$$;

-- Create automated triggers for audit logging

-- Trigger function for profile changes
CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event(
            'profile_update',
            'profile',
            NEW.id::text,
            jsonb_build_object('changes', row_to_json(NEW) - row_to_json(OLD)),
            'medium'
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_event(
            'profile_delete',
            'profile',
            OLD.id::text,
            jsonb_build_object('deleted_profile', row_to_json(OLD)),
            'high'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers
CREATE OR REPLACE TRIGGER audit_profiles_trigger
    AFTER UPDATE OR DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION audit_profile_changes();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_user_status ON privacy_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity_status ON security_incidents(severity, status);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_student_type ON data_access_logs(student_id, data_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active, expires_at);

-- Grant permissions
GRANT ALL ON security_settings TO authenticated;
GRANT ALL ON audit_logs TO authenticated;
GRANT ALL ON privacy_requests TO authenticated;
GRANT ALL ON security_incidents TO authenticated;
GRANT ALL ON data_access_logs TO authenticated;
GRANT ALL ON encryption_keys TO authenticated;
GRANT ALL ON consent_records TO authenticated;
GRANT ALL ON user_sessions TO authenticated;

-- Add helpful comments
COMMENT ON TABLE security_settings IS 'System-wide security and privacy configuration settings';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all system activities';
COMMENT ON TABLE privacy_requests IS 'User privacy requests for GDPR/FERPA compliance';
COMMENT ON TABLE security_incidents IS 'Security incident tracking and management';
COMMENT ON TABLE data_access_logs IS 'FERPA-compliant logging of educational record access';
COMMENT ON TABLE encryption_keys IS 'Encryption key management for data protection';
COMMENT ON TABLE consent_records IS 'User consent tracking for privacy compliance';
COMMENT ON TABLE user_sessions IS 'Secure session management and monitoring';

COMMENT ON FUNCTION export_user_data(UUID) IS 'GDPR-compliant user data export functionality';
COMMENT ON FUNCTION anonymize_user_data(UUID) IS 'Data anonymization for privacy compliance';
COMMENT ON FUNCTION log_data_access(UUID, TEXT, data_access_action, TEXT) IS 'FERPA-compliant data access logging';
COMMENT ON FUNCTION cleanup_expired_data() IS 'Automated cleanup of expired data per retention policies';