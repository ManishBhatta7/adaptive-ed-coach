
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PerformanceRecord, SubjectArea } from '@/types';

interface FeedbackDisplayProps {
  performance: PerformanceRecord;
}

const FeedbackDisplay = ({ performance }: FeedbackDisplayProps) => {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };
  
  // Helper function to get score color
  const getScoreColor = (score?: number) => {
    if (score === undefined) return 'bg-gray-100 text-gray-800';
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-emerald-100 text-emerald-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{performance.title}</CardTitle>
            <CardDescription>
              <span className="capitalize">{performance.subjectArea.replace('_', ' ')}</span>
              {' • '}
              <span>{formatDate(performance.date)}</span>
            </CardDescription>
          </div>
          {performance.score !== undefined && (
            <Badge className={getScoreColor(performance.score)}>
              Score: {performance.score}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Feedback</h3>
          <div className="bg-gray-50 p-4 rounded-md text-gray-800">
            <p className="whitespace-pre-line">{performance.feedback}</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-md font-medium mb-2 text-green-700">Strengths</h3>
            <ul className="list-disc pl-5 space-y-1">
              {performance.strengths.map((strength, index) => (
                <li key={index} className="text-sm">{strength}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2 text-orange-700">Areas for Improvement</h3>
            <ul className="list-disc pl-5 space-y-1">
              {performance.weaknesses.map((weakness, index) => (
                <li key={index} className="text-sm">{weakness}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-2 text-edu-primary">Recommendations</h3>
          <ul className="list-disc pl-5 space-y-2">
            {performance.recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm">{recommendation}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackDisplay;
