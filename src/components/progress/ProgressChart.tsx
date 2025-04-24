
import { BarChart, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Bar } from 'recharts';
import { SubjectArea } from '@/types';

interface ChartData {
  date: string;
  [key: string]: any;
}

interface ProgressChartProps {
  data: ChartData[];
  uniqueSubjects: SubjectArea[];
  type: 'line' | 'bar';
  subjectColors: Record<SubjectArea, string>;
}

const ProgressChart = ({ data, uniqueSubjects, type, subjectColors }: ProgressChartProps) => {
  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
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
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
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
  );
};

export default ProgressChart;
