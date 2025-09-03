import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Award,
  BookOpen,
  Clock,
  Download,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { PerformanceRecord } from '@/types/performance';

interface ProgressData {
  performances: PerformanceRecord[];
  learningInsights: LearningInsight[];
  subjectBreakdown: SubjectBreakdown[];
  timeSeriesData: TimeSeriesPoint[];
  strengthsWeaknesses: SkillAnalysis;
}

interface LearningInsight {
  id: string;
  type: 'strength' | 'weakness' | 'recommendation' | 'achievement';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

interface SubjectBreakdown {
  subject: string;
  averageScore: number;
  totalAssignments: number;
  improvement: number;
  trend: 'up' | 'down' | 'stable';
}

interface TimeSeriesPoint {
  date: string;
  score: number;
  subject: string;
  assignmentType: string;
}

interface SkillAnalysis {
  strengths: Array<{ skill: string; score: number }>;
  weaknesses: Array<{ skill: string; score: number }>;
  recommendations: string[];
}

interface EnhancedProgressReportingProps {
  className?: string;
}

export const EnhancedProgressReporting = ({ className = "" }: EnhancedProgressReportingProps) => {
  const { state } = useAppContext();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedSubject, setSelectedSubject] = useState('all');
  
  useEffect(() => {
    if (state.currentUser) {
      loadProgressData();
    }
  }, [state.currentUser, timeRange, selectedSubject]);

  const loadProgressData = async () => {
    if (!state.currentUser) return;
    
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Fetch performance data
      let query = supabase
        .from('student_performance')
        .select('*')
        .eq('user_id', state.currentUser.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (selectedSubject !== 'all') {
        query = query.eq('data->subjectArea', selectedSubject);
      }

      const { data: performanceData, error } = await query;

      if (error) throw error;

      // Transform and analyze the data
      const performances: PerformanceRecord[] = (performanceData || []).map(p => {
        const data = typeof p.data === 'object' && p.data ? p.data as any : {};
        return {
          id: p.id,
          userId: p.user_id,
          date: p.created_at,
          title: data.title || 'Assignment',
          score: data.score,
          subjectArea: data.subjectArea,
          assignmentType: data.assignmentType,
          timeSpent: data.timeSpent,
          accuracy: data.accuracy,
          completionRate: data.completionRate,
          feedback: data.feedback || '',
          strengths: data.strengths || [],
          weaknesses: data.weaknesses || [],
          recommendations: data.recommendations || [],
        };
      });

      // Generate insights and analysis
      const analysis = await generateLearningInsights(performances);
      
      setProgressData({
        performances,
        learningInsights: analysis.insights,
        subjectBreakdown: analysis.subjectBreakdown,
        timeSeriesData: analysis.timeSeriesData,
        strengthsWeaknesses: analysis.skillAnalysis,
      });
      
    } catch (error: any) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLearningInsights = async (performances: PerformanceRecord[]) => {
    const insights: LearningInsight[] = [];
    const subjectMap = new Map<string, { scores: number[], count: number }>();
    const timeSeriesData: TimeSeriesPoint[] = [];
    
    // Analyze performance by subject
    performances.forEach(p => {
      const subject = typeof p.subjectArea === 'string' ? p.subjectArea : (p.subjectArea || 'unknown');
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { scores: [], count: 0 });
      }
      
      const subjectData = subjectMap.get(subject)!;
      if (p.score !== undefined) {
        subjectData.scores.push(p.score);
      }
      subjectData.count++;
      
      // Add to time series
      if (p.score !== undefined) {
        timeSeriesData.push({
          date: new Date(p.date).toISOString().split('T')[0],
          score: p.score,
          subject: subject,
          assignmentType: p.assignmentType || 'unknown',
        });
      }
    });

    // Generate subject breakdown
    const subjectBreakdown: SubjectBreakdown[] = Array.from(subjectMap.entries()).map(([subject, data]) => {
      const averageScore = data.scores.length > 0 
        ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length 
        : 0;
      
      // Calculate trend (simplified)
      const recentScores = data.scores.slice(-3);
      const earlierScores = data.scores.slice(0, 3);
      const recentAvg = recentScores.length > 0 ? recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length : 0;
      const earlierAvg = earlierScores.length > 0 ? earlierScores.reduce((sum, s) => sum + s, 0) / earlierScores.length : 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentAvg > earlierAvg + 5) trend = 'up';
      else if (recentAvg < earlierAvg - 5) trend = 'down';
      
      return {
        subject: subject.replace('_', ' '),
        averageScore: Math.round(averageScore),
        totalAssignments: data.count,
        improvement: Math.round(recentAvg - earlierAvg),
        trend,
      };
    });

    // Generate insights based on performance patterns
    const overallAverage = performances.length > 0 
      ? performances.reduce((sum, p) => sum + (p.score || 0), 0) / performances.length 
      : 0;

    if (overallAverage >= 85) {
      insights.push({
        id: 'high-performer',
        type: 'achievement',
        title: 'Excellent Performance!',
        description: `You're maintaining an average of ${overallAverage.toFixed(1)}% across all subjects.`,
        priority: 'high',
        actionable: false,
      });
    } else if (overallAverage < 70) {
      insights.push({
        id: 'needs-improvement',
        type: 'recommendation',
        title: 'Focus on Fundamentals',
        description: 'Consider reviewing basic concepts and seeking additional help.',
        priority: 'high',
        actionable: true,
      });
    }

    // Find strongest and weakest subjects
    const sortedSubjects = subjectBreakdown.sort((a, b) => b.averageScore - a.averageScore);
    
    if (sortedSubjects.length > 0) {
      const strongest = sortedSubjects[0];
      const weakest = sortedSubjects[sortedSubjects.length - 1];
      
      insights.push({
        id: 'strongest-subject',
        type: 'strength',
        title: `${strongest.subject} is your strongest subject`,
        description: `You're excelling with an average of ${strongest.averageScore}%.`,
        priority: 'medium',
        actionable: false,
      });
      
      if (weakest.averageScore < 75) {
        insights.push({
          id: 'weakest-subject',
          type: 'weakness',
          title: `Consider focusing more on ${weakest.subject}`,
          description: `This subject needs attention with an average of ${weakest.averageScore}%.`,
          priority: 'high',
          actionable: true,
        });
      }
    }

    // Generate skill analysis
    const skillAnalysis: SkillAnalysis = {
      strengths: sortedSubjects.slice(0, 3).map(s => ({ skill: s.subject, score: s.averageScore })),
      weaknesses: sortedSubjects.slice(-3).map(s => ({ skill: s.subject, score: s.averageScore })),
      recommendations: [
        'Practice regularly to maintain consistency',
        'Focus on weak areas while maintaining strengths',
        'Set specific goals for improvement',
        'Use active learning techniques',
      ],
    };

    return {
      insights,
      subjectBreakdown,
      timeSeriesData,
      skillAnalysis,
    };
  };

  const exportReport = async () => {
    // Implementation for exporting detailed report (PDF/CSV)
    console.log('Exporting progress report...');
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'weakness': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'recommendation': return <Target className="h-4 w-4 text-blue-600" />;
      case 'achievement': return <Award className="h-4 w-4 text-yellow-600" />;
      default: return <BookOpen className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-green-50 border-green-200';
      case 'weakness': return 'bg-red-50 border-red-200';
      case 'recommendation': return 'bg-blue-50 border-blue-200';
      case 'achievement': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Progress Data</h3>
          <p className="text-gray-600">Complete some assignments to see your progress report.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Enhanced Progress Report</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {progressData.subjectBreakdown.map(subject => (
                <SelectItem key={subject.subject} value={subject.subject}>
                  {subject.subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Overview Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subject Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressData.subjectBreakdown.map(subject => (
              <div key={subject.subject} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold capitalize">{subject.subject}</h4>
                    <Badge variant={subject.trend === 'up' ? 'default' : subject.trend === 'down' ? 'destructive' : 'secondary'}>
                      {subject.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {subject.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                      {subject.trend}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{subject.averageScore}%</div>
                    <div className="text-sm text-gray-600">{subject.totalAssignments} assignments</div>
                  </div>
                </div>
                <Progress value={subject.averageScore} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {progressData.learningInsights.map(insight => (
              <div key={insight.id} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-700">{insight.description}</p>
                    {insight.actionable && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Action Required
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Strengths & Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progressData.strengthsWeaknesses.strengths.map((strength, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{strength.skill}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={strength.score} className="w-20 h-2" />
                    <span className="text-sm font-medium w-12">{strength.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Improvement Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressData.strengthsWeaknesses.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};