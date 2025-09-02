import { PerformanceRecord, StudentProfile, LearningStyle, CoachingMode } from '@/types';
import { learningStyleInfo } from '@/types/learningStyles';
import { supabase } from '@/integrations/supabase/client';

export interface ProgressInsight {
  category: 'strength' | 'improvement' | 'pattern' | 'recommendation';
  title: string;
  description: string;
  actionItems: string[];
  confidence: number; // 0-100
  timeframe: string;
}

export interface LearningPattern {
  type: 'consistency' | 'improvement_trend' | 'subject_affinity' | 'learning_style_alignment';
  pattern: string;
  evidence: string[];
  strength: number; // 0-100
  recommendations: string[];
}

export interface PersonalizedCoachingContext {
  studentId: string;
  learningStyle: {
    primary?: LearningStyle;
    secondary?: LearningStyle;
    strengths: Record<LearningStyle, number>;
  };
  performanceHistory: PerformanceRecord[];
  learningPatterns: LearningPattern[];
  recentTrends: {
    overall: number; // percentage change
    bySubject: Record<string, number>;
  };
  strugglingAreas: string[];
  strengths: string[];
  coachingMode: CoachingMode;
}

export class ProgressAnalysisService {
  
  /**
   * Analyzes student performance over time and generates insights
   */
  static async generateProgressInsights(
    studentProfile: StudentProfile,
    timeRange: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month'
  ): Promise<ProgressInsight[]> {
    const insights: ProgressInsight[] = [];
    const performances = studentProfile.performances || [];
    
    if (performances.length === 0) {
      return [{
        category: 'recommendation',
        title: 'Start Your Learning Journey',
        description: 'Complete assignments to unlock personalized insights and recommendations.',
        actionItems: ['Try an answer sheet analysis', 'Take a learning style quiz', 'Submit your first assignment'],
        confidence: 100,
        timeframe: 'immediate'
      }];
    }

    // Filter performances by time range
    const filteredPerformances = this.filterPerformancesByTimeRange(performances, timeRange);
    
    // Generate learning pattern insights
    const patterns = this.identifyLearningPatterns(filteredPerformances, studentProfile);
    insights.push(...this.convertPatternsToInsights(patterns));

    // Generate improvement insights
    const improvementInsights = this.analyzeImprovementTrends(filteredPerformances);
    insights.push(...improvementInsights);

    // Generate learning style alignment insights
    if (studentProfile.primaryLearningStyle) {
      const styleInsights = this.analyzeLearningStyleAlignment(
        filteredPerformances, 
        studentProfile.primaryLearningStyle,
        studentProfile.learningStyleStrengths
      );
      insights.push(...styleInsights);
    }

    // Generate subject-specific insights
    const subjectInsights = this.analyzeSubjectPerformance(filteredPerformances);
    insights.push(...subjectInsights);

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Creates personalized coaching context for AI interactions
   */
  static async createCoachingContext(
    studentProfile: StudentProfile,
    coachingMode: CoachingMode = CoachingMode.DETAILED_INSIGHT
  ): Promise<PersonalizedCoachingContext> {
    const performances = studentProfile.performances || [];
    const patterns = this.identifyLearningPatterns(performances, studentProfile);
    const trends = this.calculateRecentTrends(performances);
    
    return {
      studentId: studentProfile.id,
      learningStyle: {
        primary: studentProfile.primaryLearningStyle,
        secondary: studentProfile.secondaryLearningStyle,
        strengths: studentProfile.learningStyleStrengths || {} as Record<LearningStyle, number>
      },
      performanceHistory: performances,
      learningPatterns: patterns,
      recentTrends: trends,
      strugglingAreas: this.identifyStruggleAreas(performances),
      strengths: this.identifyStrengths(performances),
      coachingMode
    };
  }

  /**
   * Generates AI coaching prompt with personalized context
   */
  static generatePersonalizedCoachingPrompt(
    context: PersonalizedCoachingContext,
    currentSubmission: any
  ): string {
    const { learningStyle, performanceHistory, learningPatterns, recentTrends } = context;
    
    let prompt = `You are an adaptive AI educational coach. Provide personalized feedback based on this student's profile:

## STUDENT CONTEXT:
- **Learning Style**: ${learningStyle.primary ? learningStyleInfo[learningStyle.primary].title : 'Not determined'} (primary)
- **Performance History**: ${performanceHistory.length} submissions over time
- **Recent Trend**: ${recentTrends.overall > 0 ? 'Improving' : recentTrends.overall < 0 ? 'Declining' : 'Stable'} (${recentTrends.overall.toFixed(1)}%)
- **Struggling Areas**: ${context.strugglingAreas.join(', ') || 'None identified'}
- **Strengths**: ${context.strengths.join(', ') || 'Still developing'}

## LEARNING PATTERNS DETECTED:
${learningPatterns.map(p => `- ${p.type}: ${p.pattern}`).join('\n')}

## COACHING MODE: ${context.coachingMode}

## CURRENT SUBMISSION:
${JSON.stringify(currentSubmission, null, 2)}

## INSTRUCTIONS:
1. **Personalize feedback** based on their ${learningStyle.primary} learning style
2. **Reference their progress** from past ${performanceHistory.length} submissions
3. **Address struggling areas**: ${context.strugglingAreas.join(', ')}
4. **Build on strengths**: ${context.strengths.join(', ')}
5. **Provide specific recommendations** that match their learning style preferences

Generate feedback that feels personal, encouraging, and shows you understand their learning journey.`;

    // Add learning style specific instructions
    if (learningStyle.primary) {
      const styleInfo = learningStyleInfo[learningStyle.primary];
      prompt += `\n\n## LEARNING STYLE ADAPTATIONS:
For ${styleInfo.title} learners, focus on: ${styleInfo.recommendations.join(', ')}`;
    }

    return prompt;
  }

  private static filterPerformancesByTimeRange(
    performances: PerformanceRecord[], 
    timeRange: string
  ): PerformanceRecord[] {
    const now = new Date();
    let cutoff = new Date(0); // default to all time
    
    switch (timeRange) {
      case 'week':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    return performances.filter(p => new Date(p.date) >= cutoff);
  }

  private static identifyLearningPatterns(
    performances: PerformanceRecord[], 
    profile: StudentProfile
  ): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    
    if (performances.length < 3) return patterns;

    // Consistency pattern
    const scores = performances.filter(p => p.score !== undefined).map(p => p.score!);
    if (scores.length >= 3) {
      const variance = this.calculateVariance(scores);
      if (variance < 100) { // Low variance indicates consistency
        patterns.push({
          type: 'consistency',
          pattern: 'Consistent performance across submissions',
          evidence: [`Score variance: ${variance.toFixed(1)}`, `Range: ${Math.max(...scores) - Math.min(...scores)} points`],
          strength: Math.max(0, 100 - variance),
          recommendations: ['Continue maintaining steady effort', 'Try challenging yourself with harder problems']
        });
      }
    }

    // Improvement trend pattern
    const recentScores = scores.slice(-5); // Last 5 scores
    const earlierScores = scores.slice(0, 5); // First 5 scores
    if (recentScores.length >= 3 && earlierScores.length >= 3) {
      const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
      const earlierAvg = earlierScores.reduce((sum, s) => sum + s, 0) / earlierScores.length;
      const improvement = ((recentAvg - earlierAvg) / earlierAvg) * 100;
      
      if (improvement > 10) {
        patterns.push({
          type: 'improvement_trend',
          pattern: `Strong upward trend: ${improvement.toFixed(1)}% improvement`,
          evidence: [`Recent average: ${recentAvg.toFixed(1)}%`, `Earlier average: ${earlierAvg.toFixed(1)}%`],
          strength: Math.min(100, improvement * 2),
          recommendations: ['Keep up the excellent progress', 'Consider taking on more challenging material']
        });
      }
    }

    return patterns;
  }

  private static convertPatternsToInsights(patterns: LearningPattern[]): ProgressInsight[] {
    return patterns.map(pattern => ({
      category: pattern.strength > 70 ? 'strength' : 'pattern' as const,
      title: pattern.pattern,
      description: `Analysis shows: ${pattern.evidence.join(', ')}`,
      actionItems: pattern.recommendations,
      confidence: pattern.strength,
      timeframe: 'ongoing'
    }));
  }

  private static analyzeImprovementTrends(performances: PerformanceRecord[]): ProgressInsight[] {
    const insights: ProgressInsight[] = [];
    const scores = performances.filter(p => p.score !== undefined).map(p => p.score!);
    
    if (scores.length < 4) return insights;

    // Calculate trend using linear regression
    const trend = this.calculateTrendSlope(scores);
    
    if (trend > 2) {
      insights.push({
        category: 'strength',
        title: 'Consistent Improvement Detected',
        description: `Your performance is improving at a rate of ${trend.toFixed(1)} points per assignment.`,
        actionItems: ['Continue current study methods', 'Consider gradually increasing difficulty level'],
        confidence: 85,
        timeframe: 'recent'
      });
    } else if (trend < -2) {
      insights.push({
        category: 'improvement',
        title: 'Performance Needs Attention',
        description: `Recent trend shows a decline of ${Math.abs(trend).toFixed(1)} points per assignment.`,
        actionItems: ['Review recent topics', 'Consider adjusting study schedule', 'Seek additional help if needed'],
        confidence: 80,
        timeframe: 'recent'
      });
    }

    return insights;
  }

  private static analyzeLearningStyleAlignment(
    performances: PerformanceRecord[],
    primaryStyle: LearningStyle,
    styleStrengths?: Record<LearningStyle, number>
  ): ProgressInsight[] {
    const insights: ProgressInsight[] = [];
    const styleInfo = learningStyleInfo[primaryStyle];
    
    insights.push({
      category: 'recommendation',
      title: `Optimize for ${styleInfo.title} Learning`,
      description: styleInfo.description,
      actionItems: styleInfo.recommendations,
      confidence: 90,
      timeframe: 'ongoing'
    });

    return insights;
  }

  private static analyzeSubjectPerformance(performances: PerformanceRecord[]): ProgressInsight[] {
    const insights: ProgressInsight[] = [];
    const subjectScores: Record<string, number[]> = {};
    
    performances.forEach(p => {
      if (p.subjectArea && p.score !== undefined) {
        if (!subjectScores[p.subjectArea]) {
          subjectScores[p.subjectArea] = [];
        }
        subjectScores[p.subjectArea].push(p.score);
      }
    });

    Object.entries(subjectScores).forEach(([subject, scores]) => {
      if (scores.length >= 2) {
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        
        if (avg >= 85) {
          insights.push({
            category: 'strength',
            title: `Excelling in ${subject.replace('_', ' ')}`,
            description: `Strong performance with ${avg.toFixed(1)}% average across ${scores.length} submissions.`,
            actionItems: ['Consider advanced topics in this area', 'Help others with this subject'],
            confidence: 85,
            timeframe: 'ongoing'
          });
        } else if (avg < 70) {
          insights.push({
            category: 'improvement',
            title: `Focus needed in ${subject.replace('_', ' ')}`,
            description: `Current average of ${avg.toFixed(1)}% indicates room for improvement.`,
            actionItems: ['Review fundamentals', 'Practice more problems', 'Seek additional resources'],
            confidence: 80,
            timeframe: 'priority'
          });
        }
      }
    });

    return insights;
  }

  private static calculateRecentTrends(performances: PerformanceRecord[]) {
    const overall = this.calculateOverallTrend(performances);
    const bySubject: Record<string, number> = {};
    
    const subjectPerformances: Record<string, PerformanceRecord[]> = {};
    performances.forEach(p => {
      if (p.subjectArea) {
        if (!subjectPerformances[p.subjectArea]) {
          subjectPerformances[p.subjectArea] = [];
        }
        subjectPerformances[p.subjectArea].push(p);
      }
    });

    Object.entries(subjectPerformances).forEach(([subject, perfs]) => {
      bySubject[subject] = this.calculateOverallTrend(perfs);
    });

    return { overall, bySubject };
  }

  private static identifyStruggleAreas(performances: PerformanceRecord[]): string[] {
    const subjectAvgs: Record<string, number> = {};
    const subjectCounts: Record<string, number> = {};

    performances.forEach(p => {
      if (p.subjectArea && p.score !== undefined) {
        if (!subjectAvgs[p.subjectArea]) {
          subjectAvgs[p.subjectArea] = 0;
          subjectCounts[p.subjectArea] = 0;
        }
        subjectAvgs[p.subjectArea] += p.score;
        subjectCounts[p.subjectArea]++;
      }
    });

    return Object.entries(subjectAvgs)
      .map(([subject, total]) => ({
        subject,
        average: total / subjectCounts[subject]
      }))
      .filter(({ average }) => average < 70)
      .map(({ subject }) => subject.replace('_', ' '));
  }

  private static identifyStrengths(performances: PerformanceRecord[]): string[] {
    const subjectAvgs: Record<string, number> = {};
    const subjectCounts: Record<string, number> = {};

    performances.forEach(p => {
      if (p.subjectArea && p.score !== undefined) {
        if (!subjectAvgs[p.subjectArea]) {
          subjectAvgs[p.subjectArea] = 0;
          subjectCounts[p.subjectArea] = 0;
        }
        subjectAvgs[p.subjectArea] += p.score;
        subjectCounts[p.subjectArea]++;
      }
    });

    return Object.entries(subjectAvgs)
      .map(([subject, total]) => ({
        subject,
        average: total / subjectCounts[subject]
      }))
      .filter(({ average }) => average >= 85)
      .map(({ subject }) => subject.replace('_', ' '));
  }

  // Helper methods
  private static calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private static calculateTrendSlope(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const n = scores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = scores;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private static calculateOverallTrend(performances: PerformanceRecord[]): number {
    const scores = performances.filter(p => p.score !== undefined).map(p => p.score!);
    if (scores.length < 2) return 0;
    
    const recent = scores.slice(-Math.ceil(scores.length / 2));
    const earlier = scores.slice(0, Math.floor(scores.length / 2));
    
    if (recent.length === 0 || earlier.length === 0) return 0;
    
    const recentAvg = recent.reduce((sum, s) => sum + s, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, s) => sum + s, 0) / earlier.length;
    
    return ((recentAvg - earlierAvg) / earlierAvg) * 100;
  }
}