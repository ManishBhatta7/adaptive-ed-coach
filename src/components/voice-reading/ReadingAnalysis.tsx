
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ReadingAnalysisProps {
  analysis: {
    fluency: number;
    pronunciation: number;
    expression: number;
    feedback: string;
  };
  transcription: string;
}

const ReadingAnalysis = ({ analysis, transcription }: ReadingAnalysisProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Reading Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Fluency</span>
              <span className="text-sm font-medium">{analysis.fluency}%</span>
            </div>
            <Progress value={analysis.fluency} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Pronunciation</span>
              <span className="text-sm font-medium">{analysis.pronunciation}%</span>
            </div>
            <Progress value={analysis.pronunciation} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Expression</span>
              <span className="text-sm font-medium">{analysis.expression}%</span>
            </div>
            <Progress value={analysis.expression} className="h-2" />
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium mb-2">AI Feedback</h3>
          <p className="text-gray-800">{analysis.feedback}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium mb-2">Your Reading</h3>
          <p className="text-gray-800 italic">"{transcription}"</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadingAnalysis;
