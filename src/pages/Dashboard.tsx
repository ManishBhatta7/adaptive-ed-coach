import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// === FIX: Added Button import ===
import { Button } from '@/components/ui/button';
// === FIX: Added ArrowRight import ===
import { BookOpen, FileText, TrendingUp, Users, Sparkles, GraduationCap, ArrowRight } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { state } = useAppContext();
  const { isLoading, currentUser } = state;
  const { toast } = useToast();
  const navigate = useNavigate();

  // === GUARD: REDIRECT TEACHERS ===
  if (!isLoading && currentUser?.role === 'teacher') {
    // Use a small timeout or just render null to prevent render loop warnings
    setTimeout(() => navigate('/teacher-dashboard'), 0);
    return null;
  }

  // Gamification state
  const [totalXP, setTotalXP] = useState(250); 
  const [achievementToShow, setAchievementToShow] = useState<Achievement | null>(null);
  
  const level = GamificationService.calculateLevel(totalXP);
  const streak = {
    current: 3,
    longest: 5,
    lastActivity: new Date(),
    streakBonus: 30,
  };

  const [dailyGoals, setDailyGoals] = useState([
    { id: '1', title: 'Submit 1 assignment', description: 'Complete and submit your work', completed: false, xpReward: 50, icon: '📝' },
    { id: '2', title: 'Complete learning quiz', description: 'Test your knowledge', completed: false, xpReward: 40, icon: '🧠' },
    { id: '3', title: 'Study for 30 minutes', description: 'Consistent daily practice', completed: false, xpReward: 30, icon: '⏱️' },
  ]);

  const handleGoalComplete = (goalId: string) => {
    setDailyGoals(prev => prev.map(g => 
      g.id === goalId ? { ...g, completed: true } : g
    ));
    
    const goal = dailyGoals.find(g => g.id === goalId);
    if (goal) {
      setTotalXP(prev => prev + goal.xpReward);
      toast({ title: `+${goal.xpReward} XP!`, description: goal.title + ' completed!' });
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" /></div>;

  if (!currentUser) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Welcome to AdaptiveEdCoach</h1>
        <Link to="/login">
          <Button className="bg-purple-600 text-white px-6">Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <PageLayout title="Learning Hub" subtitle="Overview" className="bg-gray-50/50">
      <div className="container mx-auto px-6 max-w-7xl py-8 space-y-8">

        {/* === WELCOME HEADER === */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hello, {currentUser.name}! 👋
            </h1>
            <p className="text-gray-600 mt-1">Here's what's happening with your learning today.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            {currentUser.primaryLearningStyle && (
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                <Sparkles className="w-3 h-3 mr-1" />
                {currentUser.primaryLearningStyle} Learner
              </Badge>
            )}
            {currentUser.school && (
              <Badge variant="outline" className="border-gray-200 text-gray-600">
                <GraduationCap className="w-3 h-3 mr-1" />
                {currentUser.school}
              </Badge>
            )}
          </div>
        </motion.div>

        {/* === GAMIFICATION BAR === */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <XPProgressBar level={level} animated={true} />
          <StreakCounter streak={streak} compact={false} animated={true} />
        </motion.div>

        {/* === QUICK COMMANDS === */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'New Submission', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', link: '/submit' },
            { title: 'View Progress', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', link: '/progress' },
            { title: 'Smart Scanner', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50', link: '/ocr' },
            { title: 'Classrooms', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', link: '/classrooms' },
          ].map((item, i) => (
            <Link to={item.link} key={i}>
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
              >
                <div className={`p-3 rounded-lg ${item.bg}`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className="font-semibold text-gray-700">{item.title}</div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* === MAIN BENTO GRID === */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Main Stats */}
          <div className="xl:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ProgressChart 
                performances={currentUser.performances || []} 
                title="Academic Trajectory"
                description="Your graded performance over the last 30 days"
              />
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <PersonalizedInsights studentProfile={currentUser} timeRange="month" />
              <ConfidenceScoreTracker studentProfile={currentUser} />
            </div>
            
            <RecentSubmissions performances={currentUser.performances || []} limit={5} />
          </div>

          {/* Right Column: Sidebar Widgets */}
          <div className="space-y-6">
            <DailyGoalsWidget goals={dailyGoals} onGoalComplete={handleGoalComplete} />
            
            <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-none">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Next Study Session</h3>
                <p className="text-purple-100 text-sm mb-4">Based on your recent "Physics" errors, we recommend reviewing:</p>
                <div className="bg-white/10 rounded-lg p-3 mb-4 backdrop-blur-sm">
                  <div className="font-medium">Chapter 4: Thermodynamics</div>
                  <div className="text-xs text-purple-200">15 min read • 3 practice questions</div>
                </div>
                <Button variant="secondary" className="w-full bg-white text-purple-700 hover:bg-gray-100">
                  Start Session <ArrowRight className="ml-2 w-4 h-4"/>
                </Button>
              </CardContent>
            </Card>

            <LearningStyleSummary
              primaryStyle={currentUser.primaryLearningStyle}
              secondaryStyle={currentUser.secondaryLearningStyle}
              styleStrengths={currentUser.learningStyleStrengths}
            />
          </div>
        </div>

        <AchievementNotification
          achievement={achievementToShow}
          onClose={() => setAchievementToShow(null)}
          autoClose={true}
        />
      </div>
    </PageLayout>
  );
};

export default Dashboard;