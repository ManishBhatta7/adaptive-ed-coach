-- Create advanced analytics tables
CREATE TABLE analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    student_count INTEGER NOT NULL,
    avg_metacog_score DECIMAL(4,3) NOT NULL,
    avg_reflection_count DECIMAL(5,2) NOT NULL,
    avg_strategy_usage DECIMAL(4,3) NOT NULL,
    completion_rate DECIMAL(4,3) NOT NULL,
    peer_collaboration_rate DECIMAL(4,3) DEFAULT 0,
    intervention_count INTEGER DEFAULT 0,
    badge_earned_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(classroom_id, snapshot_date)
);

CREATE TABLE student_progress_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    metacog_score DECIMAL(4,3) NOT NULL,
    reflection_count INTEGER NOT NULL,
    strategy_usage_count INTEGER NOT NULL,
    collaboration_participation INTEGER DEFAULT 0,
    badges_earned INTEGER DEFAULT 0,
    total_problems_attempted INTEGER DEFAULT 0,
    problems_completed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date)
);

CREATE TABLE predictive_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- 'at_risk', 'improvement_needed', 'high_performer', 'strategy_recommendation'
    confidence_score DECIMAL(4,3) NOT NULL, -- 0-1 confidence in prediction
    prediction_data JSONB NOT NULL, -- Detailed prediction information
    recommended_actions JSONB DEFAULT '[]'::jsonb, -- Suggested interventions/actions
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create gamification tables
CREATE TABLE game_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    challenge_type VARCHAR(30) NOT NULL, -- 'individual', 'team', 'classroom'
    category VARCHAR(30) NOT NULL, -- 'reflection', 'collaboration', 'strategy', 'improvement'
    criteria JSONB NOT NULL, -- Requirements to complete challenge
    reward_points INTEGER DEFAULT 0,
    reward_badge_id UUID, -- References badge system
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    duration_days INTEGER, -- How long challenge is active
    max_participants INTEGER, -- NULL for unlimited
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES game_challenges(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    team_name VARCHAR(100), -- For team challenges
    progress JSONB DEFAULT '{}'::jsonb, -- Progress tracking data
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    points_earned INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(challenge_id, participant_id)
);

CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_type VARCHAR(30) NOT NULL, -- 'classroom', 'school', 'global', 'team'
    scope_id UUID, -- classroom_id for classroom leaderboard, etc.
    category VARCHAR(30) NOT NULL, -- 'metacognition', 'collaboration', 'challenges', 'overall'
    time_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
    rankings JSONB NOT NULL, -- Array of ranked participants with scores
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(leaderboard_type, scope_id, category, time_period)
);

CREATE TABLE student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_type VARCHAR(30) NOT NULL, -- 'badge', 'milestone', 'streak', 'challenge'
    achievement_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    points_awarded INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb -- Additional achievement data
);

CREATE TABLE team_competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    competition_type VARCHAR(30) NOT NULL, -- 'metacog_battle', 'reflection_race', 'collaboration_quest'
    status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed', 'cancelled'
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    max_team_size INTEGER DEFAULT 4,
    scoring_criteria JSONB NOT NULL,
    prizes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE competition_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES team_competitions(id) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,
    team_color VARCHAR(20) DEFAULT 'blue',
    captain_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    current_score INTEGER DEFAULT 0,
    team_stats JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(competition_id, team_name)
);

CREATE TABLE competition_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES competition_teams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    individual_contribution INTEGER DEFAULT 0,
    UNIQUE(team_id, student_id)
);

-- Create indexes for performance
CREATE INDEX idx_analytics_snapshots_classroom_date ON analytics_snapshots(classroom_id, snapshot_date);
CREATE INDEX idx_student_progress_trends_student_date ON student_progress_trends(student_id, date);
CREATE INDEX idx_predictive_insights_student_active ON predictive_insights(student_id, is_active);
CREATE INDEX idx_game_challenges_active ON game_challenges(is_active, start_date, end_date);
CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_leaderboards_type_scope ON leaderboards(leaderboard_type, scope_id, category);
CREATE INDEX idx_student_achievements_student ON student_achievements(student_id, earned_at);
CREATE INDEX idx_team_competitions_classroom_status ON team_competitions(classroom_id, status);

-- Row Level Security
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Analytics (Teachers can view their classroom data)
CREATE POLICY "Teachers can view classroom analytics" ON analytics_snapshots
    FOR SELECT USING (
        classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid())
    );

CREATE POLICY "Students can view their progress trends" ON student_progress_trends
    FOR SELECT USING (
        student_id = auth.uid() OR 
        student_id IN (
            SELECT cm.student_id FROM classroom_members cm
            JOIN classrooms c ON c.id = cm.classroom_id
            WHERE c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can view student insights" ON predictive_insights
    FOR SELECT USING (
        student_id IN (
            SELECT cm.student_id FROM classroom_members cm
            JOIN classrooms c ON c.id = cm.classroom_id
            WHERE c.teacher_id = auth.uid()
        )
    );

-- RLS Policies for Gamification (Students can participate, teachers can manage)
CREATE POLICY "Everyone can view active challenges" ON game_challenges
    FOR SELECT USING (is_active = true);

CREATE POLICY "Teachers can manage challenges" ON game_challenges
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Students can join challenges" ON challenge_participants
    FOR INSERT WITH CHECK (participant_id = auth.uid());

CREATE POLICY "Participants can view their participation" ON challenge_participants
    FOR SELECT USING (
        participant_id = auth.uid() OR
        challenge_id IN (
            SELECT gc.id FROM game_challenges gc
            WHERE EXISTS (
                SELECT 1 FROM classrooms c 
                WHERE c.teacher_id = auth.uid()
            )
        )
    );

CREATE POLICY "Everyone can view leaderboards" ON leaderboards
    FOR SELECT USING (true);

CREATE POLICY "Students can view achievements" ON student_achievements
    FOR SELECT USING (
        student_id = auth.uid() OR
        student_id IN (
            SELECT cm.student_id FROM classroom_members cm
            JOIN classrooms c ON c.id = cm.classroom_id
            WHERE c.teacher_id = auth.uid()
        )
    );

-- Team competition policies
CREATE POLICY "Classroom members can view competitions" ON team_competitions
    FOR SELECT USING (
        classroom_id IN (
            SELECT cm.classroom_id FROM classroom_members cm WHERE cm.student_id = auth.uid()
            UNION
            SELECT id FROM classrooms WHERE teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can join competition teams" ON competition_team_members
    FOR INSERT WITH CHECK (student_id = auth.uid());

-- Functions for analytics and gamification

-- Generate daily analytics snapshots
CREATE OR REPLACE FUNCTION generate_daily_analytics_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    classroom_rec RECORD;
    snapshot_data RECORD;
BEGIN
    FOR classroom_rec IN SELECT id FROM classrooms LOOP
        -- Calculate daily metrics for each classroom
        SELECT 
            COUNT(DISTINCT p.id)::INTEGER as student_count,
            COALESCE(AVG(p.metacog_score), 0) as avg_metacog_score,
            COALESCE(AVG(daily_reflections.reflection_count), 0) as avg_reflection_count,
            COALESCE(AVG(daily_strategies.strategy_count), 0) as avg_strategy_usage,
            COALESCE(AVG(CASE WHEN daily_reflections.reflection_count > 0 THEN 1 ELSE 0 END), 0) as completion_rate,
            COALESCE(AVG(CASE WHEN daily_collab.collab_count > 0 THEN 1 ELSE 0 END), 0) as peer_collaboration_rate,
            COALESCE(SUM(daily_interventions.intervention_count), 0)::INTEGER as intervention_count,
            COALESCE(SUM(daily_badges.badge_count), 0)::INTEGER as badge_earned_count
        INTO snapshot_data
        FROM profiles p
        JOIN classroom_members cm ON p.id = cm.student_id
        LEFT JOIN (
            SELECT user_id, COUNT(*) as reflection_count
            FROM metacog_events 
            WHERE event_type = 'reflection_submitted' 
              AND created_at::date = CURRENT_DATE
            GROUP BY user_id
        ) daily_reflections ON p.id = daily_reflections.user_id
        LEFT JOIN (
            SELECT user_id, COUNT(*) as strategy_count
            FROM metacog_events 
            WHERE event_type = 'strategy_used'
              AND created_at::date = CURRENT_DATE
            GROUP BY user_id
        ) daily_strategies ON p.id = daily_strategies.user_id
        LEFT JOIN (
            SELECT user_id, COUNT(*) as collab_count
            FROM metacog_events 
            WHERE event_type IN ('peer_comment_added', 'reflection_shared')
              AND created_at::date = CURRENT_DATE
            GROUP BY user_id
        ) daily_collab ON p.id = daily_collab.user_id
        LEFT JOIN (
            SELECT student_id, COUNT(*) as intervention_count
            FROM teacher_interventions 
            WHERE created_at::date = CURRENT_DATE
            GROUP BY student_id
        ) daily_interventions ON p.id = daily_interventions.student_id
        LEFT JOIN (
            SELECT student_id, COUNT(*) as badge_count
            FROM student_achievements 
            WHERE earned_at::date = CURRENT_DATE
            GROUP BY student_id
        ) daily_badges ON p.id = daily_badges.student_id
        WHERE cm.classroom_id = classroom_rec.id
          AND p.role = 'student';

        -- Insert or update snapshot
        INSERT INTO analytics_snapshots (
            classroom_id, snapshot_date, student_count, avg_metacog_score,
            avg_reflection_count, avg_strategy_usage, completion_rate,
            peer_collaboration_rate, intervention_count, badge_earned_count
        ) VALUES (
            classroom_rec.id, CURRENT_DATE, snapshot_data.student_count,
            snapshot_data.avg_metacog_score, snapshot_data.avg_reflection_count,
            snapshot_data.avg_strategy_usage, snapshot_data.completion_rate,
            snapshot_data.peer_collaboration_rate, snapshot_data.intervention_count,
            snapshot_data.badge_earned_count
        )
        ON CONFLICT (classroom_id, snapshot_date) 
        DO UPDATE SET
            student_count = EXCLUDED.student_count,
            avg_metacog_score = EXCLUDED.avg_metacog_score,
            avg_reflection_count = EXCLUDED.avg_reflection_count,
            avg_strategy_usage = EXCLUDED.avg_strategy_usage,
            completion_rate = EXCLUDED.completion_rate,
            peer_collaboration_rate = EXCLUDED.peer_collaboration_rate,
            intervention_count = EXCLUDED.intervention_count,
            badge_earned_count = EXCLUDED.badge_earned_count;
    END LOOP;
END;
$$;

-- Update leaderboards
CREATE OR REPLACE FUNCTION update_leaderboards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    classroom_rec RECORD;
    leaderboard_data JSONB;
BEGIN
    -- Update classroom metacognition leaderboards
    FOR classroom_rec IN SELECT id FROM classrooms LOOP
        -- Weekly metacognition leaderboard
        SELECT jsonb_agg(
            jsonb_build_object(
                'student_id', p.id,
                'student_name', p.name,
                'score', p.metacog_score,
                'rank', ROW_NUMBER() OVER (ORDER BY p.metacog_score DESC)
            )
        ) INTO leaderboard_data
        FROM profiles p
        JOIN classroom_members cm ON p.id = cm.student_id
        WHERE cm.classroom_id = classroom_rec.id
          AND p.role = 'student'
        ORDER BY p.metacog_score DESC
        LIMIT 10;

        INSERT INTO leaderboards (
            leaderboard_type, scope_id, category, time_period, rankings
        ) VALUES (
            'classroom', classroom_rec.id, 'metacognition', 'weekly', leaderboard_data
        )
        ON CONFLICT (leaderboard_type, scope_id, category, time_period)
        DO UPDATE SET rankings = EXCLUDED.rankings, last_updated = NOW();

        -- Weekly collaboration leaderboard
        SELECT jsonb_agg(
            jsonb_build_object(
                'student_id', collab_stats.user_id,
                'student_name', p.name,
                'score', collab_stats.collab_count,
                'rank', ROW_NUMBER() OVER (ORDER BY collab_stats.collab_count DESC)
            )
        ) INTO leaderboard_data
        FROM (
            SELECT user_id, COUNT(*) as collab_count
            FROM metacog_events 
            WHERE event_type IN ('peer_comment_added', 'reflection_shared')
              AND created_at > NOW() - INTERVAL '7 days'
            GROUP BY user_id
        ) collab_stats
        JOIN profiles p ON collab_stats.user_id = p.id
        JOIN classroom_members cm ON p.id = cm.student_id
        WHERE cm.classroom_id = classroom_rec.id
        ORDER BY collab_stats.collab_count DESC
        LIMIT 10;

        INSERT INTO leaderboards (
            leaderboard_type, scope_id, category, time_period, rankings
        ) VALUES (
            'classroom', classroom_rec.id, 'collaboration', 'weekly', leaderboard_data
        )
        ON CONFLICT (leaderboard_type, scope_id, category, time_period)
        DO UPDATE SET rankings = EXCLUDED.rankings, last_updated = NOW();
    END LOOP;
END;
$$;

-- Award achievements based on milestones
CREATE OR REPLACE FUNCTION check_and_award_achievements()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_rec RECORD;
    reflection_count INTEGER;
    collaboration_count INTEGER;
    current_streak INTEGER;
BEGIN
    FOR student_rec IN 
        SELECT id, name, metacog_score, created_at 
        FROM profiles 
        WHERE role = 'student' 
    LOOP
        -- Check for reflection milestones
        SELECT COUNT(*) INTO reflection_count
        FROM metacog_events
        WHERE user_id = student_rec.id 
          AND event_type = 'reflection_submitted';

        -- Award reflection milestone badges
        IF reflection_count >= 10 AND NOT EXISTS (
            SELECT 1 FROM student_achievements 
            WHERE student_id = student_rec.id 
              AND achievement_name = 'Reflection Rookie'
        ) THEN
            INSERT INTO student_achievements (
                student_id, achievement_type, achievement_name, 
                description, points_awarded, rarity
            ) VALUES (
                student_rec.id, 'milestone', 'Reflection Rookie',
                'Completed 10 reflections', 50, 'common'
            );
        END IF;

        IF reflection_count >= 50 AND NOT EXISTS (
            SELECT 1 FROM student_achievements 
            WHERE student_id = student_rec.id 
              AND achievement_name = 'Reflection Master'
        ) THEN
            INSERT INTO student_achievements (
                student_id, achievement_type, achievement_name, 
                description, points_awarded, rarity
            ) VALUES (
                student_rec.id, 'milestone', 'Reflection Master',
                'Completed 50 reflections', 200, 'uncommon'
            );
        END IF;

        -- Check for high metacognition score
        IF student_rec.metacog_score >= 0.8 AND NOT EXISTS (
            SELECT 1 FROM student_achievements 
            WHERE student_id = student_rec.id 
              AND achievement_name = 'Metacognition Expert'
        ) THEN
            INSERT INTO student_achievements (
                student_id, achievement_type, achievement_name, 
                description, points_awarded, rarity
            ) VALUES (
                student_rec.id, 'badge', 'Metacognition Expert',
                'Achieved 80%+ metacognition score', 300, 'rare'
            );
        END IF;

        -- Check for collaboration achievements
        SELECT COUNT(*) INTO collaboration_count
        FROM metacog_events
        WHERE user_id = student_rec.id 
          AND event_type IN ('peer_comment_added', 'reflection_shared')
          AND created_at > NOW() - INTERVAL '30 days';

        IF collaboration_count >= 5 AND NOT EXISTS (
            SELECT 1 FROM student_achievements 
            WHERE student_id = student_rec.id 
              AND achievement_name = 'Team Player'
              AND earned_at > NOW() - INTERVAL '30 days'
        ) THEN
            INSERT INTO student_achievements (
                student_id, achievement_type, achievement_name, 
                description, points_awarded, rarity
            ) VALUES (
                student_rec.id, 'badge', 'Team Player',
                'Active in peer collaboration this month', 100, 'common'
            );
        END IF;
    END LOOP;
END;
$$;

-- Initial game challenges
INSERT INTO game_challenges (name, description, challenge_type, category, criteria, reward_points, difficulty_level, duration_days, is_active) VALUES 
('Reflection Week', 'Submit a reflection every day for 7 days', 'individual', 'reflection', 
 '{"daily_reflections": 7, "consecutive_days": 7}', 100, 2, 7, true),

('Strategy Explorer', 'Try 5 different metacognitive strategies', 'individual', 'strategy',
 '{"unique_strategies": 5}', 75, 1, 14, true),

('Peer Helper', 'Give helpful feedback on 10 peer reflections', 'individual', 'collaboration',
 '{"peer_comments": 10, "comment_type": "feedback"}', 150, 3, 30, true),

('Team Reflection Challenge', 'Work with teammates to complete group reflections', 'team', 'collaboration',
 '{"team_reflections": 5, "min_team_size": 3}', 200, 4, 21, true),

('Metacog Improvement', 'Improve your metacognition score by 0.2 points', 'individual', 'improvement',
 '{"score_improvement": 0.2}', 250, 5, 60, true);