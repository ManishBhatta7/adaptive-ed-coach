import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Target,
  Brain,
  Award,
  Clock,
  Download,
  Filter,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Activity,
  BookOpen,
  MessageSquare,
  Trophy,
  Star,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  RefreshCw,
  Settings,
  Share2
} from 'lucide-react';

// Mock chart components (in production, would use recharts, chart.js, or d3)
interface ChartProps {
  data: any[];
  width?: number;
  height?: number;
  className?: string;
}

const MockLineChart: React.FC<ChartProps> = ({ data, height = 300, className }) => (
  <div className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 ${className}`} style={{ height }}>
    <div className="relative h-full flex items-end justify-between">
      {data.map((point, index) => (
        <div
          key={index}
          className="bg-blue-500 rounded-t-sm flex-1 mx-1 relative group"
          style={{ height: `${Math.max(point.value * 100, 10)}%` }}
        >
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            {point.value}
          </div>
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
            {point.label}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MockBarChart: React.FC<ChartProps> = ({ data, height = 300, className }) => (
  <div className={`bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 ${className}`} style={{ height }}>
    <div className="h-full flex items-end justify-between">
      {data.map((bar, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div
            className="bg-green-500 rounded-t-sm w-8 relative group"
            style={{ height: `${Math.max(bar.value * 100, 10)}%` }}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              {bar.value}
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-2 text-center">
            {bar.label}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MockPieChart: React.FC<ChartProps> = ({ data, height = 300, className }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className={`bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 ${className}`} style={{ height }}>
      <div className="h-full flex items-center justify-center">
        <div className="relative w-48 h-48 rounded-full border-8 border-purple-200">
          {data.map((segment, index) => {
            const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
            return (
              <div
                key={index}
                className={`absolute inset-0 rounded-full ${colors[index % colors.length]}`}
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + (segment.value / total) * 50}% 0%)`
                }}
              />
            );
          })}
          <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
          </div>
        </div>
        <div className="ml-8 space-y-2">
          {data.map((item, index) => {
            const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
            return (
              <div key={index} className="flex items-center text-sm">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-2`} />
                <span>{item.label}: {item.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface AnalyticsData {
  metacognitionTrends: any[];
  collaborationMetrics: any[];
  assessmentResults: any[];
  engagementData: any[];
  achievementStats: any[];
  timeSeriesData: any[];
  comparativeData: any[];
  userGrowth: any[];
}

interface FilterState {
  timeRange: string;
  userType: string;
  metric: string;
  classroom: string;
}

export const DataVisualizationDashboard: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    metacognitionTrends: [],
    collaborationMetrics: [],
    assessmentResults: [],
    engagementData: [],
    achievementStats: [],
    timeSeriesData: [],
    comparativeData: [],
    userGrowth: []
  });
  const [filters, setFilters] = useState<FilterState>({
    timeRange: '30',
    userType: 'all',
    metric: 'metacognition',
    classroom: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [filters, state.currentUser]);

  const loadAnalyticsData = async () => {
    if (!state.currentUser) return;

    setIsLoading(true);
    try {
      // Generate mock data based on filters
      const mockData = generateMockAnalyticsData(filters);
      setAnalyticsData(mockData);

      // In production, this would make real API calls:
      // const data = await Promise.all([
      //   fetchMetacognitionTrends(),
      //   fetchCollaborationMetrics(),
      //   fetchAssessmentResults(),
      //   fetchEngagementData()
      // ]);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockAnalyticsData = (filters: FilterState): AnalyticsData => {
    const timeRange = parseInt(filters.timeRange);
    const days = Math.min(timeRange, 90);
    
    // Metacognition trends
    const metacognitionTrends = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: 0.3 + Math.random() * 0.4 + (i / days) * 0.2,
      label: `Day ${i + 1}`
    }));

    // Collaboration metrics
    const collaborationMetrics = [
      { label: 'Sessions Created', value: 45 + Math.floor(Math.random() * 20) },
      { label: 'Peer Interactions', value: 234 + Math.floor(Math.random() * 100) },
      { label: 'Strategies Shared', value: 67 + Math.floor(Math.random() * 30) },
      { label: 'Average Session Time', value: 28 + Math.floor(Math.random() * 15) }
    ];

    // Assessment results
    const assessmentResults = [
      { label: 'Completed', value: 0.75 },
      { label: 'In Progress', value: 0.15 },
      { label: 'Not Started', value: 0.10 }
    ];

    // Engagement data
    const engagementData = Array.from({ length: 7 }, (_, i) => ({
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      value: 0.4 + Math.random() * 0.5
    }));

    // Achievement stats
    const achievementStats = [
      { label: 'Reflector', value: 89 },
      { label: 'Deep Thinker', value: 34 },
      { label: 'Strategy Master', value: 67 },
      { label: 'Growth Mindset', value: 45 },
      { label: 'Collaborator', value: 56 }
    ];

    // Time series data
    const timeSeriesData = Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      metacognition: 0.3 + Math.random() * 0.4,
      collaboration: 0.2 + Math.random() * 0.5,
      engagement: 0.4 + Math.random() * 0.3,
      label: `Month ${i + 1}`
    }));

    // Comparative data
    const comparativeData = [
      { category: 'Reflection Quality', current: 0.78, previous: 0.65, benchmark: 0.70 },
      { category: 'Collaboration Rate', current: 0.82, previous: 0.75, benchmark: 0.80 },
      { category: 'Assessment Scores', current: 0.85, previous: 0.80, benchmark: 0.75 },
      { category: 'Engagement Time', current: 0.72, previous: 0.68, benchmark: 0.70 }
    ];

    // User growth
    const userGrowth = Array.from({ length: 6 }, (_, i) => ({
      period: `Month ${i + 1}`,
      students: 50 + i * 12 + Math.floor(Math.random() * 20),
      teachers: 5 + i * 2 + Math.floor(Math.random() * 3),
      parents: 40 + i * 10 + Math.floor(Math.random() * 15),
      label: `M${i + 1}`
    }));

    return {
      metacognitionTrends,
      collaborationMetrics,
      assessmentResults,
      engagementData,
      achievementStats,
      timeSeriesData,
      comparativeData,
      userGrowth
    };
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const exportData = async (format: 'csv' | 'pdf' | 'json') => {
    // Mock export functionality
    console.log(`Exporting data as ${format}`);
    
    if (format === 'csv') {
      const csvContent = convertToCSV(analyticsData);
      downloadFile(csvContent, 'analytics_data.csv', 'text/csv');
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(analyticsData, null, 2);
      downloadFile(jsonContent, 'analytics_data.json', 'application/json');
    }
    
    setShowExportDialog(false);
  };

  const convertToCSV = (data: AnalyticsData) => {
    // Simple CSV conversion for trends data
    const headers = ['Date', 'Metacognition Score'];
    const rows = data.metacognitionTrends.map(row => [row.date, row.value]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (current < previous) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  // Overview Tab
  const OverviewTab = () => {
    const summaryStats = [
      {
        title: 'Total Reflections',
        value: '1,247',
        change: '+12%',
        trend: 'up',
        icon: Brain,
        color: 'text-purple-600'
      },
      {
        title: 'Active Collaborations',
        value: '89',
        change: '+8%',
        trend: 'up',
        icon: Users,
        color: 'text-blue-600'
      },
      {
        title: 'Assessments Completed',
        value: '456',
        change: '+15%',
        trend: 'up',
        icon: Target,
        color: 'text-green-600'
      },
      {
        title: 'Average Engagement',
        value: '78%',
        change: '-3%',
        trend: 'down',
        icon: Activity,
        color: 'text-orange-600'
      }
    ];

    return (
      <div className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      {stat.trend === 'up' ? (
                        <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Metacognition Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Metacognition Development Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MockLineChart 
              data={analyticsData.metacognitionTrends.slice(-30)} 
              height={300}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement by Day */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Engagement Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MockBarChart 
                data={analyticsData.engagementData} 
                height={250}
              />
            </CardContent>
          </Card>

          {/* Assessment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Assessment Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MockPieChart 
                data={analyticsData.assessmentResults.map(item => ({
                  label: item.label,
                  value: Math.round(item.value * 100)
                }))} 
                height={250}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Trends Tab
  const TrendsTab = () => (
    <div className="space-y-6">
      {/* Time Series Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Long-term Development Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full" />
              Metacognition
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              Collaboration
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              Engagement
            </Badge>
          </div>
          <MockLineChart 
            data={analyticsData.timeSeriesData} 
            height={350}
          />
        </CardContent>
      </Card>

      {/* Comparative Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.comparativeData.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{item.category}</h4>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(item.current, item.previous)}
                    <span className={`text-sm ${getTrendColor(item.current, item.previous)}`}>
                      {((item.current - item.previous) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Current</div>
                    <div className="font-semibold text-blue-600">
                      {(item.current * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Previous</div>
                    <div className="font-semibold text-gray-600">
                      {(item.previous * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Benchmark</div>
                    <div className="font-semibold text-green-600">
                      {(item.benchmark * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${item.current * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Collaboration Tab
  const CollaborationTab = () => (
    <div className="space-y-6">
      {/* Collaboration Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsData.collaborationMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600">
                  {metric.label}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Growth Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MockBarChart 
            data={analyticsData.userGrowth.map(item => ({
              label: item.label,
              value: (item.students + item.teachers + item.parents) / 100
            }))} 
            height={300}
          />
        </CardContent>
      </Card>

      {/* Achievement Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Achievement Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <MockPieChart 
                data={analyticsData.achievementStats} 
                height={300}
              />
            </div>
            <div className="space-y-3">
              {analyticsData.achievementStats.map((achievement, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium">{achievement.label}</span>
                  </div>
                  <Badge variant="secondary">{achievement.value}</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Performance Tab
  const PerformanceTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                99.9%
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                245ms
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                1,247
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: 'New reflection submitted', user: 'Sarah M.', time: '2 minutes ago', type: 'reflection' },
              { action: 'Collaboration session started', user: 'Class 5B', time: '5 minutes ago', type: 'collaboration' },
              { action: 'Assessment completed', user: 'James K.', time: '8 minutes ago', type: 'assessment' },
              { action: 'Achievement unlocked', user: 'Emma L.', time: '12 minutes ago', type: 'achievement' },
              { action: 'AI tutor session ended', user: 'Alex R.', time: '15 minutes ago', type: 'ai_tutor' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${
                  activity.type === 'reflection' ? 'bg-purple-100 text-purple-600' :
                  activity.type === 'collaboration' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'assessment' ? 'bg-green-100 text-green-600' :
                  activity.type === 'achievement' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {activity.type === 'reflection' ? <Brain className="w-4 h-4" /> :
                   activity.type === 'collaboration' ? <Users className="w-4 h-4" /> :
                   activity.type === 'assessment' ? <Target className="w-4 h-4" /> :
                   activity.type === 'achievement' ? <Award className="w-4 h-4" /> :
                   <BookOpen className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{activity.action}</div>
                  <div className="text-sm text-gray-600">{activity.user} • {activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!state.currentUser) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access the analytics dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Visualization Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive analytics and insights for metacognitive learning
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={refreshData}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowExportDialog(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={filters.timeRange} onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.userType} onValueChange={(value) => setFilters(prev => ({ ...prev, userType: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="teachers">Teachers</SelectItem>
                <SelectItem value="parents">Parents</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.metric} onValueChange={(value) => setFilters(prev => ({ ...prev, metric: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metacognition">Metacognition</SelectItem>
                <SelectItem value="collaboration">Collaboration</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Collaboration
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <TrendsTab />
        </TabsContent>

        <TabsContent value="collaboration" className="mt-6">
          <CollaborationTab />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceTab />
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Analytics Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choose the format for exporting your analytics data:
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => exportData('csv')}
                variant="outline"
                className="flex flex-col items-center gap-2 h-20"
              >
                <FileText className="w-8 h-8" />
                CSV
              </Button>
              <Button
                onClick={() => exportData('pdf')}
                variant="outline"
                className="flex flex-col items-center gap-2 h-20"
              >
                <FileText className="w-8 h-8" />
                PDF
              </Button>
              <Button
                onClick={() => exportData('json')}
                variant="outline"
                className="flex flex-col items-center gap-2 h-20"
              >
                <FileText className="w-8 h-8" />
                JSON
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading analytics...</p>
        </div>
      )}
    </div>
  );
};