import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SubmissionService } from '@/services/SubmissionService';
import { Loader2, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';

interface AggregatedData {
  averageScore: number;
  totalStudents: number;
  commonGaps: { concept: string; count: number }[];
  questionStats: { question: string; failureRate: number }[];
  atRiskStudents: {
    name: string | undefined;
    score: number | undefined;
    id: string;
    weakness: string;
  }[];
}

const ClassAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AggregatedData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const submissions = await SubmissionService.getClassSubmissions();
      if (submissions.length === 0) {
        setLoading(false);
        return;
      }

      // 1. Avg Score
      const totalScore = submissions.reduce((acc, curr) => acc + (curr.score || 0), 0);
      const averageScore = Math.round(totalScore / submissions.length);

      // 2. Gaps
      const conceptMap: Record<string, number> = {};
      submissions.forEach(sub => {
        // Safe optional chaining with typed interface
        const missing = sub.aiFeedback?.missing_concepts || [];
        
        if (Array.isArray(missing)) {
          missing.forEach((concept) => {
            // Ensure concept is a string
            if (typeof concept === 'string') {
              const key = concept.toLowerCase().trim().replace(/[^\w\s]/gi, '');
              if (key) conceptMap[key] = (conceptMap[key] || 0) + 1;
            }
          });
        }
      });

      const commonGaps = Object.entries(conceptMap)
        .map(([concept, count]) => ({ concept, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 3. Question Heatmap
      const questionMap: Record<string, number> = {};
      submissions.forEach(sub => {
        const improvements = sub.aiFeedback?.improvements || [];
        const feedbackLines = sub.aiFeedback?.line_by_line_feedback || [];
        
        if (Array.isArray(improvements) && Array.isArray(feedbackLines)) {
          const combinedText = [...improvements, ...feedbackLines].join(' ');
          const matches = combinedText.match(/Q\d+|Question\s+\d+/gi);
          if (matches) {
            const uniqueQs = [...new Set(matches.map(m => m.toUpperCase().replace('QUESTION', 'Q').replace(/\s/g, '')))];
            uniqueQs.forEach(q => {
              questionMap[q] = (questionMap[q] || 0) + 1;
            });
          }
        }
      });

      const questionStats = Object.entries(questionMap)
        .map(([question, count]) => ({ 
          question, 
          failureRate: Math.round((count / submissions.length) * 100) 
        }))
        .sort((a, b) => b.failureRate - a.failureRate)
        .slice(0, 4);

      // 4. At Risk
      const atRiskStudents = submissions
        .filter(s => (s.score || 0) < 60)
        .map(s => ({
          name: s.studentName,
          score: s.score,
          id: s.id,
          weakness: s.aiFeedback?.missing_concepts?.[0] || 'General Revision'
        }));

      setData({
        averageScore,
        totalStudents: submissions.length,
        commonGaps,
        questionStats,
        atRiskStudents
      });

    } catch (error) {
      console.error("Analytics Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-edu-primary"/></div>;
  }

  if (!data) {
    return <div className="text-center p-8 text-gray-500">No graded submissions found yet.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              Across {data.totalStudents} submissions
            </p>
            <Progress value={data.averageScore} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Concept Gap</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold capitalize truncate">
              {data.commonGaps[0]?.concept || "None Detected"}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.commonGaps[0] ? `${Math.round((data.commonGaps[0].count / data.totalStudents) * 100)}% of class missed this` : "Good job!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students At Risk</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.atRiskStudents.length}</div>
            <p className="text-xs text-muted-foreground">
              Need intervention (Score &lt; 60%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most Common Missing Concepts</CardTitle>
            <CardDescription>Topics the AI identified as weak points.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.commonGaps.map((gap, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none capitalize">{gap.concept}</p>
                  <p className="text-xs text-muted-foreground">
                    Missed by {gap.count} students
                  </p>
                </div>
                <div className="flex items-center font-medium">
                  {Math.round((gap.count / data.totalStudents) * 100)}%
                </div>
              </div>
            ))}
            {data.commonGaps.length === 0 && <p className="text-sm text-gray-500">No consistent gaps found.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hardest Questions</CardTitle>
            <CardDescription>Questions with the highest error rate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.questionStats.map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stat.question}</span>
                  <span className="text-muted-foreground">{stat.failureRate}% Failure Rate</span>
                </div>
                <Progress value={stat.failureRate} className="h-2 bg-gray-100 [&>div]:bg-red-500" />
              </div>
            ))}
            {data.questionStats.length === 0 && (
              <div className="text-sm text-gray-500">No specific question patterns detected yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClassAnalytics;