import { useState, useEffect, useMemo, memo } from 'react'; // FIX: Import useMemo and memo
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import ProgressChart from '@/components/dashboard/ProgressChart';
import RecentSubmissions from '@/components/dashboard/RecentSubmissions';
import LearningStyleSummary from '@/components/dashboard/LearningStyleSummary';
import { PersonalizedInsights } from '@/components/progress/PersonalizedInsights';
import { ConfidenceScoreTracker } from '@/components/analytics/ConfidenceScoreTracker';
import { StudyScheduleSuggestions } from '@/components/study/StudyScheduleSuggestions';
import { DifficultyAdaptation } from '@/components/adaptive/DifficultyAdaptation';
import { LearningStyleBadge } from '@/components/learning-style/LearningStyleBadge';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { DailyGoalsWidget } from '@/components/gamification/DailyGoalsWidget';
import { AchievementNotification } from '@/components/gamification/AchievementNotification';
import GamificationService, { Achievement } from '@/services/GamificationService';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, TrendingUp, Users, Sparkles, GraduationCap, Bot } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { useToast } from '@/hooks/use-toast';

// FIX: Memoize heavy components
const MemoizedProgressChart = memo(ProgressChart);
const MemoizedInsights = memo(PersonalizedInsights);
const MemoizedXPBar = memo(XPProgressBar);

const Dashboard = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { isLoading, currentUser } = state; // Destructure explicitly
  const { toast } = useToast();

  // Gamification state (mock data - replace with real data from database)
  const [totalXP, setTotalXP] = useState(250); // Mock XP
  const [achievementToShow, setAchievementToShow] = useState<Achievement | null>(null);
  
  // FIX 1: Memoize expensive logic
  const level = useMemo(() => {
    return GamificationService.calculateLevel(totalXP);
  }, [totalXP]);

  const streak = {
    current: 3,
    longest: 5,
    lastActivity: new Date(),
    streakBonus: 30,
  };

  const [dailyGoals, setDailyGoals] = useState([
    { id: '1', title: 'Submit 1 assignment', description: 'Complete and submit your work', completed: false, xpReward: 50, icon: '統' },
    { id: '2', title: 'Complete learning quiz', description: 'Test your knowledge', completed: false, xpReward: 40, icon: '答' },
    { id: '3', title: 'Study for 30 minutes', description: 'Consistent daily practice', completed: false, xpReward: 30, icon: '竢ｰ' },
  ]);

  const handleGoalComplete = (goalId: string) => {
    setDailyGoals(prev => prev.map(g => 
      g.id === goalId ? { ...g, completed: true } : g
    ));
    
    const goal = dailyGoals.find(g => g.id === goalId);
    if (goal) {
      setTotalXP(prev => prev + goal.xpReward);
      
      toast({
        title: `+${goal.xpReward} XP!`,
        description: goal.title + ' completed!',
      });

      // Check for achievements
      const newAchievements = GamificationService.checkAchievements(state.currentUser || {} as any);
      if (newAchievements.length > 0) {
        setTimeout(() => setAchievementToShow(newAchievements[0]), 500);
      }
    }
  };
  
  // FIX 2: Memoize specific derived data from currentUser
  const recentPerformances = useMemo(() => {
    return currentUser?.performances || [];
  }, [currentUser?.performances]);

  // FIX 3: Calculate stats only when performances change
  const stats = useMemo(() => {
    const perfs = currentUser?.performances || [];
    const total = perfs.length;
    
    const last10 = perfs.slice(-10).filter(p => p.score !== undefined);
    const avgScore = last10.length 
      ? Math.round(last10.reduce((sum, p) => sum + (p.score || 0), 0) / last10.length)
      : 0;
      
    const activeSubjects = new Set(perfs.map(p => p.subjectArea)).size;

    return { total, avgScore, activeSubjects };
  }, [currentUser?.performances]);

  if (isLoading) {
    return (
      <PageLayout 
        title="Dashboard" 
        subtitle="Track your learning progress and personalized insights"
        className="py-8"
      >
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!state.currentUser) {
    return (
      <PageLayout 
        title="Dashboard" 
        subtitle="Track your learning progress and personalized insights"
        className="py-8"
      >
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to RetainLearn</h1>
              <p className="text-gray-600 mb-6">Please log in to access your dashboard</p>
              <button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg" onClick={() => window.location.href = '/login'}>
                Login
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Dashboard" 
      subtitle="Track your learning progress and personalized insights"
      className="py-8"
    >
      <div className="container mx-auto px-6 max-w-7xl">

        {/* Header with Gamification */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {state.currentUser?.name || 'Student'}!
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-gray-600">
                  Track your progress and continue your learning journey
                </p>
                {state.currentUser?.school && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {state.currentUser.school}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Gamification Status Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Use Memoized Component */}
            <MemoizedXPBar 
              level={level}
              animated={true}
              onLevelUp={() => {
                toast({
                  title: 'Level Up! 脂',
                  description: `You're now a ${level.title}!`,
                });
              }}
            />
            <StreakCounter streak={streak} compact={false} animated={true} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/ai-tutor')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bot className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Tutor</h3>
                  <p className="text-sm text-gray-600">Get personalized help</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-edu-light rounded-lg">
                  <FileText className="h-6 w-6 text-edu-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Submit Work</h3>
                  <p className="text-sm text-gray-600">Upload assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-edu-light rounded-lg">
                  <TrendingUp className="h-6 w-6 text-edu-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">View Progress</h3>
                  <p className="text-sm text-gray-600">Track performance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-edu-light rounded-lg">
                  <BookOpen className="h-6 w-6 text-edu-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Learning Resources</h3>
                  <p className="text-sm text-gray-600">Study materials</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Style Indicator */}
        {state.currentUser?.primaryLearningStyle && (
          <div className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">AI-Optimized for Your Learning Style</p>
                  <p className="text-sm text-purple-700">All feedback and content is personalized based on your preferences</p>
                </div>
              </div>
              <LearningStyleBadge 
                learningStyle={state.currentUser.primaryLearningStyle} 
                variant="default"
              />
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Progress Chart & Insights */}
          <div className="xl:col-span-2 space-y-8">
             {/* Use Memoized Component */}
            <MemoizedProgressChart 
              performances={recentPerformances} 
              title="Academic Progress"
              description="Your performance across different subjects over time"
            />
             {/* Use Memoized Component */}
            <MemoizedInsights 
              studentProfile={currentUser}
              timeRange="month"
            />
            <ConfidenceScoreTracker studentProfile={currentUser} />
          </div>

          {/* Right Column - Learning Style Summary & AI Features */}
          <div className="space-y-8">
            <DailyGoalsWidget 
              goals={dailyGoals}
              onGoalComplete={handleGoalComplete}
            />
            <LearningStyleSummary
              primaryStyle={state.currentUser?.primaryLearningStyle}
              secondaryStyle={state.currentUser?.secondaryLearningStyle}
              styleStrengths={state.currentUser?.learningStyleStrengths}
            />
            <DifficultyAdaptation 
              studentProfile={state.currentUser}
              onLevelChange={(newLevel) => {
                toast({
                  title: 'Difficulty Level Updated',
                  description: `Content difficulty adjusted to ${newLevel} level`,
                });
              }}
            />
          </div>
        </div>

        {/* Achievement Notification */}
        <AchievementNotification
          achievement={achievementToShow}
          onClose={() => setAchievementToShow(null)}
          autoClose={true}
          closeDelay={5000}
        />

        {/* Study Schedule */}
        <div className="mt-8">
          <StudyScheduleSuggestions 
            studentProfile={state.currentUser}
            onScheduleAccept={(schedule) => {
              toast({
                title: 'Schedule Accepted!',
                description: 'Your personalized study schedule has been saved.',
              });
            }}
          />
        </div>

        {/* Recent Submissions */}
        <div className="mt-8">
          <RecentSubmissions 
            performances={recentPerformances} 
            limit={5}
          />
        </div>

        {/* Performance Summary Cards - Using Memoized Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Submissions</CardTitle>
              <CardDescription>All time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-edu-primary">
                {stats.total}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Average Score</CardTitle>
              <CardDescription>Last 10 submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-edu-primary">
                {stats.avgScore}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Subjects</CardTitle>
              <CardDescription>Currently studying</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-edu-primary">
                {stats.activeSubjects}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;