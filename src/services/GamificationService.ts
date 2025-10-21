import { StudentProfile } from '@/types';

export interface XPEvent {
  type: 'submission' | 'streak' | 'achievement' | 'perfect_score' | 'improvement' | 'daily_goal' | 'quiz_complete';
  points: number;
  multiplier?: number;
  description: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'social' | 'consistency' | 'mastery' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  unlockedAt?: Date;
  progress?: number;
  total?: number;
}

export interface DailyStreak {
  current: number;
  longest: number;
  lastActivity: Date;
  streakBonus: number;
}

export interface UserLevel {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  title: string;
  perks: string[];
}

export class GamificationService {
  private static readonly XP_MULTIPLIERS = {
    STREAK_3: 1.1,
    STREAK_7: 1.25,
    STREAK_14: 1.5,
    STREAK_30: 2.0,
    PERFECT_SCORE: 2.0,
    IMPROVEMENT: 1.5,
  };

  private static readonly BASE_XP_VALUES = {
    submission: 50,
    streak: 10,
    achievement: 100,
    perfect_score: 200,
    improvement: 75,
    daily_goal: 30,
    quiz_complete: 40,
  };

  private static readonly LEVEL_TITLES = [
    'Beginner',
    'Learner',
    'Student',
    'Scholar',
    'Expert',
    'Master',
    'Sage',
    'Genius',
    'Legend',
    'Champion',
  ];

  /**
   * Calculate XP required for a specific level
   */
  static calculateXPForLevel(level: number): number {
    // Exponential growth: 100 * (1.5 ^ level)
    return Math.floor(100 * Math.pow(1.5, level));
  }

  /**
   * Calculate user's current level from total XP
   */
  static calculateLevel(totalXP: number): UserLevel {
    let level = 0;
    let xpForCurrentLevel = 0;
    let xpForNextLevel = this.calculateXPForLevel(1);

    while (totalXP >= xpForNextLevel) {
      level++;
      xpForCurrentLevel = xpForNextLevel;
      xpForNextLevel = this.calculateXPForLevel(level + 1);
    }

    const currentXP = totalXP - xpForCurrentLevel;
    const xpToNextLevel = xpForNextLevel - xpForCurrentLevel;

    return {
      level,
      currentXP,
      xpToNextLevel,
      title: this.LEVEL_TITLES[Math.min(level, this.LEVEL_TITLES.length - 1)],
      perks: this.getPerksForLevel(level),
    };
  }

  /**
   * Get perks unlocked at a specific level
   */
  private static getPerksForLevel(level: number): string[] {
    const perks: string[] = [];
    
    if (level >= 2) perks.push('Custom avatar');
    if (level >= 5) perks.push('Priority AI responses');
    if (level >= 10) perks.push('Advanced analytics');
    if (level >= 15) perks.push('Exclusive badges');
    if (level >= 20) perks.push('Mentor status');
    if (level >= 30) perks.push('Legendary tier');

    return perks;
  }

  /**
   * Award XP for an event
   */
  static awardXP(event: XPEvent['type'], streak?: DailyStreak, metadata?: any): XPEvent {
    let basePoints = this.BASE_XP_VALUES[event];
    let multiplier = 1;

    // Apply streak multipliers
    if (streak) {
      if (streak.current >= 30) multiplier = this.XP_MULTIPLIERS.STREAK_30;
      else if (streak.current >= 14) multiplier = this.XP_MULTIPLIERS.STREAK_14;
      else if (streak.current >= 7) multiplier = this.XP_MULTIPLIERS.STREAK_7;
      else if (streak.current >= 3) multiplier = this.XP_MULTIPLIERS.STREAK_3;
    }

    // Apply special multipliers
    if (metadata?.isPerfectScore) {
      multiplier *= this.XP_MULTIPLIERS.PERFECT_SCORE;
    }
    if (metadata?.isImprovement) {
      multiplier *= this.XP_MULTIPLIERS.IMPROVEMENT;
    }

    const points = Math.floor(basePoints * multiplier);

    return {
      type: event,
      points,
      multiplier: multiplier > 1 ? multiplier : undefined,
      description: this.getXPDescription(event, points, multiplier),
    };
  }

  /**
   * Generate description for XP event
   */
  private static getXPDescription(type: XPEvent['type'], points: number, multiplier: number): string {
    const baseDescriptions: Record<XPEvent['type'], string> = {
      submission: 'Assignment submitted',
      streak: 'Daily streak continued',
      achievement: 'Achievement unlocked',
      perfect_score: 'Perfect score achieved',
      improvement: 'Significant improvement',
      daily_goal: 'Daily goal completed',
      quiz_complete: 'Quiz completed',
    };

    let description = baseDescriptions[type];
    if (multiplier > 1) {
      description += ` (${multiplier}x bonus!)`;
    }

    return description;
  }

  /**
   * Update daily streak
   */
  static updateStreak(lastActivity: Date, currentStreak: number): DailyStreak {
    const now = new Date();
    const lastActivityDate = new Date(lastActivity);
    const daysDiff = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

    let current = currentStreak;
    let streakBonus = 0;

    if (daysDiff === 0) {
      // Same day activity
      current = currentStreak;
    } else if (daysDiff === 1) {
      // Consecutive day
      current = currentStreak + 1;
      streakBonus = this.BASE_XP_VALUES.streak * current;
    } else {
      // Streak broken
      current = 1;
    }

    return {
      current,
      longest: Math.max(current, currentStreak),
      lastActivity: now,
      streakBonus,
    };
  }

  /**
   * Check if user has earned new achievements
   */
  static checkAchievements(profile: StudentProfile, event?: string): Achievement[] {
    const newAchievements: Achievement[] = [];
    const performances = profile.performances || [];
    const submissions = performances.length;

    // Submission milestones
    if (submissions === 1) {
      newAchievements.push({
        id: 'first_submission',
        title: 'First Steps',
        description: 'Submitted your first assignment',
        icon: '🎯',
        category: 'learning',
        rarity: 'common',
        xpReward: 100,
      });
    }
    if (submissions === 10) {
      newAchievements.push({
        id: 'dedicated_learner',
        title: 'Dedicated Learner',
        description: 'Completed 10 assignments',
        icon: '📚',
        category: 'learning',
        rarity: 'rare',
        xpReward: 500,
      });
    }
    if (submissions === 50) {
      newAchievements.push({
        id: 'academic_warrior',
        title: 'Academic Warrior',
        description: 'Completed 50 assignments',
        icon: '⚔️',
        category: 'learning',
        rarity: 'epic',
        xpReward: 2000,
      });
    }
    if (submissions === 100) {
      newAchievements.push({
        id: 'century_scholar',
        title: 'Century Scholar',
        description: 'Reached 100 assignments',
        icon: '💯',
        category: 'mastery',
        rarity: 'legendary',
        xpReward: 5000,
      });
    }

    // Perfect scores
    const perfectScores = performances.filter(p => p.score === 100).length;
    if (perfectScores === 1) {
      newAchievements.push({
        id: 'perfectionist',
        title: 'Perfectionist',
        description: 'Achieved a perfect score',
        icon: '⭐',
        category: 'mastery',
        rarity: 'rare',
        xpReward: 300,
      });
    }
    if (perfectScores === 10) {
      newAchievements.push({
        id: 'flawless_master',
        title: 'Flawless Master',
        description: '10 perfect scores achieved',
        icon: '🌟',
        category: 'mastery',
        rarity: 'epic',
        xpReward: 1500,
      });
    }

    // Consistency achievements
    if (event === 'streak_7') {
      newAchievements.push({
        id: 'week_warrior',
        title: 'Week Warrior',
        description: '7-day study streak',
        icon: '🔥',
        category: 'consistency',
        rarity: 'rare',
        xpReward: 400,
      });
    }
    if (event === 'streak_30') {
      newAchievements.push({
        id: 'month_master',
        title: 'Month Master',
        description: '30-day study streak',
        icon: '🚀',
        category: 'consistency',
        rarity: 'legendary',
        xpReward: 3000,
      });
    }

    // Improvement achievements
    const recentScores = performances.slice(-5).filter(p => p.score).map(p => p.score!);
    const earlierScores = performances.slice(0, 5).filter(p => p.score).map(p => p.score!);
    if (recentScores.length >= 3 && earlierScores.length >= 3) {
      const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
      const earlierAvg = earlierScores.reduce((sum, s) => sum + s, 0) / earlierScores.length;
      const improvement = recentAvg - earlierAvg;

      if (improvement >= 20) {
        newAchievements.push({
          id: 'rising_star',
          title: 'Rising Star',
          description: 'Improved by 20+ points',
          icon: '📈',
          category: 'learning',
          rarity: 'epic',
          xpReward: 800,
        });
      }
    }

    return newAchievements;
  }

  /**
   * Get all possible achievements
   */
  static getAllAchievements(): Achievement[] {
    return [
      // Learning achievements
      { id: 'first_submission', title: 'First Steps', description: 'Submit your first assignment', icon: '🎯', category: 'learning', rarity: 'common', xpReward: 100, progress: 0, total: 1 },
      { id: 'dedicated_learner', title: 'Dedicated Learner', description: 'Complete 10 assignments', icon: '📚', category: 'learning', rarity: 'rare', xpReward: 500, progress: 0, total: 10 },
      { id: 'academic_warrior', title: 'Academic Warrior', description: 'Complete 50 assignments', icon: '⚔️', category: 'learning', rarity: 'epic', xpReward: 2000, progress: 0, total: 50 },
      { id: 'century_scholar', title: 'Century Scholar', description: 'Reach 100 assignments', icon: '💯', category: 'mastery', rarity: 'legendary', xpReward: 5000, progress: 0, total: 100 },
      
      // Mastery achievements
      { id: 'perfectionist', title: 'Perfectionist', description: 'Achieve a perfect score', icon: '⭐', category: 'mastery', rarity: 'rare', xpReward: 300, progress: 0, total: 1 },
      { id: 'flawless_master', title: 'Flawless Master', description: 'Get 10 perfect scores', icon: '🌟', category: 'mastery', rarity: 'epic', xpReward: 1500, progress: 0, total: 10 },
      { id: 'subject_expert', title: 'Subject Expert', description: 'Master a subject (avg 90+)', icon: '🎓', category: 'mastery', rarity: 'epic', xpReward: 1000, progress: 0, total: 1 },
      
      // Consistency achievements
      { id: 'week_warrior', title: 'Week Warrior', description: 'Maintain 7-day streak', icon: '🔥', category: 'consistency', rarity: 'rare', xpReward: 400, progress: 0, total: 7 },
      { id: 'month_master', title: 'Month Master', description: 'Maintain 30-day streak', icon: '🚀', category: 'consistency', rarity: 'legendary', xpReward: 3000, progress: 0, total: 30 },
      { id: 'early_bird', title: 'Early Bird', description: 'Study before 8 AM', icon: '🌅', category: 'consistency', rarity: 'common', xpReward: 150, progress: 0, total: 1 },
      { id: 'night_owl', title: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', category: 'consistency', rarity: 'common', xpReward: 150, progress: 0, total: 1 },
      
      // Special achievements
      { id: 'speed_demon', title: 'Speed Demon', description: 'Complete quiz in under 5 min', icon: '⚡', category: 'special', rarity: 'rare', xpReward: 350, progress: 0, total: 1 },
      { id: 'rising_star', title: 'Rising Star', description: 'Improve by 20+ points', icon: '📈', category: 'learning', rarity: 'epic', xpReward: 800, progress: 0, total: 1 },
      { id: 'comeback_kid', title: 'Comeback Kid', description: 'Bounce back from low score', icon: '💪', category: 'special', rarity: 'rare', xpReward: 600, progress: 0, total: 1 },
      { id: 'helping_hand', title: 'Helping Hand', description: 'Help 5 classmates', icon: '🤝', category: 'social', rarity: 'epic', xpReward: 1200, progress: 0, total: 5 },
      { id: 'team_player', title: 'Team Player', description: 'Join a study group', icon: '👥', category: 'social', rarity: 'common', xpReward: 200, progress: 0, total: 1 },
    ];
  }

  /**
   * Calculate daily goal progress
   */
  static calculateDailyGoal(todaysActivities: number, goalTarget: number = 3): {
    progress: number;
    completed: boolean;
    remaining: number;
  } {
    const progress = Math.min(100, (todaysActivities / goalTarget) * 100);
    return {
      progress,
      completed: todaysActivities >= goalTarget,
      remaining: Math.max(0, goalTarget - todaysActivities),
    };
  }

  /**
   * Get motivational message based on progress
   */
  static getMotivationalMessage(level: UserLevel, streak: DailyStreak, achievements: Achievement[]): string {
    const messages = [
      `You're on fire! 🔥 ${streak.current}-day streak going strong!`,
      `Level ${level.level} ${level.title}! Keep climbing!`,
      `${achievements.length} achievements unlocked! Amazing!`,
      `You're in the top percentile! Keep it up!`,
      `Your dedication is inspiring! 💪`,
      `Consistency is key - and you've got it!`,
      `Every submission brings you closer to mastery!`,
      `Your progress is remarkable! Keep pushing!`,
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }
}

export default GamificationService;
