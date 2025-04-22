
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface AnswerSheetFeedbackProps {
  feedback: {
    content: string[];
    completed: boolean;
    score: number;
    strengths: string[];
    improvements: string[];
  };
}

const AnswerSheetFeedback = ({ feedback }: AnswerSheetFeedbackProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🎯';
    if (score >= 80) return '🌟';
    if (score >= 70) return '👍';
    if (score >= 60) return '🙂';
    return '🤔';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-md">
            {feedback.content.map((part, index) => (
              <p key={index} className="mb-3">{part}</p>
            ))}
            
            {!feedback.completed && (
              <div className="flex items-center mt-4">
                <div className="animate-pulse flex space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                </div>
                <span className="ml-2 text-gray-500 text-sm">AI is analyzing your answer...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {feedback.completed && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Score Assessment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                <div className={`text-6xl font-bold ${getScoreColor(feedback.score)}`}>
                  {feedback.score}
                </div>
                <div className="absolute top-0 right-0 text-5xl">
                  {getScoreEmoji(feedback.score)}
                </div>
              </div>
              
              <div className="w-full">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Score</span>
                  <span className="text-sm font-medium">{feedback.score}/100</span>
                </div>
                <Progress value={feedback.score} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-amber-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AnswerSheetFeedback;
