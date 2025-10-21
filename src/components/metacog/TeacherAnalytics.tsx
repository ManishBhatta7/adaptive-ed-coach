import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  BarChart3,
  Download,
  Calendar,
  Target
} from 'lucide-react';

interface ClassAnalytics {
  avgMetacogScore: number;
  totalReflections: number;
  studentsNeedingHelp: Array<{
    id: string;
    name: string;
    email: string;
    metacog_score: number;
    total_reflections: number;
    last_reflection: string;
  }>;
  strategyUsage: Record<string, number>;
  reflectionTrends: Array<{
    date: string;
    avg_score: number;
    reflection_count: number;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    metacog_score: number;
    total_reflections: number;
  }>;
}

export const TeacherAnalytics: React.FC = () => {
  const { state } = useAppContext();
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (state.currentUser && state.isTeacher) {
      fetchAnalytics();
    }
  }, [state.currentUser, state.isTeacher, selectedClassroom, timeRange]);

  const fetchAnalytics = async () => {
    if (!state.currentUser) return;

    setLoading(true);
    try {
      // Get date range
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Get teacher's classrooms
      const { data: classrooms } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', state.currentUser.id);

      if (!classrooms || classrooms.length === 0) {
        setAnalytics({
          avgMetacogScore: 0,
          totalReflections: 0,
          studentsNeedingHelp: [],
          strategyUsage: {},
          reflectionTrends: [],
          topPerformers: []
        });
        return;
      }

      const classroomIds = selectedClassroom === 'all' 
        ? classrooms.map(c => c.id)
        : [selectedClassroom];

      // Fetch student profiles with metacog data
      const { data: students, error: studentsError } = await supabase
        .from('classroom_members')
        .select(`
          student_id,
          profiles!classroom_members_student_id_fkey (
            id, name, email, metacog_score, total_reflections, metacog_history
          )
        `)
        .in('classroom_id', classroomIds);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return;
      }

      // Get recent reflections for trend analysis
      const { data: recentReflections } = await supabase
        .from('reflections')
        .select('student_id, created_at, strategy_used')
        .in('classroom_id', classroomIds)
        .gte('created_at', startDate.toISOString());

      // Process analytics
      const studentProfiles = students?.map(s => s.profiles).filter(Boolean) || [];
      
      const avgMetacogScore = studentProfiles.length > 0
        ? studentProfiles.reduce((sum, s) => sum + (s.metacog_score || 0), 0) / studentProfiles.length
        : 0;

      const totalReflections = studentProfiles.reduce((sum, s) => sum + (s.total_reflections || 0), 0);

      // Students needing help (score < 0.35)
      const studentsNeedingHelp = studentProfiles
        .filter(s => (s.metacog_score || 0) < 0.35)
        .map(s => ({
          id: s.id,
          name: s.name || 'Unknown',
          email: s.email || '',
          metacog_score: s.metacog_score || 0,
          total_reflections: s.total_reflections || 0,
          last_reflection: 'N/A' // Would need to calculate from reflections
        }))
        .sort((a, b) => a.metacog_score - b.metacog_score);

      // Top performers (score >= 0.65)
      const topPerformers = studentProfiles
        .filter(s => (s.metacog_score || 0) >= 0.65)
        .map(s => ({
          id: s.id,
          name: s.name || 'Unknown',
          metacog_score: s.metacog_score || 0,
          total_reflections: s.total_reflections || 0
        }))
        .sort((a, b) => b.metacog_score - a.metacog_score)
        .slice(0, 5);

      // Strategy usage from recent reflections
      const strategyUsage: Record<string, number> = {};
      recentReflections?.forEach(r => {
        if (r.strategy_used) {
          strategyUsage[r.strategy_used] = (strategyUsage[r.strategy_used] || 0) + 1;
        }
      });

      // Simple trend analysis (could be enhanced)
      const reflectionTrends = calculateTrends(recentReflections || [], daysBack);

      setAnalytics({
        avgMetacogScore,
        totalReflections,
        studentsNeedingHelp,
        strategyUsage,
        reflectionTrends,
        topPerformers
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrends = (reflections: any[], daysBack: number) => {
    const trends = [];
    const today = new Date();
    
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayReflections = reflections.filter(r => 
        r.created_at.split('T')[0] === dateStr
      );
      
      trends.push({
        date: dateStr,
        avg_score: 0.5, // Simplified - would calculate from actual data
        reflection_count: dayReflections.length
      });
    }
    
    return trends;
  };

  const exportAnalytics = () => {
    if (!analytics) return;

    const reportData = {
      'Class Overview': {
        'Average Metacognition Score': analytics.avgMetacogScore.toFixed(2),
        'Total Reflections': analytics.totalReflections,
        'Students Needing Help': analytics.studentsNeedingHelp.length,
        'Top Performers': analytics.topPerformers.length
      },
      'Students Needing Help': analytics.studentsNeedingHelp,
      'Top Performers': analytics.topPerformers,
      'Strategy Usage': analytics.strategyUsage
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metacognition-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!state.isTeacher) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">This analytics dashboard is only available for teachers.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Unable to load analytics data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-sm font-medium">Classroom:</label>
            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classrooms</SelectItem>
                {state.classrooms.map(classroom => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Time Range:</label>
            <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button onClick={exportAnalytics} variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.avgMetacogScore.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Avg Metacog Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalReflections}</p>
                <p className="text-sm text-gray-600">Total Reflections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.studentsNeedingHelp.length}</p>
                <p className="text-sm text-gray-600">Need Help</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.topPerformers.length}</p>
                <p className="text-sm text-gray-600">Top Performers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Needing Help */}
      {analytics.studentsNeedingHelp.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Students Needing Support (Score &lt; 0.35)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                These students would benefit from additional metacognition scaffolding and reflection guidance.
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              {analytics.studentsNeedingHelp.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      Score: {student.metacog_score.toFixed(2)}
                    </Badge>
                    <p className="text-sm text-gray-600">
                      {student.total_reflections} reflections
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategy Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Strategy Usage Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics.strategyUsage).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(analytics.strategyUsage)
                  .sort(([,a], [,b]) => b - a)
                  .map(([strategy, count]) => (
                    <div key={strategy} className="flex items-center justify-between">
                      <span className="font-medium">{strategy}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${(count / Math.max(...Object.values(analytics.strategyUsage))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No strategy usage data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Performers (Score ≥ 0.65)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topPerformers.length > 0 ? (
              <div className="space-y-3">
                {analytics.topPerformers.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">
                          {student.total_reflections} reflections
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-600">
                      {student.metacog_score.toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">
                No top performers yet. Encourage more reflection!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.studentsNeedingHelp.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Run a class reflection activity</strong> for {analytics.studentsNeedingHelp.length} students 
                  who need metacognition support. Focus on strategy explanation and self-monitoring.
                </AlertDescription>
              </Alert>
            )}
            
            {Object.keys(analytics.strategyUsage).length < 4 && (
              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  <strong>Introduce strategy diversity</strong> - students are only using {Object.keys(analytics.strategyUsage).length} 
                  out of 6 available strategies. Consider demonstrating new approaches.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};