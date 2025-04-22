
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

interface ReportResultsProps {
  data: Record<string, any> | null;
}

const ReportResults = ({ data }: ReportResultsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!data) {
    return (
      <Alert className="h-full flex flex-col justify-center text-center">
        <AlertTitle className="text-center">No data extracted yet</AlertTitle>
        <AlertDescription className="text-center">
          Upload and process a report card image to see the extracted data here
        </AlertDescription>
      </Alert>
    );
  }

  const getLowestSubject = () => {
    let lowestSubject = '';
    let lowestScore = 100;
    
    Object.entries(data.subjects).forEach(([subject, subjectData]: [string, any]) => {
      if (subjectData.score < lowestScore) {
        lowestScore = subjectData.score;
        lowestSubject = subject;
      }
    });
    
    return lowestSubject;
  };

  const saveResults = () => {
    toast({
      title: 'Results saved',
      description: 'Report data has been saved to your profile',
      variant: 'default'
    });
    
    navigate('/dashboard');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Report Data</CardTitle>
        <CardDescription>
          Results extracted from your report card
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Student: {data.studentName}</p>
          <p className="text-sm">School: {data.schoolName}</p>
          <p className="text-sm">Grade: {data.grade}</p>
          <p className="text-sm">Term: {data.term}</p>
          <p className="text-sm font-medium">Overall GPA: {data.gpa}</p>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-md font-medium">Subject Grades</h3>
          
          {Object.entries(data.subjects).map(([subject, subjectData]: [string, any]) => (
            <div key={subject} className="p-3 border rounded-md">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{subject}</span>
                <span className="font-medium">
                  {subjectData.letterGrade} ({subjectData.score}%)
                </span>
              </div>
              <Progress value={subjectData.score} className="h-2 mb-2" />
              <p className="text-xs text-gray-600 italic">"{subjectData.comments}"</p>
            </div>
          ))}
        </div>
        
        <div className="bg-edu-primary/10 p-4 rounded-md">
          <h3 className="font-medium mb-2 text-edu-primary">AI Analysis & Recommendations</h3>
          <p className="text-sm mb-3">
            Based on your grades, we recommend focusing on {getLowestSubject()} to improve your overall performance.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li className="text-sm">Schedule dedicated study time for challenging subjects</li>
            <li className="text-sm">Consider utilizing our AI tutoring for areas needing improvement</li>
            <li className="text-sm">Practice regularly with our subject-specific exercises</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={saveResults}>
          Save Results to My Profile
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReportResults;
