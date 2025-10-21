import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Target, Zap, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyGoal {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  xpReward: number;
  icon: string;
}

interface DailyGoalsWidgetProps {
  goals: DailyGoal[];
  onGoalComplete?: (goalId: string) => void;
  className?: string;
}

export const DailyGoalsWidget: React.FC<DailyGoalsWidgetProps> = ({
  goals,
  onGoalComplete,
  className = '',
}) => {
  const completedGoals = goals.filter(g => g.completed).length;
  const totalGoals = goals.length;
  const progress = (completedGoals / totalGoals) * 100;
  const allCompleted = completedGoals === totalGoals;

  const handleGoalClick = (goal: DailyGoal) => {
    if (!goal.completed && onGoalComplete) {
      onGoalComplete(goal.id);
      
      // Celebration animation
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  // Trigger bigger celebration when all goals completed
  React.useEffect(() => {
    if (allCompleted && totalGoals > 0) {
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 180,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        });
      }, 300);
    }
  }, [allCompleted, totalGoals]);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Daily Goals</CardTitle>
          </div>
          <Badge variant={allCompleted ? "default" : "outline"} className={allCompleted ? "bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse" : ""}>
            {completedGoals}/{totalGoals}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Today's Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {allCompleted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-sm font-medium text-green-600 flex items-center justify-center gap-1">
                <Sparkles className="h-4 w-4" />
                All goals completed! Amazing! 🎉
              </p>
            </motion.div>
          )}
        </div>

        {/* Goals List */}
        <div className="space-y-2">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleGoalClick(goal)}
              className={`
                flex items-start gap-3 p-3 rounded-lg border transition-all
                ${goal.completed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200 hover:border-blue-300 cursor-pointer hover:shadow-sm'
                }
              `}
            >
              {/* Icon/Checkbox */}
              <div className="flex-shrink-0 mt-0.5">
                {goal.completed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </motion.div>
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${goal.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {goal.icon} {goal.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {goal.description}
                    </p>
                  </div>
                  {!goal.completed && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full whitespace-nowrap">
                      <Zap className="h-3 w-3" />
                      +{goal.xpReward}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Total XP Available */}
        {!allCompleted && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Available XP Today</span>
              <div className="flex items-center gap-1 font-semibold text-yellow-600">
                <Zap className="h-4 w-4" />
                {goals.filter(g => !g.completed).reduce((sum, g) => sum + g.xpReward, 0)} XP
              </div>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-4 text-center text-white"
          >
            <p className="font-semibold">Daily Goals Completed! 🎯</p>
            <p className="text-sm opacity-90 mt-1">
              Come back tomorrow for new challenges!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyGoalsWidget;
