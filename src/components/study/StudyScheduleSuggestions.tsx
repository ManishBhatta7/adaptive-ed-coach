import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Clock, TrendingUp, Zap, Sun, Moon, Coffee, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { StudentProfile, PerformanceRecord } from '@/types';

interface StudySession {
  time: string;
  duration: number;
  subject: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  bestTime: boolean;
}

interface StudyScheduleSuggestionsProps {
  studentProfile: StudentProfile;
  className?: string;
  onScheduleAccept?: (schedule: StudySession[]) => void;
}

export const StudyScheduleSuggestions: React.FC<StudyScheduleSuggestionsProps> = ({
  studentProfile,
  className = '',
  onScheduleAccept,
}) => {
  const [suggestions, setSuggestions] = useState<StudySession[]>([]);
  const [optimalTime, setOptimalTime] = useState<string>('');
  const [weeklyHours, setWeeklyHours] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateScheduleSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentProfile]);

  const generateScheduleSuggestions = () => {
    setLoading(true);
    const performances = studentProfile.performances || [];

    // Analyze performance patterns to determine optimal study times
    const timeAnalysis = analyzePerformancePatterns(performances);
    
    // Generate personalized schedule
    const schedule = createOptimalSchedule(timeAnalysis, studentProfile);
    
    setSuggestions(schedule);
    setOptimalTime(timeAnalysis.bestTime);
    setWeeklyHours(schedule.reduce((sum, s) => sum + s.duration, 0));
    setLoading(false);
  };

  const analyzePerformancePatterns = (performances: PerformanceRecord[]) => {
    if (performances.length < 3) {
      return {
        bestTime: 'morning',
        focusSubjects: ['General Study'],
        improvementAreas: [],
        totalMinutes: 180
      };
    }

    // Analyze which subjects need more attention
    const subjectScores: Record<string, number[]> = {};
    performances.forEach(perf => {
      if (perf.subjectArea && perf.score !== undefined) {
        if (!subjectScores[perf.subjectArea]) {
          subjectScores[perf.subjectArea] = [];
        }
        subjectScores[perf.subjectArea].push(perf.score);
      }
    });

    // Identify subjects needing improvement (score < 75)
    const improvementAreas = Object.entries(subjectScores)
      .map(([subject, scores]) => ({
        subject,
        avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length
      }))
      .filter(({ avgScore }) => avgScore < 75)
      .sort((a, b) => a.avgScore - b.avgScore)
      .map(({ subject }) => subject);

    // Identify strong subjects (score >= 85)
    const focusSubjects = Object.entries(subjectScores)
      .map(([subject, scores]) => ({
        subject,
        avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length
      }))
      .filter(({ avgScore }) => avgScore >= 85)
      .map(({ subject }) => subject);

    // Determine best study time based on learning style
    let bestTime = 'morning';
    if (studentProfile.primaryLearningStyle) {
      const style = studentProfile.primaryLearningStyle;
      if (style === 'kinesthetic' || style === 'social') {
        bestTime = 'afternoon';
      } else if (style === 'visual' || style === 'logical') {
        bestTime = 'morning';
      } else if (style === 'auditory' || style === 'reading_writing') {
        bestTime = 'evening';
      }
    }

    // Calculate recommended weekly study time (based on performance trends)
    const recentScores = performances.slice(-5).filter(p => p.score !== undefined).map(p => p.score!);
    const avgRecentScore = recentScores.length > 0 
      ? recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length 
      : 75;
    
    // Lower scores = more study time needed
    const baseMinutes = 120;
    const adjustedMinutes = avgRecentScore < 70 
      ? baseMinutes + 60 
      : avgRecentScore < 80 
      ? baseMinutes + 30 
      : baseMinutes;

    return {
      bestTime,
      focusSubjects: focusSubjects.length > 0 ? focusSubjects : ['General Study'],
      improvementAreas,
      totalMinutes: adjustedMinutes * 7 // Weekly total
    };
  };

  const createOptimalSchedule = (analysis: {
    bestTime: string;
    focusSubjects: string[];
    improvementAreas: string[];
    totalMinutes: number;
  }, profile: StudentProfile): StudySession[] => {
    const schedule: StudySession[] = [];
    const { bestTime, improvementAreas, focusSubjects, totalMinutes } = analysis;

    // Distribute study time across the week
    const dailyMinutes = Math.floor(totalMinutes / 7);

    // Monday - Priority improvement areas
    if (improvementAreas.length > 0) {
      schedule.push({
        time: `Monday ${getTimeSlot(bestTime)}`,
        duration: dailyMinutes,
        subject: improvementAreas[0]?.replace('_', ' ') || 'General',
        priority: 'high',
        reason: 'Focus on improvement area with highest priority',
        bestTime: true
      });
    }

    // Wednesday - Mixed review
    schedule.push({
      time: `Wednesday ${getTimeSlot(bestTime)}`,
      duration: dailyMinutes,
      subject: focusSubjects[0]?.replace('_', ' ') || 'Review',
      priority: 'medium',
      reason: 'Maintain strengths and build confidence',
      bestTime: true
    });

    // Friday - Second priority improvement
    if (improvementAreas.length > 1) {
      schedule.push({
        time: `Friday ${getTimeSlot(bestTime === 'evening' ? 'afternoon' : bestTime)}`,
        duration: dailyMinutes,
        subject: improvementAreas[1]?.replace('_', ' ') || 'General',
        priority: 'high',
        reason: 'Address secondary improvement area',
        bestTime: false
      });
    }

    // Weekend - Comprehensive review
    schedule.push({
      time: `Sunday ${getTimeSlot('morning')}`,
      duration: Math.floor(dailyMinutes * 1.5),
      subject: 'Comprehensive Review',
      priority: 'medium',
      reason: 'Weekly review and preparation for next week',
      bestTime: false
    });

    // Add quick daily sessions for consistency
    schedule.push({
      time: 'Daily (15 min)',
      duration: 15,
      subject: 'Quick Review',
      priority: 'low',
      reason: 'Maintain consistency and reinforce learning',
      bestTime: false
    });

    return schedule;
  };

  const getTimeSlot = (time: string): string => {
    switch (time) {
      case 'morning':
        return '7:00 AM - 9:00 AM';
      case 'afternoon':
        return '2:00 PM - 4:00 PM';
      case 'evening':
        return '6:00 PM - 8:00 PM';
      default:
        return '7:00 AM - 9:00 AM';
    }
  };

  const getTimeIcon = (time: string) => {
    if (time.includes('AM') || time.includes('morning')) return <Sun className="h-4 w-4 text-yellow-500" />;
    if (time.includes('afternoon')) return <Coffee className="h-4 w-4 text-orange-500" />;
    return <Moon className="h-4 w-4 text-indigo-500" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Generating your optimal study schedule...</p>
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
              <Calendar className="h-5 w-5 text-blue-600" />
              AI Study Schedule
            </CardTitle>
            <CardDescription>
              Personalized recommendations based on your performance and learning style
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            {weeklyHours} min/week
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Optimal Time Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-900">Your Optimal Study Time</p>
              <p className="text-sm text-blue-700">
                {optimalTime.charAt(0).toUpperCase() + optimalTime.slice(1)} sessions work best for your learning style
              </p>
            </div>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
        </motion.div>

        {/* Schedule Sessions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Recommended Sessions</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="cursor-help">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    AI Optimized
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Schedule generated using your performance data, learning patterns, and optimal study times
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {suggestions.map((session, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTimeIcon(session.time)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{session.subject}</p>
                        {session.bestTime && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Star className="h-2.5 w-2.5 mr-1" />
                            Best Time
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Clock className="h-3 w-3" />
                        <span>{session.time}</span>
                        <span className="text-gray-400">•</span>
                        <span>{session.duration} min</span>
                      </div>
                      <p className="text-xs text-gray-600">{session.reason}</p>
                    </div>
                    <Badge className={`${getPriorityColor(session.priority)} border text-xs`}>
                      {session.priority}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="flex gap-3 pt-4 border-t"
        >
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => onScheduleAccept?.(suggestions)}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Accept Schedule
          </Button>
          <Button variant="outline" className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="bg-purple-50 rounded-lg p-4 border border-purple-200"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-purple-900">Study Tips</p>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Stick to your schedule for at least 2 weeks to see improvement</li>
                <li>• Take 5-minute breaks every 25 minutes (Pomodoro technique)</li>
                <li>• AI will adjust recommendations based on your progress</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default StudyScheduleSuggestions;
