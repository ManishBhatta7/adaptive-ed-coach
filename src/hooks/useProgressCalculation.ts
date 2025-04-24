
import { useState, useEffect } from 'react';
import { PerformanceRecord, SubjectArea } from '@/types';

export const useProgressCalculation = (performances: PerformanceRecord[], timeRange: string) => {
  const [filteredData, setFilteredData] = useState<PerformanceRecord[]>([]);
  const [progressTrends, setProgressTrends] = useState<Record<string, any>>({});
  const [chartData, setChartData] = useState<any[]>([]);

  // Filter data based on time range
  useEffect(() => {
    const now = new Date();
    let filterDate = new Date();
    
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
        filterDate = new Date(0);
    }
    
    const filtered = performances.filter(p => new Date(p.date) >= filterDate);
    setFilteredData(filtered);
    calculateProgressTrends(filtered);
    prepareChartData(filtered);
  }, [timeRange, performances]);

  const calculateProgressTrends = (data: PerformanceRecord[]) => {
    if (data.length < 2) {
      setProgressTrends({
        overall: { trendType: 'stable', percentageChange: 0 }
      });
      return;
    }

    const uniqueSubjects = Array.from(new Set(data.map(p => p.subjectArea)));
    const subjectData: Record<string, PerformanceRecord[]> = {};
    
    uniqueSubjects.forEach(subject => {
      subjectData[subject as string] = data.filter(p => p.subjectArea === subject)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    const trends: Record<string, any> = {};
    
    // Calculate overall trend
    const sortedByDate = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

    const averageScores = Object.entries(scoresByDate)
      .map(([date, data]) => ({ 
        date, 
        averageScore: data.count > 0 ? data.sum / data.count : 0 
      }))
      .filter(item => item.averageScore > 0)
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

  const prepareChartData = (data: PerformanceRecord[]) => {
    if (data.length === 0) {
      setChartData([]);
      return;
    }

    const groupedByDate = data.reduce<Record<string, any>>((acc, performance) => {
      const date = new Date(performance.date).toLocaleDateString();
      
      if (!acc[date]) {
        acc[date] = { date };
      }
      
      if (performance.score !== undefined) {
        acc[date][performance.subjectArea] = performance.score;
      }
      
      return acc;
    }, {});

    const sortedData = Object.values(groupedByDate).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    setChartData(sortedData);
  };

  return {
    filteredData,
    progressTrends,
    chartData
  };
};
