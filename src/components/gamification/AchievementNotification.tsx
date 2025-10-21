import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Achievement } from '@/services/GamificationService';
import { X, Sparkles } from 'lucide-react';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
  autoClose?: boolean;
  closeDelay?: number;
}

const rarityColors = {
  common: {
    bg: 'from-gray-400 to-gray-600',
    text: 'text-gray-100',
    glow: '0 0 20px rgba(156, 163, 175, 0.5)',
  },
  rare: {
    bg: 'from-blue-400 to-blue-600',
    text: 'text-blue-100',
    glow: '0 0 30px rgba(59, 130, 246, 0.6)',
  },
  epic: {
    bg: 'from-purple-400 to-purple-600',
    text: 'text-purple-100',
    glow: '0 0 40px rgba(168, 85, 247, 0.7)',
  },
  legendary: {
    bg: 'from-yellow-400 via-orange-500 to-red-600',
    text: 'text-yellow-100',
    glow: '0 0 50px rgba(251, 191, 36, 0.8)',
  },
};

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose,
  autoClose = true,
  closeDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      
      // Trigger confetti based on rarity
      const confettiConfig = {
        particleCount: achievement.rarity === 'legendary' ? 200 : 
                       achievement.rarity === 'epic' ? 150 :
                       achievement.rarity === 'rare' ? 100 : 50,
        spread: achievement.rarity === 'legendary' ? 180 : 120,
        origin: { y: 0.6 },
        colors: achievement.rarity === 'legendary' 
          ? ['#FFD700', '#FFA500', '#FF6347']
          : achievement.rarity === 'epic'
          ? ['#A855F7', '#EC4899', '#8B5CF6']
          : achievement.rarity === 'rare'
          ? ['#3B82F6', '#60A5FA', '#93C5FD']
          : ['#9CA3AF', '#D1D5DB'],
      };

      confetti(confettiConfig);

      // Extra celebration for legendary
      if (achievement.rarity === 'legendary') {
        setTimeout(() => confetti(confettiConfig), 300);
        setTimeout(() => confetti(confettiConfig), 600);
      }

      // Auto close
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 500);
        }, closeDelay);

        return () => clearTimeout(timer);
      }
    }
  }, [achievement, autoClose, closeDelay, onClose]);

  if (!achievement) return null;

  const colors = rarityColors[achievement.rarity];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 500);
          }}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{
                boxShadow: [colors.glow, `${colors.glow}, ${colors.glow}`, colors.glow],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />

            <div className={`relative bg-gradient-to-br ${colors.bg} rounded-2xl p-8 text-center shadow-2xl overflow-hidden`}>
              {/* Animated background sparkles */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{
                    x: Math.random() * 100 - 50,
                    y: Math.random() * 100 - 50,
                    opacity: 0,
                  }}
                  animate={{
                    x: Math.random() * 400 - 200,
                    y: Math.random() * 400 - 200,
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}

              {/* Close button */}
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 500);
                }}
                className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>

              {/* Content */}
              <div className="relative z-10 space-y-4">
                {/* Icon */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                  className="inline-block"
                >
                  <div className="text-7xl drop-shadow-lg">
                    {achievement.icon}
                  </div>
                </motion.div>

                {/* Rarity badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm ${colors.text}`}>
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold uppercase text-sm tracking-wider">
                      {achievement.rarity}
                    </span>
                    <Sparkles className="h-4 w-4" />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                    {achievement.title}
                  </h2>
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <p className="text-lg text-white/90">
                    {achievement.description}
                  </p>
                </motion.div>

                {/* XP Reward */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9, type: 'spring' }}
                >
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border-2 border-white/30">
                    <span className="text-2xl">⚡</span>
                    <span className="text-2xl font-bold text-white">
                      +{achievement.xpReward} XP
                    </span>
                  </div>
                </motion.div>

                {/* Celebration text */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  <p className="text-sm text-white/70 mt-4">
                    Achievement Unlocked! 🎉
                  </p>
                </motion.div>
              </div>

              {/* Animated rays */}
              {achievement.rarity === 'legendary' && (
                <>
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-1 h-32 bg-white/30 origin-top"
                      style={{
                        transform: `rotate(${i * 30}deg) translateY(-50%)`,
                      }}
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scaleY: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementNotification;
