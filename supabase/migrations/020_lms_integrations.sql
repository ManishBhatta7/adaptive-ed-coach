-- LMS Integration System Migration
-- This migration creates tables and functions for external LMS integrations

-- Create enum for supported LMS types
DO $$ BEGIN
    CREATE TYPE lms_type AS ENUM ('canvas', 'blackboard', 'moodle', 'google_classroom', 'schoology');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for sync status
DO $$ BEGIN
    CREATE TYPE sync_status AS ENUM ('connected', 'error', 'disconnected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for grade sync status
DO $$ BEGIN
    CREATE TYPE grade_sync_status AS ENUM ('pending', 'synced', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- LMS Integrations table
CREATE TABLE IF NOT EXISTS lms_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lms_type lms_type NOT NULL,
    lms_course_id TEXT NOT NULL, -- Course/Class ID in the external LMS
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    connection_config JSONB NOT NULL DEFAULT '{}', -- API keys, URLs, tokens, etc.
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status sync_status DEFAULT 'disconnected',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lms_type, lms_course_id, classroom_id)
);

-- Grade synchronization log table
CREATE TABLE IF NOT EXISTS lms_grade_sync (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    integration_id UUID NOT NULL REFERENCES lms_integrations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assignment_type TEXT NOT NULL, -- 'metacognitive_assessment', 'reflection', etc.
    assignment_id TEXT NOT NULL, -- Assignment ID in the LMS
    metacog_score DECIMAL(5,4) NOT NULL, -- Our internal metacognitive score (0-1)
    lms_grade INTEGER NOT NULL, -- Grade sent to LMS (typically 0-100)
    sync_status grade_sync_status DEFAULT 'pending',
    synced_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX (integration_id, student_id),
    INDEX (sync_status),
    INDEX (created_at)
);

-- LMS Assignment mapping (optional - for tracking assignments)
CREATE TABLE IF NOT EXISTS lms_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    integration_id UUID NOT NULL REFERENCES lms_integrations(id) ON DELETE CASCADE,
    lms_assignment_id TEXT NOT NULL, -- Assignment ID in the LMS
    assignment_name TEXT NOT NULL,
    assignment_type TEXT NOT NULL, -- Type of metacognitive assessment
    points_possible INTEGER DEFAULT 100,
    due_date TIMESTAMP WITH TIME ZONE,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(integration_id, lms_assignment_id)
);

-- Student roster sync (for importing students from LMS)
CREATE TABLE IF NOT EXISTS lms_student_sync (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    integration_id UUID NOT NULL REFERENCES lms_integrations(id) ON DELETE CASCADE,
    lms_user_id TEXT NOT NULL, -- Student ID in the LMS
    local_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Our local user ID
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    sync_status grade_sync_status DEFAULT 'pending',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(integration_id, lms_user_id)
);

-- Add RLS policies
ALTER TABLE lms_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_grade_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_student_sync ENABLE ROW LEVEL SECURITY;

-- LMS Integrations policies
CREATE POLICY "Teachers can manage their own integrations" ON lms_integrations
    FOR ALL USING (
        auth.uid() = created_by AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

CREATE POLICY "Teachers can view integrations for their classrooms" ON lms_integrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM classrooms c
            JOIN profiles p ON p.id = auth.uid()
            WHERE c.id = classroom_id 
            AND c.created_by = auth.uid()
            AND p.role = 'teacher'
        )
    );

-- Grade sync policies
CREATE POLICY "Teachers can view grade sync for their integrations" ON lms_grade_sync
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lms_integrations li
            WHERE li.id = integration_id 
            AND li.created_by = auth.uid()
        )
    );

CREATE POLICY "System can insert grade sync records" ON lms_grade_sync
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update grade sync records" ON lms_grade_sync
    FOR UPDATE USING (true);

-- LMS assignments policies
CREATE POLICY "Teachers can manage assignments for their integrations" ON lms_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lms_integrations li
            WHERE li.id = integration_id 
            AND li.created_by = auth.uid()
        )
    );

-- Student sync policies
CREATE POLICY "Teachers can manage student sync for their integrations" ON lms_student_sync
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lms_integrations li
            WHERE li.id = integration_id 
            AND li.created_by = auth.uid()
        )
    );

-- Function to sync grades to LMS
CREATE OR REPLACE FUNCTION sync_lms_grades(integration_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sync_count INTEGER := 0;
    integration_record RECORD;
    student_record RECORD;
    avg_score DECIMAL;
    lms_grade INTEGER;
BEGIN
    -- Get integration details
    SELECT * INTO integration_record
    FROM lms_integrations
    WHERE id = integration_id_param AND created_by = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Integration not found or access denied';
    END IF;
    
    -- Get students from the classroom
    FOR student_record IN
        SELECT cs.student_id, p.name, p.email
        FROM classroom_students cs
        JOIN profiles p ON p.id = cs.student_id
        WHERE cs.classroom_id = integration_record.classroom_id
    LOOP
        -- Calculate average metacognitive score for the last 7 days
        SELECT AVG(metacognitive_score) INTO avg_score
        FROM assessment_results
        WHERE student_id = student_record.student_id
        AND metacognitive_score IS NOT NULL
        AND created_at >= NOW() - INTERVAL '7 days';
        
        -- Skip if no recent scores
        CONTINUE WHEN avg_score IS NULL;
        
        -- Convert to LMS grade (0-100 scale)
        lms_grade := ROUND(avg_score * 100);
        
        -- Insert sync record
        INSERT INTO lms_grade_sync (
            integration_id,
            student_id,
            assignment_type,
            assignment_id,
            metacog_score,
            lms_grade,
            sync_status,
            created_at
        ) VALUES (
            integration_id_param,
            student_record.student_id,
            'metacognitive_assessment',
            'metacog-assessment',
            avg_score,
            lms_grade,
            'pending',
            NOW()
        );
        
        sync_count := sync_count + 1;
    END LOOP;
    
    -- Update integration last_sync_at
    UPDATE lms_integrations
    SET last_sync_at = NOW(),
        sync_status = 'connected'
    WHERE id = integration_id_param;
    
    RETURN sync_count;
END;
$$;

-- Function to import students from LMS
CREATE OR REPLACE FUNCTION import_lms_students(integration_id_param UUID)
RETURNS TABLE(imported_count INTEGER, error_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    integration_record RECORD;
    student_sync_record RECORD;
    new_user_id UUID;
    import_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    -- Get integration details
    SELECT * INTO integration_record
    FROM lms_integrations
    WHERE id = integration_id_param AND created_by = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Integration not found or access denied';
    END IF;
    
    -- Process pending student sync records
    FOR student_sync_record IN
        SELECT *
        FROM lms_student_sync
        WHERE integration_id = integration_id_param 
        AND sync_status = 'pending'
    LOOP
        BEGIN
            -- Check if user already exists
            SELECT id INTO new_user_id
            FROM profiles
            WHERE email = student_sync_record.student_email;
            
            IF NOT FOUND THEN
                -- Create new user profile
                INSERT INTO profiles (name, email, role)
                VALUES (
                    student_sync_record.student_name,
                    student_sync_record.student_email,
                    'student'
                )
                RETURNING id INTO new_user_id;
            END IF;
            
            -- Enroll in classroom if not already enrolled
            INSERT INTO classroom_students (classroom_id, student_id, enrolled_at)
            VALUES (integration_record.classroom_id, new_user_id, NOW())
            ON CONFLICT DO NOTHING;
            
            -- Update sync record
            UPDATE lms_student_sync
            SET local_user_id = new_user_id,
                sync_status = 'synced',
                last_synced_at = NOW()
            WHERE id = student_sync_record.id;
            
            import_count := import_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Mark as failed
            UPDATE lms_student_sync
            SET sync_status = 'failed'
            WHERE id = student_sync_record.id;
            
            error_count := error_count + 1;
        END;
    END LOOP;
    
    RETURN QUERY SELECT import_count, error_count;
END;
$$;

-- Function to update integration last sync timestamp
CREATE OR REPLACE FUNCTION update_integration_sync_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE lms_integrations
    SET updated_at = NOW()
    WHERE id = NEW.integration_id;
    
    RETURN NEW;
END;
$$;

-- Trigger to update integration timestamp on grade sync
CREATE OR REPLACE TRIGGER update_integration_on_grade_sync
    AFTER INSERT OR UPDATE ON lms_grade_sync
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_sync_status();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lms_integrations_classroom ON lms_integrations(classroom_id);
CREATE INDEX IF NOT EXISTS idx_lms_integrations_teacher ON lms_integrations(created_by);
CREATE INDEX IF NOT EXISTS idx_lms_integrations_type ON lms_integrations(lms_type);
CREATE INDEX IF NOT EXISTS idx_lms_integrations_status ON lms_integrations(sync_status);

CREATE INDEX IF NOT EXISTS idx_lms_grade_sync_integration ON lms_grade_sync(integration_id);
CREATE INDEX IF NOT EXISTS idx_lms_grade_sync_student ON lms_grade_sync(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_grade_sync_status ON lms_grade_sync(sync_status);
CREATE INDEX IF NOT EXISTS idx_lms_grade_sync_created ON lms_grade_sync(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lms_assignments_integration ON lms_assignments(integration_id);
CREATE INDEX IF NOT EXISTS idx_lms_assignments_type ON lms_assignments(assignment_type);

CREATE INDEX IF NOT EXISTS idx_lms_student_sync_integration ON lms_student_sync(integration_id);
CREATE INDEX IF NOT EXISTS idx_lms_student_sync_status ON lms_student_sync(sync_status);
CREATE INDEX IF NOT EXISTS idx_lms_student_sync_email ON lms_student_sync(student_email);

-- Grant permissions
GRANT ALL ON lms_integrations TO authenticated;
GRANT ALL ON lms_grade_sync TO authenticated;
GRANT ALL ON lms_assignments TO authenticated;
GRANT ALL ON lms_student_sync TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE lms_integrations IS 'Stores configuration and credentials for external LMS integrations';
COMMENT ON TABLE lms_grade_sync IS 'Tracks grade synchronization between our system and external LMS';
COMMENT ON TABLE lms_assignments IS 'Maps our metacognitive assessments to LMS assignments';
COMMENT ON TABLE lms_student_sync IS 'Tracks student roster synchronization from LMS to our system';

COMMENT ON FUNCTION sync_lms_grades(UUID) IS 'Creates pending grade sync records for recent student assessments';
COMMENT ON FUNCTION import_lms_students(UUID) IS 'Processes pending student imports from LMS roster';

-- Create view for integration dashboard
CREATE OR REPLACE VIEW lms_integration_dashboard AS
SELECT 
    li.id,
    li.lms_type,
    li.lms_course_id,
    li.classroom_id,
    c.name as classroom_name,
    li.sync_enabled,
    li.last_sync_at,
    li.sync_status,
    li.created_at,
    COUNT(DISTINCT lgs.student_id) as total_students_synced,
    COUNT(DISTINCT CASE WHEN lgs.sync_status = 'synced' THEN lgs.student_id END) as successful_syncs,
    COUNT(DISTINCT CASE WHEN lgs.sync_status = 'failed' THEN lgs.student_id END) as failed_syncs,
    MAX(lgs.synced_at) as last_grade_sync
FROM lms_integrations li
LEFT JOIN classrooms c ON c.id = li.classroom_id
LEFT JOIN lms_grade_sync lgs ON lgs.integration_id = li.id
GROUP BY li.id, c.name;

COMMENT ON VIEW lms_integration_dashboard IS 'Dashboard view showing LMS integration status and sync statistics';