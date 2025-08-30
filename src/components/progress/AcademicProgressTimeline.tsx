
import { useState } from 'react';
import { PerformanceRecord, SubjectArea } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, BarChart3 } from 'lucide-react';
import ProgressChart from './ProgressChart';
import ProgressTrendCard from './ProgressTrendCard';
import { useProgressCalculation } from '@/hooks/useProgressCalculation';

interface AcademicProgressTimelineProps {
  performances: PerformanceRecord[];
  title?: string;
  description?: string;
}

// Subject area colors
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

const AcademicProgressTimeline = ({ 
  performances, 
  title = "Academic Progress Timeline", 
  description = "Track and analyze your academic progress over time"
}: AcademicProgressTimelineProps) => {
  const [timeRange, setTimeRange] = useState<string>('all');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  
  const { filteredData, progressTrends, chartData } = useProgressCalculation(performances, timeRange);
  
  // Get unique subject areas in the performance data
  const uniqueSubjects = Array.from(
    new Set(performances.map(p => p.subjectArea))
  );
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2 mt-2 md:mt-0">
            <Tabs value={chartType} onValueChange={(value) => setChartType(value as 'line' | 'bar')} className="w-[180px]">
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
              <ProgressChart
                data={chartData}
                uniqueSubjects={uniqueSubjects}
                type={chartType}
                subjectColors={subjectColors}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Performance Trends</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ProgressTrendCard
                  title="Overall Progress"
                  trend={progressTrends.overall || { trendType: 'stable', percentageChange: 0, timeSpan: 'No trend data available' }}
                />
                {uniqueSubjects.map(subject => {
                  const trend = progressTrends[subject as string];
                  if (!trend) return null;
                  return (
                    <ProgressTrendCard
                      key={subject}
                      title={subject as string}
                      trend={trend}
                    />
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
