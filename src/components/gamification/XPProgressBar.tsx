import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';
import { UserLevel } from '@/services/GamificationService';

interface XPProgressBarProps {
  level: UserLevel;
  showDetails?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onLevelUp?: () => void;
  className?: string;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  level,
  showDetails = true,
  animated = true,
  size = 'md',
  onLevelUp,
  className = '',
}) => {
  const [prevLevel, setPrevLevel] = useState(level.level);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const progress = (level.currentXP / level.xpToNextLevel) * 100;

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  useEffect(() => {
    if (level.level > prevLevel) {
      setShowLevelUp(true);
      onLevelUp?.();
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    setPrevLevel(level.level);
  }, [level.level, prevLevel, onLevelUp]);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Level Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            initial={animated ? { scale: 0.9 } : undefined}
            animate={animated ? { scale: 1 } : undefined}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
              <Zap className="h-3 w-3 mr-1" />
              Level {level.level}
            </Badge>
          </motion.div>
          <span className="text-sm font-medium text-gray-700">{level.title}</span>
        </div>

        {showDetails && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-xs text-gray-600 hover:text-gray-900 cursor-help flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {level.currentXP} / {level.xpToNextLevel} XP
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-semibold">Progress to Level {level.level + 1}</p>
                  <p className="text-sm text-gray-600">
                    {level.xpToNextLevel - level.currentXP} XP needed
                  </p>
                  {level.perks.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium mb-1">Unlocked Perks:</p>
                      <ul className="text-xs space-y-0.5">
                        {level.perks.map((perk, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5 text-yellow-500" />
                            {perk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* XP Progress Bar */}
      <div className="relative">
        <Progress value={progress} className={sizeClasses[size]} />
        
        {/* Animated glow effect */}
        {animated && progress > 0 && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 0px rgba(168, 85, 247, 0)',
                '0 0 10px rgba(168, 85, 247, 0.4)',
                '0 0 0px rgba(168, 85, 247, 0)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'loop',
            }}
          />
        )}
      </div>

      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white px-8 py-6 rounded-2xl shadow-2xl"
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: 3,
              }}
            >
              <div className="text-center space-y-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block"
                >
                  <Sparkles className="h-12 w-12 mx-auto" />
                </motion.div>
                <div className="text-3xl font-bold">LEVEL UP!</div>
                <div className="text-xl">Level {level.level} - {level.title}</div>
                {level.perks.length > 0 && level.perks[level.perks.length - 1] && (
                  <div className="text-sm opacity-90">
                    🎁 Unlocked: {level.perks[level.perks.length - 1]}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default XPProgressBar;
