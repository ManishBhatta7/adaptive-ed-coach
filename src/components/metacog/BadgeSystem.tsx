import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Brain, 
  Users,
  Crown,
  Medal,
  Award
} from 'lucide-react';

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: any;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

interface StudentBadge extends BadgeDefinition {
  earned_at: string;
  progress?: number;
}

interface LeaderboardEntry {
  student_id: string;
  student_name: string;
  badge_count: number;
  metacog_score: number;
  recent_badges: string[];
}

const BADGE_RARITY_STYLES = {
  common: 'bg-gray-100 border-gray-300 text-gray-700',
  uncommon: 'bg-green-100 border-green-300 text-green-700',
  rare: 'bg-blue-100 border-blue-300 text-blue-700',
  legendary: 'bg-purple-100 border-purple-300 text-purple-700'
};

export const BadgeSystem: React.FC = () => {
  const { state } = useAppContext();
  const [userBadges, setUserBadges] = useState<StudentBadge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<BadgeDefinition[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-badges' | 'available' | 'leaderboard'>('my-badges');

  useEffect(() => {
    if (state.currentUser) {
      fetchBadgeData();
    }
  }, [state.currentUser]);

  const fetchBadgeData = async () => {
    if (!state.currentUser) return;

    setLoading(true);
    try {
      // Fetch user's earned badges
      const { data: earnedBadges, error: badgesError } = await supabase
        .from('student_badges')
        .select(`
          earned_at,
          badge_definitions (
            id, name, description, icon, criteria
          )
        `)
        .eq('student_id', state.currentUser.id);

      if (badgesError) {
        console.error('Error fetching badges:', badgesError);
      } else {
        const formattedBadges = earnedBadges?.map(badge => ({
          ...badge.badge_definitions,
          earned_at: badge.earned_at,
          rarity: getBadgeRarity(badge.badge_definitions?.name || '')
        })) || [];
        setUserBadges(formattedBadges as StudentBadge[]);
      }

      // Fetch all available badges
      const { data: allBadges, error: allBadgesError } = await supabase
        .from('badge_definitions')
        .select('*');

      if (allBadgesError) {
        console.error('Error fetching all badges:', allBadgesError);
      } else {
        const formattedAllBadges = allBadges?.map(badge => ({
          ...badge,
          rarity: getBadgeRarity(badge.name)
        })) || [];
        setAvailableBadges(formattedAllBadges as BadgeDefinition[]);
      }

      // Fetch classroom leaderboard if student is in a classroom
      if (state.classrooms.length > 0) {
        await fetchLeaderboard();
      }

    } catch (error) {
      console.error('Error fetching badge data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    if (!state.currentUser || state.classrooms.length === 0) return;

    try {
      const classroomIds = state.classrooms.map(c => c.id);

      // Get all students in the classrooms
      const { data: classroomMembers, error } = await supabase
        .from('classroom_members')
        .select(`
          student_id,
          profiles!classroom_members_student_id_fkey (
            name, metacog_score
          )
        `)
        .in('classroom_id', classroomIds);

      if (error) {
        console.error('Error fetching classroom members:', error);
        return;
      }

      // Get badge counts for each student
      const studentIds = classroomMembers?.map(m => m.student_id) || [];
      
      const { data: badgeCounts, error: badgeError } = await supabase
        .from('student_badges')
        .select('student_id, badge_id')
        .in('student_id', studentIds);

      if (badgeError) {
        console.error('Error fetching badge counts:', badgeError);
        return;
      }

      // Process leaderboard data
      const leaderboardData: LeaderboardEntry[] = [];
      
      for (const member of classroomMembers || []) {
        const studentBadges = badgeCounts?.filter(b => b.student_id === member.student_id) || [];
        
        leaderboardData.push({
          student_id: member.student_id,
          student_name: member.profiles?.name || 'Unknown',
          badge_count: studentBadges.length,
          metacog_score: member.profiles?.metacog_score || 0,
          recent_badges: studentBadges.slice(-3).map(b => b.badge_id) // Last 3 badges
        });
      }

      // Sort by badge count, then by metacog score
      leaderboardData.sort((a, b) => {
        if (a.badge_count !== b.badge_count) {
          return b.badge_count - a.badge_count;
        }
        return b.metacog_score - a.metacog_score;
      });

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const getBadgeRarity = (badgeName: string): 'common' | 'uncommon' | 'rare' | 'legendary' => {
    const rarityMap: Record<string, 'common' | 'uncommon' | 'rare' | 'legendary'> = {
      'Reflector': 'common',
      'Deep Thinker': 'uncommon',
      'Strategy Master': 'rare',
      'Growth Mindset': 'rare',
      'Metacognition Guru': 'legendary',
      'Peer Mentor': 'rare',
      'Innovation Star': 'legendary'
    };
    return rarityMap[badgeName] || 'common';
  };

  const getBadgeProgress = (badge: BadgeDefinition): number => {
    if (!state.currentUser) return 0;

    // This would calculate progress towards earning the badge
    // For now, return 0 if not earned, 100 if earned
    const isEarned = userBadges.some(ub => ub.id === badge.id);
    return isEarned ? 100 : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex gap-2">
        <Button 
          variant={activeTab === 'my-badges' ? 'default' : 'outline'}
          onClick={() => setActiveTab('my-badges')}
          className="flex items-center gap-2"
        >
          <Award className="w-4 h-4" />
          My Badges ({userBadges.length})
        </Button>
        <Button 
          variant={activeTab === 'available' ? 'default' : 'outline'}
          onClick={() => setActiveTab('available')}
          className="flex items-center gap-2"
        >
          <Target className="w-4 h-4" />
          Available Badges
        </Button>
        {state.classrooms.length > 0 && (
          <Button 
            variant={activeTab === 'leaderboard' ? 'default' : 'outline'}
            onClick={() => setActiveTab('leaderboard')}
            className="flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Class Leaderboard
          </Button>
        )}
      </div>

      {/* My Badges */}
      {activeTab === 'my-badges' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-yellow-600" />
              Your Achievement Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userBadges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userBadges.map(badge => (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-lg border-2 text-center ${BADGE_RARITY_STYLES[badge.rarity]} hover:shadow-lg transition-shadow`}
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                    <p className="text-xs opacity-80 mb-2">{badge.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      {badge.rarity}
                    </Badge>
                    <p className="text-xs mt-2 opacity-70">
                      Earned {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start Your Badge Journey!</h3>
                <p className="text-gray-600 mb-4">
                  Complete reflections and demonstrate metacognitive thinking to earn your first badge.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Badges */}
      {activeTab === 'available' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Badges to Earn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableBadges.map(badge => {
                const isEarned = userBadges.some(ub => ub.id === badge.id);
                const progress = getBadgeProgress(badge);
                
                return (
                  <div
                    key={badge.id}
                    className={`p-4 border rounded-lg ${isEarned ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-2xl ${isEarned ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                        {badge.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{badge.name}</h3>
                          {isEarned && <Star className="w-4 h-4 text-yellow-500" />}
                          <Badge variant="outline" className="text-xs">
                            {badge.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                        
                        {!isEarned && (
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        )}
                        
                        {isEarned && (
                          <Badge className="bg-green-600">
                            ✓ Earned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              Classroom Reflection Champions
            </CardTitle>
            <p className="text-sm text-gray-600">
              Top metacognitive thinkers in your classes, ranked by badges and reflection quality.
            </p>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((entry, index) => {
                  const isCurrentUser = entry.student_id === state.currentUser?.id;
                  const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                  
                  return (
                    <div
                      key={entry.student_id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isCurrentUser 
                          ? 'border-blue-300 bg-blue-50' 
                          : index < 3 
                            ? 'border-yellow-300 bg-yellow-50' 
                            : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold w-12 text-center">
                          {rankIcon}
                        </div>
                        <div>
                          <p className={`font-medium ${isCurrentUser ? 'text-blue-700' : ''}`}>
                            {entry.student_name}
                            {isCurrentUser && ' (You)'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              {entry.badge_count} badges
                            </span>
                            <span className="flex items-center gap-1">
                              <Brain className="w-3 h-3" />
                              {entry.metacog_score.toFixed(2)} score
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        {/* Show recent badge icons */}
                        {entry.recent_badges.slice(0, 3).map((badgeId, i) => {
                          const badge = availableBadges.find(b => b.id === badgeId);
                          return badge ? (
                            <span key={i} className="text-xs" title={badge.name}>
                              {badge.icon}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No leaderboard data available yet.</p>
                <p className="text-sm text-gray-500">
                  Start reflecting to see your class rankings!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};