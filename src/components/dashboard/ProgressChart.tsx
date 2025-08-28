
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceRecord, SubjectArea } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ProgressChartProps {
  performances: PerformanceRecord[];
  title?: string;
  description?: string;
}

// Subject area colors for the chart
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

const ProgressChart = ({ 
  performances, 
  title = "Progress Over Time", 
  description = "Track your performance across different subjects"
}: ProgressChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    // Group performances by date
    const groupedByDate = (performances || []).reduce<Record<string, any>>((acc, performance) => {
      const date = new Date(performance.date).toLocaleDateString();
      
      if (!acc[date]) {
        acc[date] = { date };
      }
      
      // Add or update score for this subject on this date
      acc[date][performance.subjectArea] = performance.score || 0;
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    const sortedData = Object.values(groupedByDate).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    setChartData(sortedData);
  }, [performances]);

  // Get unique subject areas in the performance data
  const uniqueSubjects = Array.from(
    new Set((performances || []).map(p => p.subjectArea))
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {(performances || []).length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {uniqueSubjects.map((subject) => (
                  <Line
                    key={subject}
                    type="monotone"
                    dataKey={subject}
                    stroke={subjectColors[subject as SubjectArea]}
                    activeDot={{ r: 8 }}
                    name={subject.toString()}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>No performance data available yet. Complete assignments to see your progress.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
