import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  Trophy,
  Medal,
  Star,
  Target,
  Users,
  Clock,
  Flame,
  Award,
  TrendingUp,
  Play,
  CheckCircle2,
  Zap,
  Crown,
  Gift,
  Calendar,
  Plus
} from 'lucide-react';

interface GameChallenge {
  id: string;
  name: string;
  description: string;
  challenge_type: string;
  category: string;
  criteria: any;
  reward_points: number;
  difficulty_level: number;
  duration_days: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  participant_count?: number;
  user_participation?: {
    is_completed: boolean;
    progress: any;
    points_earned: number;
    joined_at: string;
  };
}

interface LeaderboardEntry {
  student_id: string;
  student_name: string;
  score: number;
  rank: number;
  avatar_url?: string;
  badge_count?: number;
  is_current_user?: boolean;
}

interface StudentAchievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  description: string;
  icon_url?: string;
  points_awarded: number;
  rarity: string;
  earned_at: string;
}

interface TeamCompetition {
  id: string;
  competition_name: string;
  description: string;
  competition_type: string;
  status: string;
  start_date: string;
  end_date: string;
  max_team_size: number;
  team_count: number;
  user_team?: {
    team_name: string;
    team_color: string;
    current_score: number;
    rank: number;
    members: any[];
  };
}

export const GamificationHub: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('challenges');
  const [challenges, setChallenges] = useState<GameChallenge[]>([]);
  const [leaderboards, setLeaderboards] = useState<{ [key: string]: LeaderboardEntry[] }>({});
  const [achievements, setAchievements] = useState<StudentAchievement[]>([]);
  const [competitions, setCompetitions] = useState<TeamCompetition[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<GameChallenge | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [userStats, setUserStats] = useState({
    total_points: 0,
    badges_earned: 0,
    challenges_completed: 0,
    current_rank: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (state.currentUser) {
      loadGamificationData();
    }
  }, [state.currentUser]);

  const loadGamificationData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadChallenges(),
        loadLeaderboards(),
        loadAchievements(),
        loadCompetitions(),
        loadUserStats()
      ]);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChallenges = async () => {
    if (!state.currentUser) return;

    try {
      const { data: challengeData, error } = await supabase
        .from('game_challenges')
        .select(`
          *,
          challenge_participants!left (
            participant_id,
            is_completed,
            progress,
            points_earned,
            joined_at
          )
        `)
        .eq('is_active', true)
        .order('difficulty_level', { ascending: true });

      if (error) {
        console.error('Error loading challenges:', error);
        return;
      }

      const challengesWithParticipation: GameChallenge[] = (challengeData || []).map((challenge: any) => {
        const userParticipation = challenge.challenge_participants?.find(
          (p: any) => p.participant_id === state.currentUser.id
        );

        return {
          id: challenge.id,
          name: challenge.name,
          description: challenge.description,
          challenge_type: challenge.challenge_type,
          category: challenge.category,
          criteria: challenge.criteria,
          reward_points: challenge.reward_points,
          difficulty_level: challenge.difficulty_level,
          duration_days: challenge.duration_days,
          is_active: challenge.is_active,
          start_date: challenge.start_date,
          end_date: challenge.end_date,
          participant_count: challenge.challenge_participants?.length || 0,
          user_participation: userParticipation ? {
            is_completed: userParticipation.is_completed,
            progress: userParticipation.progress,
            points_earned: userParticipation.points_earned,
            joined_at: userParticipation.joined_at
          } : undefined
        };
      });

      setChallenges(challengesWithParticipation);

    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const loadLeaderboards = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('leaderboard_type', 'classroom')
        .in('category', ['metacognition', 'collaboration', 'challenges'])
        .eq('time_period', 'weekly');

      if (error) {
        console.error('Error loading leaderboards:', error);
        return;
      }

      const leaderboardMap: { [key: string]: LeaderboardEntry[] } = {};
      
      (data || []).forEach((board: any) => {
        const rankings = board.rankings || [];
        const entries: LeaderboardEntry[] = rankings.map((entry: any) => ({
          student_id: entry.student_id,
          student_name: entry.student_name,
          score: entry.score,
          rank: entry.rank,
          avatar_url: entry.avatar_url,
          badge_count: entry.badge_count || 0,
          is_current_user: entry.student_id === state.currentUser.id
        }));

        leaderboardMap[board.category] = entries;
      });

      setLeaderboards(leaderboardMap);

    } catch (error) {
      console.error('Error loading leaderboards:', error);
    }
  };

  const loadAchievements = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('student_achievements')
        .select('*')
        .eq('student_id', state.currentUser.id)
        .order('earned_at', { ascending: false });

      if (error) {
        console.error('Error loading achievements:', error);
        return;
      }

      setAchievements(data || []);

    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadCompetitions = async () => {
    if (!state.currentUser) return;

    try {
      // Get user's classroom competitions
      const { data, error } = await supabase
        .from('team_competitions')
        .select(`
          *,
          competition_teams!inner (
            id,
            team_name,
            team_color,
            current_score,
            competition_team_members!inner (
              student_id
            )
          )
        `)
        .eq('competition_teams.competition_team_members.student_id', state.currentUser.id);

      if (error) {
        console.error('Error loading competitions:', error);
        return;
      }

      // Transform competitions data (simplified)
      const competitionsList: TeamCompetition[] = (data || []).map((comp: any) => ({
        id: comp.id,
        competition_name: comp.competition_name,
        description: comp.description,
        competition_type: comp.competition_type,
        status: comp.status,
        start_date: comp.start_date,
        end_date: comp.end_date,
        max_team_size: comp.max_team_size,
        team_count: 1, // Simplified
        user_team: comp.competition_teams?.[0] ? {
          team_name: comp.competition_teams[0].team_name,
          team_color: comp.competition_teams[0].team_color,
          current_score: comp.competition_teams[0].current_score,
          rank: 1, // Would need additional query
          members: []
        } : undefined
      }));

      setCompetitions(competitionsList);

    } catch (error) {
      console.error('Error loading competitions:', error);
    }
  };

  const loadUserStats = async () => {
    if (!state.currentUser) return;

    try {
      // Calculate user stats
      const totalPoints = achievements.reduce((sum, achievement) => sum + achievement.points_awarded, 0);
      const badgesEarned = achievements.filter(a => a.achievement_type === 'badge').length;
      const challengesCompleted = challenges.filter(c => c.user_participation?.is_completed).length;

      setUserStats({
        total_points: totalPoints,
        badges_earned: badgesEarned,
        challenges_completed: challengesCompleted,
        current_rank: leaderboards.metacognition?.find(entry => entry.is_current_user)?.rank || 0
      });

    } catch (error) {
      console.error('Error calculating user stats:', error);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!state.currentUser) return;

    try {
      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          participant_id: state.currentUser.id
        });

      if (error) {
        console.error('Error joining challenge:', error);
        return;
      }

      // Reload challenges to update participation status
      await loadChallenges();
      setShowJoinDialog(false);

    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'uncommon': return 'border-green-300 bg-green-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffInDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return 'Expired';
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day left';
    return `${diffInDays} days left`;
  };

  // Challenges Tab
  const ChallengesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Active Challenges</h3>
          <p className="text-gray-600">Complete challenges to earn points and unlock achievements</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{userStats.total_points}</div>
          <div className="text-sm text-gray-600">Total Points</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map((challenge) => (
          <Card key={challenge.id} className={`relative overflow-hidden ${
            challenge.user_participation?.is_completed ? 'bg-green-50 border-green-200' : ''
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {challenge.category === 'reflection' && <Target className="w-5 h-5 text-blue-600" />}
                    {challenge.category === 'collaboration' && <Users className="w-5 h-5 text-green-600" />}
                    {challenge.category === 'strategy' && <Zap className="w-5 h-5 text-purple-600" />}
                    {challenge.category === 'improvement' && <TrendingUp className="w-5 h-5 text-orange-600" />}
                    {challenge.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={getDifficultyColor(challenge.difficulty_level)}>
                    Level {challenge.difficulty_level}
                  </Badge>
                  {challenge.user_participation?.is_completed && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                  {challenge.reward_points} points
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  {challenge.end_date ? formatTimeRemaining(challenge.end_date) : `${challenge.duration_days} days`}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress:</span>
                  <span>{challenge.user_participation?.is_completed ? '100%' : '0%'}</span>
                </div>
                <Progress 
                  value={challenge.user_participation?.is_completed ? 100 : 0} 
                  className="h-2"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {challenge.participant_count} participants
                </div>
                {!challenge.user_participation ? (
                  <Button 
                    onClick={() => {
                      setSelectedChallenge(challenge);
                      setShowJoinDialog(true);
                    }}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Play className="w-3 h-3" />
                    Join
                  </Button>
                ) : challenge.user_participation.is_completed ? (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    In Progress
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {challenges.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Challenges</h3>
            <p className="text-gray-600">New challenges will appear here regularly. Check back soon!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Leaderboards Tab
  const LeaderboardsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Leaderboards</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">#{userStats.current_rank || '—'}</div>
          <div className="text-sm text-gray-600">Your Rank</div>
        </div>
      </div>

      <Tabs defaultValue="metacognition" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metacognition">Metacognition</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>

        {Object.entries(leaderboards).map(([category, entries]) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  {category.charAt(0).toUpperCase() + category.slice(1)} Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length > 0 ? (
                  <div className="space-y-3">
                    {entries.slice(0, 10).map((entry, index) => (
                      <div 
                        key={entry.student_id} 
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          entry.is_current_user ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                            entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                            entry.rank === 3 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {entry.rank === 1 && <Crown className="w-4 h-4" />}
                            {entry.rank === 2 && <Medal className="w-4 h-4" />}
                            {entry.rank === 3 && <Award className="w-4 h-4" />}
                            {entry.rank > 3 && entry.rank}
                          </div>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={entry.avatar_url} />
                            <AvatarFallback>{entry.student_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {entry.student_name}
                              {entry.is_current_user && <Badge variant="secondary" className="ml-2 text-xs">You</Badge>}
                            </div>
                            {entry.badge_count > 0 && (
                              <div className="text-xs text-gray-500">{entry.badge_count} badges</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{entry.score.toFixed(1)}</div>
                          <div className="text-xs text-gray-500">score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No rankings available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  // Achievements Tab
  const AchievementsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Your Achievements</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{userStats.badges_earned}</div>
          <div className="text-sm text-gray-600">Badges Earned</div>
        </div>
      </div>

      {achievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <Card key={achievement.id} className={`border-2 ${getRarityColor(achievement.rarity)}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    achievement.achievement_type === 'badge' ? 'bg-blue-100' :
                    achievement.achievement_type === 'milestone' ? 'bg-green-100' :
                    achievement.achievement_type === 'streak' ? 'bg-orange-100' : 'bg-purple-100'
                  }`}>
                    {achievement.achievement_type === 'badge' && <Medal className="w-6 h-6 text-blue-600" />}
                    {achievement.achievement_type === 'milestone' && <Target className="w-6 h-6 text-green-600" />}
                    {achievement.achievement_type === 'streak' && <Flame className="w-6 h-6 text-orange-600" />}
                    {achievement.achievement_type === 'challenge' && <Trophy className="w-6 h-6 text-purple-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{achievement.achievement_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-yellow-600">
                        <Star className="w-3 h-3" />
                        {achievement.points_awarded} pts
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(achievement.earned_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Achievements Yet</h3>
            <p className="text-gray-600">Complete challenges and activities to earn your first achievements!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Competitions Tab
  const CompetitionsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Team Competitions</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-red-600">{competitions.length}</div>
          <div className="text-sm text-gray-600">Active Competitions</div>
        </div>
      </div>

      {competitions.length > 0 ? (
        <div className="space-y-4">
          {competitions.map((competition) => (
            <Card key={competition.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{competition.competition_name}</CardTitle>
                    <p className="text-gray-600">{competition.description}</p>
                  </div>
                  <Badge variant={
                    competition.status === 'active' ? 'default' :
                    competition.status === 'upcoming' ? 'secondary' : 'outline'
                  }>
                    {competition.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <div className="font-medium">{competition.competition_type.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Teams:</span>
                    <div className="font-medium">{competition.team_count}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Start:</span>
                    <div className="font-medium">{new Date(competition.start_date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">End:</span>
                    <div className="font-medium">{new Date(competition.end_date).toLocaleDateString()}</div>
                  </div>
                </div>

                {competition.user_team && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: competition.user_team.team_color }} />
                        <span className="font-medium">{competition.user_team.team_name}</span>
                        <Badge variant="outline">Rank #{competition.user_team.rank}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{competition.user_team.current_score}</div>
                        <div className="text-xs text-gray-600">points</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Competitions</h3>
            <p className="text-gray-600">Team competitions will appear here when available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (!state.currentUser) {
    return (
      <Alert>
        <AlertDescription>
          Please log in to access the gamification hub.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gamification Hub</h1>
          <p className="text-gray-600 mt-2">
            Complete challenges, earn achievements, and compete with classmates
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{userStats.total_points}</div>
            <div className="text-xs text-gray-600">Points</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{userStats.badges_earned}</div>
            <div className="text-xs text-gray-600">Badges</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{userStats.challenges_completed}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="leaderboards" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Leaderboards
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="competitions" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Competitions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="mt-6">
          <ChallengesTab />
        </TabsContent>

        <TabsContent value="leaderboards" className="mt-6">
          <LeaderboardsTab />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <AchievementsTab />
        </TabsContent>

        <TabsContent value="competitions" className="mt-6">
          <CompetitionsTab />
        </TabsContent>
      </Tabs>

      {/* Join Challenge Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Challenge</DialogTitle>
          </DialogHeader>
          {selectedChallenge && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">{selectedChallenge.name}</h4>
                <p className="text-gray-600 text-sm">{selectedChallenge.description}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Difficulty:</span>
                  <Badge className={getDifficultyColor(selectedChallenge.difficulty_level)}>
                    Level {selectedChallenge.difficulty_level}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Reward:</span>
                  <span className="font-medium">{selectedChallenge.reward_points} points</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span className="font-medium">{selectedChallenge.duration_days} days</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => joinChallenge(selectedChallenge.id)} className="flex-1">
                  Join Challenge
                </Button>
                <Button onClick={() => setShowJoinDialog(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      )}
    </div>
  );
};