import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  LineChart,
  Brain,
  Users,
  Target,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react';

interface AnalyticsSnapshot {
  id: string;
  snapshot_date: string;
  student_count: number;
  avg_metacog_score: number;
  avg_reflection_count: number;
  avg_strategy_usage: number;
  completion_rate: number;
  peer_collaboration_rate: number;
  intervention_count: number;
  badge_earned_count: number;
}

interface StudentTrend {
  student_id: string;
  student_name: string;
  trend_data: {
    date: string;
    metacog_score: number;
    reflection_count: number;
    collaboration_participation: number;
  }[];
  current_score: number;
  score_change: number;
  risk_level: 'low' | 'medium' | 'high';
}

interface PredictiveInsight {
  id: string;
  student_id: string;
  student_name: string;
  insight_type: string;
  confidence_score: number;
  prediction_data: any;
  recommended_actions: string[];
  created_at: string;
}

interface ClassroomComparison {
  metric: string;
  current_value: number;
  benchmark_value: number;
  percentile: number;
  trend: 'improving' | 'declining' | 'stable';
}

export const AdvancedAnalytics: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('trends');
  const [timeRange, setTimeRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('metacognition');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSnapshot[]>([]);
  const [studentTrends, setStudentTrends] = useState<StudentTrend[]>([]);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
  const [classroomComparisons, setClassroomComparisons] = useState<ClassroomComparison[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (state.currentUser && state.currentUser.role === 'teacher') {
      loadAnalyticsData();
    }
  }, [state.currentUser, timeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadClassroomSnapshots(),
        loadStudentTrends(),
        loadPredictiveInsights(),
        loadClassroomComparisons()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClassroomSnapshots = async () => {
    if (!state.currentUser) return;

    try {
      // Get teacher's classrooms
      const { data: classrooms, error: classroomError } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', state.currentUser.id);

      if (classroomError || !classrooms) {
        console.error('Error fetching classrooms:', classroomError);
        return;
      }

      const classroomIds = classrooms.map(c => c.id);
      
      const { data, error } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .in('classroom_id', classroomIds)
        .gte('snapshot_date', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
        .order('snapshot_date', { ascending: true });

      if (error) {
        console.error('Error loading analytics snapshots:', error);
        return;
      }

      setAnalyticsData(data || []);

    } catch (error) {
      console.error('Error loading classroom snapshots:', error);
    }
  };

  const loadStudentTrends = async () => {
    if (!state.currentUser) return;

    try {
      // Get students in teacher's classrooms with their trend data
      const { data, error } = await supabase
        .from('student_progress_trends')
        .select(`
          *,
          profiles:student_id (
            name,
            metacog_score
          )
        `)
        .gte('date', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading student trends:', error);
        return;
      }

      // Group by student and calculate trends
      const studentMap = new Map<string, StudentTrend>();
      
      (data || []).forEach((trend: any) => {
        const studentId = trend.student_id;
        const studentName = trend.profiles?.name || 'Unknown';
        
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            student_id: studentId,
            student_name: studentName,
            trend_data: [],
            current_score: trend.profiles?.metacog_score || 0,
            score_change: 0,
            risk_level: 'low'
          });
        }

        const studentTrend = studentMap.get(studentId)!;
        studentTrend.trend_data.push({
          date: trend.date,
          metacog_score: trend.metacog_score,
          reflection_count: trend.reflection_count,
          collaboration_participation: trend.collaboration_participation
        });
      });

      // Calculate score changes and risk levels
      const trends = Array.from(studentMap.values()).map(student => {
        if (student.trend_data.length >= 2) {
          const firstScore = student.trend_data[0].metacog_score;
          const lastScore = student.trend_data[student.trend_data.length - 1].metacog_score;
          student.score_change = lastScore - firstScore;
        }

        // Determine risk level
        if (student.current_score < 0.3 || student.score_change < -0.1) {
          student.risk_level = 'high';
        } else if (student.current_score < 0.5 || student.score_change < -0.05) {
          student.risk_level = 'medium';
        } else {
          student.risk_level = 'low';
        }

        return student;
      });

      setStudentTrends(trends);

    } catch (error) {
      console.error('Error loading student trends:', error);
    }
  };

  const loadPredictiveInsights = async () => {
    if (!state.currentUser) return;

    try {
      // Get insights for students in teacher's classrooms
      const { data, error } = await supabase
        .from('predictive_insights')
        .select(`
          *,
          profiles:student_id (
            name
          )
        `)
        .eq('is_active', true)
        .order('confidence_score', { ascending: false });

      if (error) {
        console.error('Error loading predictive insights:', error);
        return;
      }

      const insights: PredictiveInsight[] = (data || []).map((insight: any) => ({
        id: insight.id,
        student_id: insight.student_id,
        student_name: insight.profiles?.name || 'Unknown',
        insight_type: insight.insight_type,
        confidence_score: insight.confidence_score,
        prediction_data: insight.prediction_data,
        recommended_actions: insight.recommended_actions || [],
        created_at: insight.created_at
      }));

      setPredictiveInsights(insights);

    } catch (error) {
      console.error('Error loading predictive insights:', error);
    }
  };

  const loadClassroomComparisons = async () => {
    // Mock data for classroom comparisons
    // In a real implementation, this would compare against benchmarks
    const mockComparisons: ClassroomComparison[] = [
      {
        metric: 'Average Metacognition Score',
        current_value: 0.72,
        benchmark_value: 0.68,
        percentile: 75,
        trend: 'improving'
      },
      {
        metric: 'Reflection Engagement',
        current_value: 0.85,
        benchmark_value: 0.78,
        percentile: 82,
        trend: 'improving'
      },
      {
        metric: 'Peer Collaboration Rate',
        current_value: 0.45,
        benchmark_value: 0.52,
        percentile: 42,
        trend: 'declining'
      },
      {
        metric: 'Strategy Diversity',
        current_value: 0.68,
        benchmark_value: 0.65,
        percentile: 58,
        trend: 'stable'
      }
    ];

    setClassroomComparisons(mockComparisons);
  };

  const generateTrendChart = (data: AnalyticsSnapshot[], metric: string) => {
    // Simplified chart data preparation
    const chartData = data.map(snapshot => ({
      date: new Date(snapshot.snapshot_date).toLocaleDateString(),
      value: getMetricValue(snapshot, metric)
    }));

    return chartData;
  };

  const getMetricValue = (snapshot: AnalyticsSnapshot, metric: string): number => {
    switch (metric) {
      case 'metacognition': return snapshot.avg_metacog_score;
      case 'reflection': return snapshot.avg_reflection_count;
      case 'collaboration': return snapshot.peer_collaboration_rate;
      case 'completion': return snapshot.completion_rate;
      default: return 0;
    }
  };

  const getTrendDirection = (data: number[]): 'up' | 'down' | 'stable' => {
    if (data.length < 2) return 'stable';
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 0.02) return 'up';
    if (difference < -0.02) return 'down';
    return 'stable';
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Trend Analysis Tab
  const TrendAnalysisTab = () => {
    const chartData = generateTrendChart(analyticsData, selectedMetric);
    const metricValues = chartData.map(d => d.value);
    const trend = getTrendDirection(metricValues);

    return (
      <div className="space-y-6">
        {/* Metric Controls */}
        <div className="flex gap-4 items-center">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metacognition">Metacognition Score</SelectItem>
              <SelectItem value="reflection">Reflection Count</SelectItem>
              <SelectItem value="collaboration">Collaboration Rate</SelectItem>
              <SelectItem value="completion">Completion Rate</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trend Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {analyticsData.length > 0 && (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Average</p>
                      <p className="text-2xl font-bold">
                        {analyticsData[analyticsData.length - 1] ? 
                          getMetricValue(analyticsData[analyticsData.length - 1], selectedMetric).toFixed(2) : 
                          'N/A'}
                      </p>
                    </div>
                    <Brain className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Trend</p>
                      <div className="flex items-center gap-2">
                        {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-600" />}
                        {trend === 'down' && <TrendingDown className="w-5 h-5 text-red-600" />}
                        {trend === 'stable' && <div className="w-5 h-0.5 bg-gray-400" />}
                        <span className={`font-medium ${
                          trend === 'up' ? 'text-green-600' : 
                          trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {trend === 'up' ? 'Improving' : 
                           trend === 'down' ? 'Declining' : 'Stable'}
                        </span>
                      </div>
                    </div>
                    <LineChart className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Students</p>
                      <p className="text-2xl font-bold">
                        {analyticsData[analyticsData.length - 1]?.student_count || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Data Points</p>
                      <p className="text-2xl font-bold">{analyticsData.length}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Trend Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Chart visualization would be rendered here</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {chartData.length} data points over {timeRange} days
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Min:</span> {Math.min(...metricValues).toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Max:</span> {Math.max(...metricValues).toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Avg:</span> {(metricValues.reduce((a, b) => a + b, 0) / metricValues.length).toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Range:</span> {(Math.max(...metricValues) - Math.min(...metricValues)).toFixed(2)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No data available for the selected time range</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Student Analysis Tab
  const StudentAnalysisTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Individual Student Trends</h3>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-red-600 border-red-300">
            High Risk: {studentTrends.filter(s => s.risk_level === 'high').length}
          </Badge>
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            Medium Risk: {studentTrends.filter(s => s.risk_level === 'medium').length}
          </Badge>
          <Badge variant="outline" className="text-green-600 border-green-300">
            Low Risk: {studentTrends.filter(s => s.risk_level === 'low').length}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studentTrends.map((student) => (
          <Card key={student.student_id} className={`border-l-4 ${getRiskColor(student.risk_level)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{student.student_name}</CardTitle>
                <Badge variant={student.risk_level === 'high' ? 'destructive' : 
                               student.risk_level === 'medium' ? 'secondary' : 'outline'}>
                  {student.risk_level} risk
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Current Score:</span>
                  <div className="font-semibold">{student.current_score.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Score Change:</span>
                  <div className={`font-semibold flex items-center gap-1 ${
                    student.score_change > 0 ? 'text-green-600' : 
                    student.score_change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {student.score_change > 0 && <TrendingUp className="w-3 h-3" />}
                    {student.score_change < 0 && <TrendingDown className="w-3 h-3" />}
                    {student.score_change >= 0 ? '+' : ''}{student.score_change.toFixed(3)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-gray-600">Recent Activity:</span>
                <div className="text-xs space-y-1">
                  <div>Reflections: {student.trend_data[student.trend_data.length - 1]?.reflection_count || 0}</div>
                  <div>Collaboration: {student.trend_data[student.trend_data.length - 1]?.collaboration_participation || 0}</div>
                </div>
              </div>

              <div className="h-16 bg-gray-50 rounded flex items-center justify-center text-xs text-gray-500">
                Mini trend chart ({student.trend_data.length} data points)
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {studentTrends.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Student Data</h3>
            <p className="text-gray-600">Student trend data will appear here as students engage with the platform.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Predictive Insights Tab
  const PredictiveInsightsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">AI-Powered Insights</h3>
        <Button onClick={loadAnalyticsData} size="sm" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh Insights
        </Button>
      </div>

      {predictiveInsights.length > 0 ? (
        <div className="space-y-4">
          {predictiveInsights.map((insight) => (
            <Card key={insight.id} className="border-l-4 border-purple-400">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      insight.insight_type === 'at_risk' ? 'bg-red-100' :
                      insight.insight_type === 'improvement_needed' ? 'bg-yellow-100' :
                      insight.insight_type === 'high_performer' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {insight.insight_type === 'at_risk' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                      {insight.insight_type === 'improvement_needed' && <Target className="w-5 h-5 text-yellow-600" />}
                      {insight.insight_type === 'high_performer' && <TrendingUp className="w-5 h-5 text-green-600" />}
                      {insight.insight_type === 'strategy_recommendation' && <Lightbulb className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{insight.student_name}</CardTitle>
                      <p className="text-sm text-gray-600">{insight.insight_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {(insight.confidence_score * 100).toFixed(0)}% confidence
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(insight.created_at)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h5 className="font-medium mb-2">Prediction Details:</h5>
                  <div className="text-sm space-y-1">
                    {Object.entries(insight.prediction_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key.replace('_', ' ')}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {insight.recommended_actions.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Recommended Actions:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {insight.recommended_actions.map((action, index) => (
                        <li key={index} className="text-gray-700">{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
            <p className="text-gray-600">AI insights will appear here as more student data becomes available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Comparative Analysis Tab
  const ComparativeAnalysisTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Classroom Benchmarking</h3>
        <Badge variant="outline">Updated {lastUpdated ? lastUpdated.toLocaleDateString() : 'Never'}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classroomComparisons.map((comparison, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{comparison.metric}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold">{comparison.current_value.toFixed(2)}</span>
                  <div className="text-sm text-gray-600">Your classroom</div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 ${
                    comparison.trend === 'improving' ? 'text-green-600' :
                    comparison.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {comparison.trend === 'improving' && <TrendingUp className="w-4 h-4" />}
                    {comparison.trend === 'declining' && <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm font-medium">{comparison.trend}</span>
                  </div>
                  <div className="text-sm text-gray-600">vs benchmark</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Benchmark: {comparison.benchmark_value.toFixed(2)}</span>
                  <span>{comparison.percentile}th percentile</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      comparison.percentile >= 75 ? 'bg-green-500' :
                      comparison.percentile >= 50 ? 'bg-yellow-500' :
                      comparison.percentile >= 25 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${comparison.percentile}%` }}
                  />
                </div>
              </div>

              <div className="text-xs text-gray-600">
                {comparison.current_value > comparison.benchmark_value ? 'Above' : 'Below'} average by {' '}
                {Math.abs((comparison.current_value - comparison.benchmark_value) / comparison.benchmark_value * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (!state.currentUser || state.currentUser.role !== 'teacher') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Advanced analytics are only available to teachers.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-gray-600 mt-2">
            Deep insights into student metacognitive development
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAnalyticsData} size="sm" variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button size="sm" variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <LineChart className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Compare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-6">
          <TrendAnalysisTab />
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <StudentAnalysisTab />
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <PredictiveInsightsTab />
        </TabsContent>

        <TabsContent value="compare" className="mt-6">
          <ComparativeAnalysisTab />
        </TabsContent>
      </Tabs>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading analytics...</p>
        </div>
      )}
    </div>
  );
};