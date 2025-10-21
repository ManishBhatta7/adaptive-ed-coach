-- Create peer collaboration tables
CREATE TABLE peer_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    max_members INTEGER DEFAULT 6,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE peer_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES peer_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'member', 'leader', 'facilitator'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE TABLE shared_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reflection_id UUID NOT NULL, -- References original reflection from metacog_events
    shared_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    group_id UUID REFERENCES peer_groups(id) ON DELETE CASCADE,
    shared_at TIMESTAMPTZ DEFAULT NOW(),
    visibility VARCHAR(20) DEFAULT 'group', -- 'group', 'classroom', 'public'
    allow_comments BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    UNIQUE(reflection_id, group_id)
);

CREATE TABLE peer_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_reflection_id UUID REFERENCES shared_reflections(id) ON DELETE CASCADE,
    commenter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'feedback', -- 'feedback', 'question', 'encouragement', 'suggestion'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    group_id UUID REFERENCES peer_groups(id) ON DELETE CASCADE,
    problem_id VARCHAR(255), -- Can reference external problem
    session_type VARCHAR(30) DEFAULT 'problem_solving', -- 'problem_solving', 'reflection_sharing', 'strategy_workshop'
    status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'active', 'completed', 'cancelled'
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    session_data JSONB DEFAULT '{}'::jsonb -- Store session-specific data
);

CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    participation_role VARCHAR(20) DEFAULT 'participant', -- 'participant', 'observer', 'facilitator'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    contribution_score INTEGER DEFAULT 0,
    UNIQUE(session_id, user_id)
);

CREATE TABLE peer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    feedback_type VARCHAR(30) DEFAULT 'general', -- 'strategy_help', 'encouragement', 'constructive', 'question'
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_peer_groups_classroom ON peer_groups(classroom_id);
CREATE INDEX idx_peer_group_members_group ON peer_group_members(group_id);
CREATE INDEX idx_peer_group_members_user ON peer_group_members(user_id);
CREATE INDEX idx_shared_reflections_group ON shared_reflections(group_id);
CREATE INDEX idx_shared_reflections_shared_by ON shared_reflections(shared_by);
CREATE INDEX idx_peer_comments_reflection ON peer_comments(shared_reflection_id);
CREATE INDEX idx_collaboration_sessions_group ON collaboration_sessions(group_id);
CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_peer_feedback_receiver ON peer_feedback(receiver_id);

-- Row Level Security
ALTER TABLE peer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Peer Groups: Members can view, teachers can manage
CREATE POLICY "Members can view peer groups" ON peer_groups
    FOR SELECT USING (
        id IN (SELECT group_id FROM peer_group_members WHERE user_id = auth.uid())
        OR classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid())
    );

CREATE POLICY "Teachers can insert peer groups" ON peer_groups
    FOR INSERT WITH CHECK (
        classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid())
    );

CREATE POLICY "Teachers can update peer groups" ON peer_groups
    FOR UPDATE USING (
        classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid())
    );

-- Peer Group Members: Members and teachers can view, teachers can manage
CREATE POLICY "Group members can view membership" ON peer_group_members
    FOR SELECT USING (
        group_id IN (SELECT group_id FROM peer_group_members WHERE user_id = auth.uid())
        OR group_id IN (SELECT id FROM peer_groups WHERE classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid()))
    );

CREATE POLICY "Teachers can manage group membership" ON peer_group_members
    FOR ALL USING (
        group_id IN (SELECT id FROM peer_groups WHERE classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid()))
    );

-- Shared Reflections: Group members can view and share
CREATE POLICY "Group members can view shared reflections" ON shared_reflections
    FOR SELECT USING (
        group_id IN (SELECT group_id FROM peer_group_members WHERE user_id = auth.uid())
        OR group_id IN (SELECT id FROM peer_groups WHERE classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid()))
    );

CREATE POLICY "Group members can share reflections" ON shared_reflections
    FOR INSERT WITH CHECK (
        shared_by = auth.uid() AND
        group_id IN (SELECT group_id FROM peer_group_members WHERE user_id = auth.uid())
    );

-- Peer Comments: Group members can view and comment
CREATE POLICY "Group members can view comments" ON peer_comments
    FOR SELECT USING (
        shared_reflection_id IN (
            SELECT id FROM shared_reflections WHERE group_id IN (
                SELECT group_id FROM peer_group_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Group members can add comments" ON peer_comments
    FOR INSERT WITH CHECK (
        commenter_id = auth.uid() AND
        shared_reflection_id IN (
            SELECT id FROM shared_reflections WHERE group_id IN (
                SELECT group_id FROM peer_group_members WHERE user_id = auth.uid()
            )
        )
    );

-- Collaboration Sessions: Group members can view and participate
CREATE POLICY "Group members can view sessions" ON collaboration_sessions
    FOR SELECT USING (
        group_id IN (SELECT group_id FROM peer_group_members WHERE user_id = auth.uid())
        OR group_id IN (SELECT id FROM peer_groups WHERE classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid()))
    );

CREATE POLICY "Teachers can manage sessions" ON collaboration_sessions
    FOR ALL USING (
        group_id IN (SELECT id FROM peer_groups WHERE classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid()))
    );

-- Session Participants: Participants can view their participation
CREATE POLICY "Participants can view session participation" ON session_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE group_id IN (
                SELECT id FROM peer_groups WHERE classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid())
            )
        )
    );

CREATE POLICY "Participants can join sessions" ON session_participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE group_id IN (
                SELECT group_id FROM peer_group_members WHERE user_id = auth.uid()
            )
        )
    );

-- Peer Feedback: Users can view feedback they gave or received
CREATE POLICY "Users can view their peer feedback" ON peer_feedback
    FOR SELECT USING (
        giver_id = auth.uid() OR 
        receiver_id = auth.uid() OR
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE group_id IN (
                SELECT id FROM peer_groups WHERE classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can give peer feedback" ON peer_feedback
    FOR INSERT WITH CHECK (
        giver_id = auth.uid() AND
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE group_id IN (
                SELECT group_id FROM peer_group_members WHERE user_id = auth.uid()
            )
        )
    );

-- Functions for collaboration management
CREATE OR REPLACE FUNCTION get_user_peer_groups(user_uuid UUID)
RETURNS TABLE (
    group_id UUID,
    group_name VARCHAR(255),
    group_description TEXT,
    member_count BIGINT,
    user_role VARCHAR(50),
    last_activity TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg.id,
        pg.name,
        pg.description,
        (SELECT COUNT(*) FROM peer_group_members WHERE group_id = pg.id),
        pgm.role,
        pg.updated_at
    FROM peer_groups pg
    JOIN peer_group_members pgm ON pg.id = pgm.group_id
    WHERE pgm.user_id = user_uuid AND pg.is_active = true
    ORDER BY pg.updated_at DESC;
END;
$$;