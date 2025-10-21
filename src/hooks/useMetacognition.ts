import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { Reflection, MetacogSummary } from '@/types/metacog';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: Record<string, any>;
  earned_at?: string;
}

interface MetacogStats {
  metacog_score: number;
  total_reflections: number;
  badges: Badge[];
  recent_reflections: Reflection[];
  summary: MetacogSummary;
}

export const useMetacognition = () => {
  const { state } = useAppContext();
  const [stats, setStats] = useState<MetacogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's metacognition stats
  const fetchStats = async () => {
    if (!state.currentUser) return;

    setLoading(true);
    setError(null);

    try {
      // Get user profile with metacog score
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('metacog_score, total_reflections')
        .eq('id', state.currentUser.id)
        .single();

      if (profileError) {
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      // Get user's badges
      const { data: userBadges, error: badgesError } = await supabase
        .from('student_badges')
        .select(`
          earned_at,
          badge_definitions (
            id,
            name,
            description,
            icon,
            criteria
          )
        `)
        .eq('student_id', state.currentUser.id);

      if (badgesError) {
        console.error('Error fetching badges:', badgesError);
      }

      // Get recent reflections
      const { data: reflections, error: reflectionsError } = await supabase
        .from('reflections')
        .select('*')
        .eq('student_id', state.currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reflectionsError) {
        console.error('Error fetching reflections:', reflectionsError);
      }

      // Transform badge data
      const badges = userBadges?.map(ub => ({
        ...ub.badge_definitions,
        earned_at: ub.earned_at
      })) || [];

      // Calculate summary statistics
      const summary = calculateSummary(reflections || []);

      setStats({
        metacog_score: profile?.metacog_score || 0,
        total_reflections: profile?.total_reflections || 0,
        badges,
        recent_reflections: reflections || [],
        summary
      });

    } catch (err) {
      console.error('Error fetching metacognition stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metacognition data');
    } finally {
      setLoading(false);
    }
  };

  // Submit a new reflection
  const submitReflection = async (reflectionData: Omit<Reflection, 'id' | 'student_id' | 'created_at' | 'updated_at'>) => {
    if (!state.currentUser) {
      throw new Error('User must be logged in');
    }

    const { data, error } = await supabase
      .from('reflections')
      .insert([{
        ...reflectionData,
        student_id: state.currentUser.id
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit reflection: ${error.message}`);
    }

    // Refresh stats to get updated score and potentially new badges
    await fetchStats();

    return data;
  };

  // Check for newly earned badges
  const checkForNewBadges = async () => {
    if (!state.currentUser || !stats) return [];

    const { data: allBadges } = await supabase
      .from('badge_definitions')
      .select('*');

    const { data: currentBadges } = await supabase
      .from('student_badges')
      .select('badge_id')
      .eq('student_id', state.currentUser.id);

    const currentBadgeIds = new Set(currentBadges?.map(b => b.badge_id) || []);
    const newBadges: Badge[] = [];

    // Check each badge criteria
    for (const badge of allBadges || []) {
      if (currentBadgeIds.has(badge.id)) continue;

      const meetsRequirements = checkBadgeCriteria(badge, stats);
      if (meetsRequirements) {
        // Award the badge
        const { error: insertError } = await supabase
          .from('student_badges')
          .insert([{
            student_id: state.currentUser.id,
            badge_id: badge.id
          }]);

        if (!insertError) {
          newBadges.push(badge);
        }
      }
    }

    if (newBadges.length > 0) {
      // Refresh stats to include new badges
      await fetchStats();

      // Show toast notifications for new badges
      newBadges.forEach(badge => {
        toast({
          title: 'New Badge Earned! 🎉',
          description: `${badge.icon} ${badge.name}: ${badge.description}`,
        });
      });
    }

    return newBadges;
  };

  useEffect(() => {
    if (state.currentUser) {
      fetchStats();
    }
  }, [state.currentUser]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    submitReflection,
    checkForNewBadges
  };
};

// Helper function to calculate summary statistics
function calculateSummary(reflections: Reflection[]): MetacogSummary {
  const total_reflections = reflections.length;
  const ratedReflections = reflections.filter(r => r.teacher_rating !== null);
  const avg_teacher_rating = ratedReflections.length > 0 
    ? ratedReflections.reduce((sum, r) => sum + (r.teacher_rating || 0), 0) / ratedReflections.length 
    : null;

  const strategies_used = reflections.reduce((acc, r) => {
    acc[r.strategy_used] = (acc[r.strategy_used] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total_reflections,
    avg_teacher_rating,
    strategies_used
  };
}

// Helper function to check if a student meets badge criteria
function checkBadgeCriteria(badge: Badge, stats: MetacogStats): boolean {
  const criteria = badge.criteria;

  // Reflector badge - first reflection
  if (badge.name === 'Reflector' && stats.total_reflections >= 1) {
    return true;
  }

  // Deep Thinker badge - 10+ reflections with avg rating 1.5+
  if (badge.name === 'Deep Thinker') {
    return stats.total_reflections >= 10 && 
           (stats.summary.avg_teacher_rating || 0) >= 1.5;
  }

  // Strategy Master badge - used all 6 strategies
  if (badge.name === 'Strategy Master') {
    return Object.keys(stats.summary.strategies_used).length >= 6;
  }

  // Growth Mindset badge - 5+ reflections in last 30 days with good avg rating
  if (badge.name === 'Growth Mindset') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentReflections = stats.recent_reflections.filter(r => 
      new Date(r.created_at || '') >= thirtyDaysAgo
    );
    
    const recentAvgRating = recentReflections
      .filter(r => r.teacher_rating !== null)
      .reduce((sum, r) => sum + (r.teacher_rating || 0), 0) / 
      recentReflections.filter(r => r.teacher_rating !== null).length || 0;

    return recentReflections.length >= 5 && recentAvgRating >= 1.0;
  }

  return false;
}