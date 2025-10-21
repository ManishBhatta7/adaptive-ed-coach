import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame, Trophy, Zap, TrendingUp } from 'lucide-react';
import { DailyStreak } from '@/services/GamificationService';

interface StreakCounterProps {
  streak: DailyStreak;
  compact?: boolean;
  showLongest?: boolean;
  animated?: boolean;
  className?: string;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  streak,
  compact = false,
  showLongest = true,
  animated = true,
  className = '',
}) => {
  const getStreakColor = (current: number) => {
    if (current >= 30) return 'from-orange-500 via-red-500 to-orange-500';
    if (current >= 14) return 'from-orange-400 via-yellow-500 to-orange-400';
    if (current >= 7) return 'from-yellow-400 via-orange-400 to-yellow-400';
    if (current >= 3) return 'from-yellow-300 via-yellow-400 to-yellow-300';
    return 'from-gray-400 via-gray-500 to-gray-400';
  };

  const getStreakIntensity = (current: number) => {
    if (current >= 30) return 3;
    if (current >= 14) return 2.5;
    if (current >= 7) return 2;
    if (current >= 3) return 1.5;
    return 1;
  };

  const getStreakMessage = (current: number) => {
    if (current >= 30) return "You're on fire! Legendary! 🔥";
    if (current >= 14) return 'Two weeks strong! Amazing!';
    if (current >= 7) return 'One week streak! Keep it up!';
    if (current >= 3) return 'Building momentum!';
    return 'Start your streak today!';
  };

  const flameIntensity = getStreakIntensity(streak.current);
  const streakColor = getStreakColor(streak.current);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <motion.div
              className={`inline-flex items-center gap-2 ${className}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={
                  animated && streak.current > 0
                    ? {
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
              >
                <Flame
                  className={`h-5 w-5 ${
                    streak.current >= 7 ? 'text-orange-500' : 'text-gray-400'
                  }`}
                />
              </motion.div>
              <span className="font-bold text-lg">{streak.current}</span>
              <span className="text-sm text-gray-600">day streak</span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">{getStreakMessage(streak.current)}</p>
              <p className="text-sm">Longest: {streak.longest} days</p>
              {streak.streakBonus > 0 && (
                <p className="text-sm text-yellow-600">
                  +{streak.streakBonus} XP bonus today!
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={
                  animated && streak.current > 0
                    ? {
                        scale: [1, flameIntensity, 1],
                        rotate: [0, 15, -15, 0],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
              >
                <Flame className={`h-6 w-6 ${streak.current >= 3 ? 'text-orange-500' : 'text-gray-400'}`} />
              </motion.div>
              <h3 className="font-semibold text-lg">Daily Streak</h3>
            </div>
            {streak.current >= 7 && (
              <Badge className={`bg-gradient-to-r ${streakColor} text-white animate-pulse`}>
                {streak.current >= 30 ? '🏆 Legendary' : streak.current >= 14 ? '⭐ Epic' : '🔥 Hot'}
              </Badge>
            )}
          </div>

          {/* Main Streak Display */}
          <div className="relative">
            <motion.div
              className={`bg-gradient-to-r ${streakColor} rounded-2xl p-8 text-center relative overflow-hidden`}
              animate={
                animated && streak.current >= 7
                  ? {
                      boxShadow: [
                        '0 0 20px rgba(251, 146, 60, 0.3)',
                        '0 0 40px rgba(251, 146, 60, 0.5)',
                        '0 0 20px rgba(251, 146, 60, 0.3)',
                      ],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop',
              }}
            >
              {/* Animated background particles */}
              {animated && streak.current >= 7 && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full opacity-60"
                      animate={{
                        y: [0, -100],
                        x: [0, (i - 2) * 20],
                        opacity: [0.6, 0],
                        scale: [1, 0],
                      }}
                      transition={{
                        duration: 2 + i * 0.2,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                      style={{
                        left: `${20 + i * 15}%`,
                        bottom: 0,
                      }}
                    />
                  ))}
                </>
              )}

              <motion.div
                animate={animated ? { scale: [1, 1.05, 1] } : {}}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
              >
                <div className="text-6xl font-bold text-white drop-shadow-lg">
                  {streak.current}
                </div>
                <div className="text-xl text-white/90 mt-2">
                  {streak.current === 1 ? 'Day' : 'Days'}
                </div>
              </motion.div>
            </motion.div>

            {/* Streak message */}
            <div className="text-center mt-3">
              <p className="text-sm font-medium text-gray-700">
                {getStreakMessage(streak.current)}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {showLongest && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs font-medium">Longest</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{streak.longest}</div>
                <div className="text-xs text-gray-500">days</div>
              </div>
            )}
            
            {streak.streakBonus > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs font-medium">Bonus</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">+{streak.streakBonus}</div>
                <div className="text-xs text-gray-500">XP today</div>
              </div>
            )}

            {streak.current > 0 && (
              <div className="text-center col-span-2">
                <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium">Multiplier</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {streak.current >= 30
                    ? '2.0x'
                    : streak.current >= 14
                    ? '1.5x'
                    : streak.current >= 7
                    ? '1.25x'
                    : streak.current >= 3
                    ? '1.1x'
                    : '1.0x'}
                </div>
                <div className="text-xs text-gray-500">XP boost</div>
              </div>
            )}
          </div>

          {/* Warning if streak at risk */}
          {streak.current > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 text-center">
                💡 Study today to maintain your streak!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakCounter;
