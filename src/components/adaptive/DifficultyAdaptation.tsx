import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Target, Zap, ChevronUp, ChevronDown, Minus, Info, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentProfile } from '@/types';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface DifficultyMetrics {
  currentLevel: DifficultyLevel;
  readinessScore: number;
  recommendedLevel: DifficultyLevel;
  trend: 'increasing' | 'stable' | 'decreasing';
  subjectLevels: Record<string, DifficultyLevel>;
}

interface DifficultyAdaptationProps {
  studentProfile: StudentProfile;
  subject?: string;
  onLevelChange?: (newLevel: DifficultyLevel) => void;
  className?: string;
}

export const DifficultyAdaptation: React.FC<DifficultyAdaptationProps> = ({
  studentProfile,
  subject,
  onLevelChange,
  className = '',
}) => {
  const [metrics, setMetrics] = useState<DifficultyMetrics | null>(null);
  const [showLevelChange, setShowLevelChange] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateDifficultyMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentProfile, subject]);

  const calculateDifficultyMetrics = () => {
    setLoading(true);
    const performances = studentProfile.performances || [];

    if (performances.length < 3) {
      setMetrics({
        currentLevel: 'beginner',
        readinessScore: 0,
        recommendedLevel: 'beginner',
        trend: 'stable',
        subjectLevels: {}
      });
      setLoading(false);
      return;
    }

    // Filter by subject if specified
    const relevantPerformances = subject
      ? performances.filter(p => p.subjectArea === subject)
      : performances;

    // Calculate current performance metrics
    const recentPerformances = relevantPerformances.slice(-5);
    const scores = recentPerformances.filter(p => p.score !== undefined).map(p => p.score!);
    
    if (scores.length === 0) {
      setLoading(false);
      return;
    }

    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const consistency = calculateConsistency(scores);
    
    // Determine current level based on average score
    const currentLevel = determineLevelFromScore(avgScore);
    
    // Calculate readiness for next level
    const readinessScore = calculateReadinessScore(avgScore, consistency, scores);
    
    // Recommend level based on readiness
    const recommendedLevel = determineRecommendedLevel(currentLevel, readinessScore, avgScore);
    
    // Calculate trend
    const trend = calculateTrend(relevantPerformances);

    // Calculate subject-specific levels
    const subjectLevels = calculateSubjectLevels(performances);

    setMetrics({
      currentLevel,
      readinessScore,
      recommendedLevel,
      trend,
      subjectLevels
    });

    // Show level change notification if recommended level differs
    if (currentLevel !== recommendedLevel) {
      setShowLevelChange(true);
    }

    setLoading(false);
  };

  const determineLevelFromScore = (avgScore: number): DifficultyLevel => {
    if (avgScore >= 90) return 'expert';
    if (avgScore >= 80) return 'advanced';
    if (avgScore >= 70) return 'intermediate';
    return 'beginner';
  };

  const calculateConsistency = (scores: number[]): number => {
    if (scores.length < 2) return 100;
    
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 100 - (stdDev * 2));
  };

  const calculateReadinessScore = (avgScore: number, consistency: number, scores: number[]): number => {
    // Readiness based on performance, consistency, and improvement
    const performanceScore = Math.min(100, avgScore);
    const consistencyScore = consistency;
    
    // Check for improvement trend
    const recent = scores.slice(-3);
    const earlier = scores.slice(0, 3);
    const recentAvg = recent.reduce((sum, s) => sum + s, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, s) => sum + s, 0) / earlier.length;
    const improvementScore = Math.max(0, Math.min(100, ((recentAvg - earlierAvg) + 50)));
    
    // Weighted average
    return (performanceScore * 0.5 + consistencyScore * 0.3 + improvementScore * 0.2);
  };

  const determineRecommendedLevel = (
    currentLevel: DifficultyLevel, 
    readinessScore: number, 
    avgScore: number
  ): DifficultyLevel => {
    const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(currentLevel);

    // Ready to level up if readiness > 85 and avgScore > 85
    if (readinessScore >= 85 && avgScore >= 85 && currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    
    // Should level down if struggling (avgScore < 65 and consistency low)
    if (avgScore < 65 && readinessScore < 50 && currentIndex > 0) {
      return levels[currentIndex - 1];
    }

    return currentLevel;
  };

  const calculateTrend = (performances: PerformanceRecord[]): 'increasing' | 'stable' | 'decreasing' => {
    const scores = performances.filter(p => p.score !== undefined).map(p => p.score!);
    if (scores.length < 4) return 'stable';

    const recent = scores.slice(-3);
    const earlier = scores.slice(0, -3).slice(-3);
    
    const recentAvg = recent.reduce((sum, s) => sum + s, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, s) => sum + s, 0) / earlier.length;

    const diff = recentAvg - earlierAvg;
    
    if (diff > 5) return 'increasing';
    if (diff < -5) return 'decreasing';
    return 'stable';
  };

  const calculateSubjectLevels = (performances: PerformanceRecord[]): Record<string, DifficultyLevel> => {
    const subjectScores: Record<string, number[]> = {};
    
    performances.forEach(p => {
      if (p.subjectArea && p.score !== undefined) {
        if (!subjectScores[p.subjectArea]) {
          subjectScores[p.subjectArea] = [];
        }
        subjectScores[p.subjectArea].push(p.score);
      }
    });

    const levels: Record<string, DifficultyLevel> = {};
    Object.entries(subjectScores).forEach(([subj, scores]) => {
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      levels[subj] = determineLevelFromScore(avg);
    });

    return levels;
  };

  const getLevelColor = (level: DifficultyLevel): string => {
    switch (level) {
      case 'beginner': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'intermediate': return 'bg-green-100 text-green-700 border-green-300';
      case 'advanced': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'expert': return 'bg-purple-100 text-purple-700 border-purple-300';
    }
  };

  const getLevelIcon = (level: DifficultyLevel) => {
    switch (level) {
      case 'beginner': return <ChevronDown className="h-4 w-4" />;
      case 'intermediate': return <Minus className="h-4 w-4" />;
      case 'advanced': return <ChevronUp className="h-4 w-4" />;
      case 'expert': return <Sparkles className="h-4 w-4" />;
    }
  };

  const getTrendIcon = () => {
    if (!metrics) return null;
    switch (metrics.trend) {
      case 'increasing': return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'decreasing': return <TrendingDown className="h-5 w-5 text-red-600" />;
      default: return <Target className="h-5 w-5 text-blue-600" />;
    }
  };

  const handleAcceptLevelChange = () => {
    if (metrics && onLevelChange) {
      onLevelChange(metrics.recommendedLevel);
    }
    setShowLevelChange(false);
  };

  if (loading || !metrics) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Analyzing your performance level...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Difficulty Adaptation
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      AI automatically adjusts content difficulty based on your performance, 
                      keeping you challenged but not overwhelmed.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              {subject ? `${subject.replace('_', ' ')} content level` : 'Overall content difficulty'}
            </CardDescription>
          </div>
          {getTrendIcon()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Level Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Level</span>
            <Badge className={`${getLevelColor(metrics.currentLevel)} border flex items-center gap-1`}>
              {getLevelIcon(metrics.currentLevel)}
              {metrics.currentLevel.charAt(0).toUpperCase() + metrics.currentLevel.slice(1)}
            </Badge>
          </div>

          {/* Readiness Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Readiness for Next Level</span>
              <span className="font-medium text-gray-900">{metrics.readinessScore.toFixed(0)}%</span>
            </div>
            <Progress value={metrics.readinessScore} className="h-2" />
            <p className="text-xs text-gray-600">
              {metrics.readinessScore >= 85
                ? "Excellent! You're ready for more challenging content."
                : metrics.readinessScore >= 70
                ? "Good progress! Keep up the consistent performance."
                : metrics.readinessScore >= 50
                ? "Building skills. Focus on consistency to advance."
                : "Take your time mastering current level content."}
            </p>
          </div>
        </motion.div>

        {/* Level Change Notification */}
        <AnimatePresence>
          {showLevelChange && metrics.currentLevel !== metrics.recommendedLevel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Zap className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-medium text-yellow-900 mb-1">
                          Level Adjustment Recommended
                        </p>
                        <p className="text-sm text-yellow-800">
                          Based on your performance, we recommend moving to{' '}
                          <strong>{metrics.recommendedLevel}</strong> level content.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-yellow-600 hover:bg-yellow-700"
                          onClick={handleAcceptLevelChange}
                        >
                          Accept & Adjust
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowLevelChange(false)}
                        >
                          Keep Current
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subject-Specific Levels */}
        {Object.keys(metrics.subjectLevels).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-gray-700">Subject Levels</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(metrics.subjectLevels).map(([subj, level], index) => (
                <motion.div
                  key={subj}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-xs font-medium text-gray-700 capitalize">
                    {subj.replace('_', ' ')}
                  </span>
                  <Badge className={`${getLevelColor(level)} text-xs border`}>
                    {getLevelIcon(level)}
                    {level.slice(0, 3)}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-blue-50 rounded-lg p-4 border border-blue-200"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">Adaptive Learning Benefits</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Content automatically adjusts to your skill level</li>
                <li>• Stay in your optimal challenge zone for faster learning</li>
                <li>• Build confidence with appropriately difficult material</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default DifficultyAdaptation;
