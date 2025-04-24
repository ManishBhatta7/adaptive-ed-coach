
import { useState, useEffect } from 'react';
import { PerformanceRecord, SubjectArea } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, Minus, Calendar, LineChart, BarChart3 } from 'lucide-react';
import { 
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts';

// Subject area colors (reusing from ProgressChart)
const subjectColors: Record<SubjectArea, string> = {
  [SubjectArea.MATH]: "#9b87f5",
  [SubjectArea.SCIENCE]: "#0EA5E9",
  [SubjectArea.LITERATURE]: "#7E69AB",
  [SubjectArea.HISTORY]: "#F97316",
  [SubjectArea.LANGUAGE]: "#D946EF",
  [SubjectArea.ART]: "#6E59A5",
  [SubjectArea.MUSIC]: "#33C3F0",
  [SubjectArea.COMPUTER_SCIENCE]: "#8B5CF6",
  [SubjectArea.PHYSICAL_EDUCATION]: "#F43F5E",
  [SubjectArea.OTHER]: "#8E9196"
};

interface AcademicProgressTimelineProps {
  performances: PerformanceRecord[];
  title?: string;
  description?: string;
}

const AcademicProgressTimeline = ({ 
  performances, 
  title = "Academic Progress Timeline", 
  description = "Track and analyze your academic progress over time"
}: AcademicProgressTimelineProps) => {
  const [timeRange, setTimeRange] = useState<string>('all');
  const [chartType, setChartType] = useState<string>('line');
  const [filteredData, setFilteredData] = useState<PerformanceRecord[]>([]);
  const [progressTrends, setProgressTrends] = useState<Record<string, any>>({});
  
  // Get unique subject areas in the performance data
  const uniqueSubjects = Array.from(
    new Set(performances.map(p => p.subjectArea))
  );
  
  // Filter data based on time range
  useEffect(() => {
    const now = new Date();
    let filterDate = new Date();
    
    // Calculate filter date based on selected time range
    switch (timeRange) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        // 'all' - no filtering
        filterDate = new Date(0); // January 1, 1970
    }
    
    const filtered = performances.filter(p => new Date(p.date) >= filterDate);
    setFilteredData(filtered);
    
    // Calculate progress trends
    calculateProgressTrends(filtered);
  }, [timeRange, performances]);
  
  // Calculate progress trends based on filtered data
  const calculateProgressTrends = (data: PerformanceRecord[]) => {
    if (data.length < 2) {
      setProgressTrends({
        overall: { trendType: 'stable', percentageChange: 0 }
      });
      return;
    }
    
    // Group by subject
    const subjectData: Record<string, PerformanceRecord[]> = {};
    uniqueSubjects.forEach(subject => {
      subjectData[subject as string] = data.filter(p => p.subjectArea === subject)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    
    // Calculate trends for each subject
    const trends: Record<string, any> = {};
    
    // Calculate overall trend
    const sortedByDate = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Group by date and calculate average score for each date
    const scoresByDate: Record<string, { sum: number, count: number }> = {};
    sortedByDate.forEach(perf => {
      const dateStr = new Date(perf.date).toDateString();
      if (!scoresByDate[dateStr]) {
        scoresByDate[dateStr] = { sum: 0, count: 0 };
      }
      if (perf.score !== undefined) {
        scoresByDate[dateStr].sum += perf.score;
        scoresByDate[dateStr].count += 1;
      }
    });
    
    // Convert to array and calculate averages
    const averageScores = Object.entries(scoresByDate)
      .map(([date, data]) => ({ 
        date, 
        averageScore: data.count > 0 ? data.sum / data.count : 0 
      }))
      .filter(item => item.averageScore > 0) // Only include dates with scores
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (averageScores.length >= 2) {
      const firstAvg = averageScores[0].averageScore;
      const lastAvg = averageScores[averageScores.length - 1].averageScore;
      const percentChange = ((lastAvg - firstAvg) / firstAvg) * 100;
      
      trends.overall = {
        trendType: percentChange > 3 ? 'improving' : percentChange < -3 ? 'declining' : 'stable',
        percentageChange: Math.round(percentChange * 10) / 10,
        timeSpan: `${new Date(averageScores[0].date).toLocaleDateString()} - ${new Date(averageScores[averageScores.length - 1].date).toLocaleDateString()}`
      };
    } else {
      trends.overall = { trendType: 'stable', percentageChange: 0 };
    }
    
    // Calculate subject-specific trends
    uniqueSubjects.forEach(subject => {
      const subjectPerformances = subjectData[subject as string];
      
      if (subjectPerformances.length >= 2) {
        const withScores = subjectPerformances.filter(p => p.score !== undefined);
        if (withScores.length >= 2) {
          const first = withScores[0].score || 0;
          const last = withScores[withScores.length - 1].score || 0;
          const percentChange = ((last - first) / first) * 100;
          
          trends[subject as string] = {
            trendType: percentChange > 3 ? 'improving' : percentChange < -3 ? 'declining' : 'stable',
            percentageChange: Math.round(percentChange * 10) / 10,
            timeSpan: `${new Date(withScores[0].date).toLocaleDateString()} - ${new Date(withScores[withScores.length - 1].date).toLocaleDateString()}`
          };
        }
      }
    });
    
    setProgressTrends(trends);
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    if (filteredData.length === 0) return [];
    
    // Group performances by date
    const groupedByDate = filteredData.reduce<Record<string, any>>((acc, performance) => {
      const date = new Date(performance.date).toLocaleDateString();
      
      if (!acc[date]) {
        acc[date] = { date };
      }
      
      // Add or update score for this subject on this date
      if (performance.score !== undefined) {
        acc[date][performance.subjectArea] = performance.score;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    return Object.values(groupedByDate).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  };
  
  const chartData = prepareChartData();
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2 mt-2 md:mt-0">
            <Tabs value={chartType} onValueChange={setChartType} className="w-[180px]">
              <TabsList>
                <TabsTrigger value="line" className="flex items-center">
                  <LineChart className="h-4 w-4 mr-1" />
                  Line
                </TabsTrigger>
                <TabsTrigger value="bar" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Bar
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="quarter">Past Quarter</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length > 0 ? (
          <>
            <div className="h-80 mb-6">
              {chartType === 'line' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip />
                    <Legend />
                    {uniqueSubjects.map((subject) => (
                      <Line
                        key={subject}
                        type="monotone"
                        dataKey={subject}
                        stroke={subjectColors[subject as SubjectArea]}
                        activeDot={{ r: 8 }}
                        name={subject.toString().replace('_', ' ')}
                      />
                    ))}
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip />
                    <Legend />
                    {uniqueSubjects.map((subject) => (
                      <Bar
                        key={subject}
                        dataKey={subject}
                        fill={subjectColors[subject as SubjectArea]}
                        name={subject.toString().replace('_', ' ')}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Performance Trends</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Overall trend */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Overall Progress</h4>
                    {progressTrends.overall && (
                      <div className={`flex items-center text-sm ${
                        progressTrends.overall.trendType === 'improving' 
                          ? 'text-green-500' 
                          : progressTrends.overall.trendType === 'declining'
                            ? 'text-red-500'
                            : 'text-yellow-500'
                      }`}>
                        {progressTrends.overall.trendType === 'improving' && <ArrowUp className="h-4 w-4 mr-1" />}
                        {progressTrends.overall.trendType === 'declining' && <ArrowDown className="h-4 w-4 mr-1" />}
                        {progressTrends.overall.trendType === 'stable' && <Minus className="h-4 w-4 mr-1" />}
                        {progressTrends.overall.percentageChange > 0 ? '+' : ''}{progressTrends.overall.percentageChange}%
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-2 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {progressTrends.overall?.timeSpan || "No trend data available"}
                    </span>
                  </div>
                  
                  <p className="text-sm">
                    {progressTrends.overall?.trendType === 'improving' && 
                      "Your overall academic performance is improving. Keep up the good work!"}
                    {progressTrends.overall?.trendType === 'declining' && 
                      "Your overall performance has declined slightly. Let's focus on improvement strategies."}
                    {progressTrends.overall?.trendType === 'stable' && 
                      "Your overall performance has been consistent. Great job maintaining your standards!"}
                  </p>
                </div>
                
                {/* Subject-specific trends */}
                {uniqueSubjects.map(subject => {
                  const trend = progressTrends[subject as string];
                  if (!trend) return null;
                  
                  return (
                    <div key={subject} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium capitalize">{(subject as string).replace('_', ' ')}</h4>
                        <div className={`flex items-center text-sm ${
                          trend.trendType === 'improving' 
                            ? 'text-green-500' 
                            : trend.trendType === 'declining'
                              ? 'text-red-500'
                              : 'text-yellow-500'
                        }`}>
                          {trend.trendType === 'improving' && <ArrowUp className="h-4 w-4 mr-1" />}
                          {trend.trendType === 'declining' && <ArrowDown className="h-4 w-4 mr-1" />}
                          {trend.trendType === 'stable' && <Minus className="h-4 w-4 mr-1" />}
                          {trend.percentageChange > 0 ? '+' : ''}{trend.percentageChange}%
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{trend.timeSpan}</span>
                      </div>
                      
                      <p className="text-sm">
                        {trend.trendType === 'improving' && 
                          `You've shown great improvement in ${(subject as string).replace('_', ' ')}!`}
                        {trend.trendType === 'declining' && 
                          `Your performance in ${(subject as string).replace('_', ' ')} has decreased. Let's focus on this area.`}
                        {trend.trendType === 'stable' && 
                          `Your performance in ${(subject as string).replace('_', ' ')} has been consistent.`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <p>No performance data available for the selected time period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AcademicProgressTimeline;
