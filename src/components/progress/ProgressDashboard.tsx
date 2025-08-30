import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  Award, 
  BookOpen, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { PerformanceRecord } from '@/types/performance';

interface ProgressDashboardProps {
  performances: PerformanceRecord[];
  className?: string;
}

export const ProgressDashboard = ({ performances = [], className = "" }: ProgressDashboardProps) => {
  // Safe data calculations with fallbacks
  const totalAssignments = performances.length;
  const completedAssignments = performances.filter(p => p.score !== undefined).length;
  const averageScore = performances.length > 0 && performances.some(p => p.score !== undefined)
    ? Math.round(performances.filter(p => p.score !== undefined).reduce((sum, p) => sum + (p.score || 0), 0) / performances.filter(p => p.score !== undefined).length)
    : 0;
  
  // Progress calculation
  const progressPercentage = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
  
  // Subject performance analysis
  const subjectStats = performances.reduce((acc, performance) => {
    const subject = performance.subjectArea || 'unknown';
    if (!acc[subject]) {
      acc[subject] = { total: 0, scores: [] };
    }
    acc[subject].total += 1;
    if (performance.score !== undefined) {
      acc[subject].scores.push(performance.score);
    }
    return acc;
  }, {} as Record<string, { total: number; scores: number[] }>);

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentActivity = performances.filter(p => 
    new Date(p.date) >= thirtyDaysAgo
  ).length;

  // Achievements and streaks
  const currentStreak = calculateStreak(performances);
  const highScores = performances.filter(p => (p.score || 0) >= 90).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Assignments</p>
                <p className="text-3xl font-bold text-blue-900">{totalAssignments}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Average Score</p>
                <p className="text-3xl font-bold text-green-900">{averageScore}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Current Streak</p>
                <p className="text-3xl font-bold text-purple-900">{currentStreak}</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Recent Activity</p>
                <p className="text-3xl font-bold text-orange-900">{recentActivity}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Learning Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Completion</span>
              <span className="text-sm text-gray-600">{completedAssignments}/{totalAssignments} assignments</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900">{highScores}</p>
              <p className="text-sm text-green-600">High Scores (90%+)</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-900">{Object.keys(subjectStats).length}</p>
              <p className="text-sm text-blue-600">Subjects Studied</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-900">{calculateAchievements(performances)}</p>
              <p className="text-sm text-purple-600">Achievements Earned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Performance Breakdown */}
      {Object.keys(subjectStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(subjectStats).map(([subject, stats]) => {
                const avgScore = stats.scores.length > 0 
                  ? Math.round(stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length)
                  : 0;
                
                return (
                  <div key={subject} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <div>
                        <p className="font-medium capitalize">{subject.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600">{stats.total} assignments</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={avgScore >= 80 ? 'default' : avgScore >= 60 ? 'secondary' : 'destructive'}>
                        {avgScore}% avg
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Improvement Trend</span>
              </div>
              <p className="text-sm text-blue-700">
                {getImprovementTrend(performances)}
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Next Goal</span>
              </div>
              <p className="text-sm text-green-700">
                {getNextGoal(averageScore, currentStreak)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions
function calculateStreak(performances: PerformanceRecord[]): number {
  const sortedPerformances = performances
    .filter(p => p.score !== undefined)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  let streak = 0;
  for (const performance of sortedPerformances) {
    if ((performance.score || 0) >= 70) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function calculateAchievements(performances: PerformanceRecord[]): number {
  let achievements = 0;
  const scores = performances.filter(p => p.score !== undefined).map(p => p.score || 0);
  
  if (scores.length >= 5) achievements++; // First 5 assignments
  if (scores.length >= 10) achievements++; // 10 assignments milestone
  if (scores.some(score => score >= 95)) achievements++; // Perfect score
  if (scores.filter(score => score >= 90).length >= 3) achievements++; // 3 high scores
  if (calculateStreak(performances) >= 5) achievements++; // 5-assignment streak
  
  return achievements;
}

function getImprovementTrend(performances: PerformanceRecord[]): string {
  const recentScores = performances
    .filter(p => p.score !== undefined)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(p => p.score || 0);
  
  if (recentScores.length < 2) return "Complete more assignments to see trends";
  
  const recent = recentScores.slice(0, 3).reduce((sum, score) => sum + score, 0) / Math.min(3, recentScores.length);
  const earlier = recentScores.slice(-3).reduce((sum, score) => sum + score, 0) / Math.min(3, recentScores.slice(-3).length);
  
  if (recent > earlier + 5) return "Great improvement! You're on an upward trend 📈";
  if (recent < earlier - 5) return "Consider reviewing recent topics to improve";
  return "Maintaining steady performance - keep it up!";
}

function getNextGoal(averageScore: number, streak: number): string {
  if (averageScore < 70) return "Aim to reach 70% average score";
  if (averageScore < 80) return "Work towards 80% average score";
  if (streak < 3) return "Try to maintain a 3-assignment streak";
  if (averageScore < 90) return "Challenge yourself to reach 90% average";
  return "Excellent work! Maintain your high standards";
}