
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface EssayFeedbackProps {
  feedback: {
    overall: string;
    grammar: string;
    structure: string;
    creativity: string;
    scores: {
      clarity: number;
      flow: number;
      expression: number;
    };
    suggestions: string[];
  };
}

const EssayFeedback = ({ feedback }: EssayFeedbackProps) => {
  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🌟';
    if (score >= 80) return '😄';
    if (score >= 70) return '🙂';
    if (score >= 60) return '😐';
    return '🤔';
  };

  const averageScore = Math.round(
    (feedback.scores.clarity + feedback.scores.flow + feedback.scores.expression) / 3
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overall Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-800">{feedback.overall}</p>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center bg-blue-50 p-4 rounded-md">
              <span className="text-4xl mb-2">{getScoreEmoji(feedback.scores.clarity)}</span>
              <span className="text-sm font-medium mb-1">Clarity</span>
              <span className="text-2xl font-bold">{feedback.scores.clarity}%</span>
            </div>
            
            <div className="flex flex-col items-center bg-purple-50 p-4 rounded-md">
              <span className="text-4xl mb-2">{getScoreEmoji(feedback.scores.flow)}</span>
              <span className="text-sm font-medium mb-1">Flow</span>
              <span className="text-2xl font-bold">{feedback.scores.flow}%</span>
            </div>
            
            <div className="flex flex-col items-center bg-green-50 p-4 rounded-md">
              <span className="text-4xl mb-2">{getScoreEmoji(feedback.scores.expression)}</span>
              <span className="text-sm font-medium mb-1">Expression</span>
              <span className="text-2xl font-bold">{feedback.scores.expression}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grammar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{feedback.grammar}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{feedback.structure}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Creativity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{feedback.creativity}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Suggestions for Improvement</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {feedback.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default EssayFeedback;
