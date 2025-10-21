import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMetacognition } from '@/hooks/useMetacognition';
import { ReflectionCard } from './ReflectionCard';
import { 
  Brain, 
  Trophy, 
  TrendingUp, 
  BookOpen,
  Target,
  Calendar,
  Award,
  Loader2
} from 'lucide-react';

interface StudentMetacogViewProps {
  showReflectionForm?: boolean;
}

const STRATEGY_COLORS = {
  'Visualize': 'bg-purple-100 text-purple-800',
  'Formula': 'bg-blue-100 text-blue-800',
  'Example': 'bg-green-100 text-green-800',
  'Trial-and-error': 'bg-orange-100 text-orange-800',
  'Break-down': 'bg-pink-100 text-pink-800',
  'Other': 'bg-gray-100 text-gray-800'
};

export const StudentMetacogView: React.FC<StudentMetacogViewProps> = ({ 
  showReflectionForm = true 
}) => {
  const { stats, loading, error } = useMetacognition();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading your metacognition data...
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading metacognition data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start Your Metacognition Journey</h3>
            <p className="text-gray-600 mb-4">
              Begin reflecting on your problem-solving strategies to become a better learner!
            </p>
          </CardContent>
        </Card>
        
        {showReflectionForm && <ReflectionCard />}
      </div>
    );
  }

  const progressPercentage = Math.min((stats.metacog_score / 10) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metacognition Score */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.metacog_score.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Metacog Score</p>
              </div>
            </div>
            <Progress value={progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        {/* Total Reflections */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_reflections}</p>
                <p className="text-sm text-gray-600">Reflections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.summary.avg_teacher_rating?.toFixed(1) || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges Earned */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.badges.length}</p>
                <p className="text-sm text-gray-600">Badges</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges Section */}
      {stats.badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Your Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.badges.map(badge => (
                <div key={badge.id} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border">
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                  {badge.earned_at && (
                    <p className="text-xs text-gray-500">
                      Earned {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategy Usage */}
      {Object.keys(stats.summary.strategies_used).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Your Strategy Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(stats.summary.strategies_used).map(([strategy, count]) => (
                <div key={strategy} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Badge className={STRATEGY_COLORS[strategy as keyof typeof STRATEGY_COLORS] || 'bg-gray-100'}>
                    {strategy}
                  </Badge>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Try using different strategies to earn the "Strategy Master" badge!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Reflections */}
      {stats.recent_reflections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Reflections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recent_reflections.slice(0, 3).map(reflection => (
                <div key={reflection.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{reflection.subject_area}</Badge>
                      <Badge className={STRATEGY_COLORS[reflection.strategy_used]}>
                        {reflection.strategy_used}
                      </Badge>
                    </div>
                    {reflection.teacher_rating !== null && (
                      <Badge variant="secondary">
                        {reflection.teacher_rating}/2 ⭐
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm mb-2 font-medium">{reflection.problem_description}</p>
                  <p className="text-sm text-gray-600">{reflection.reflection_text}</p>
                  {reflection.ai_feedback && (
                    <div className="mt-3 p-3 bg-purple-50 rounded border-l-4 border-purple-200">
                      <p className="text-sm text-purple-800">
                        <strong>AI Feedback:</strong> {reflection.ai_feedback}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(reflection.created_at || '').toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reflection Form */}
      {showReflectionForm && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Add New Reflection
          </h2>
          <ReflectionCard />
        </div>
      )}
    </div>
  );
};