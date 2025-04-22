
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Download } from 'lucide-react';
import PdfReportGenerator from './PdfReportGenerator';
import { supabase } from '@/lib/supabase';

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
    if (!data.subjects || Object.keys(data.subjects).length === 0) {
      return 'subjects needing improvement';
    }
    
    let lowestSubject = '';
    let lowestScore = 100;
    
    Object.entries(data.subjects).forEach(([subject, subjectData]: [string, any]) => {
      const score = typeof subjectData.score === 'number' ? subjectData.score : 
                    typeof subjectData.score === 'string' ? parseFloat(subjectData.score) : 0;
                    
      if (score < lowestScore) {
        lowestScore = score;
        lowestSubject = subject;
      }
    });
    
    return lowestSubject || 'subjects needing improvement';
  };

  const saveResults = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Save the analysis to the user's profile in the database
      const { error } = await supabase
        .from('student_performance')
        .insert({
          user_id: userId,
          type: 'report_card',
          data: data,
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: 'Results saved',
        description: 'Report data has been saved to your profile',
        variant: 'default'
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving results:', error);
      
      toast({
        title: 'Save Error',
        description: 'Unable to save results to your profile',
        variant: 'destructive'
      });
    }
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
        {data.reportUrl && (
          <div className="mb-4">
            <img 
              src={data.reportUrl} 
              alt="Stored Report Card" 
              className="max-h-32 mx-auto object-contain rounded-md shadow-sm border border-gray-200" 
            />
          </div>
        )}
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Student: {data.studentName || 'Not detected'}</p>
          <p className="text-sm">School: {data.schoolName || 'Not detected'}</p>
          <p className="text-sm">Grade: {data.grade || 'Not detected'}</p>
          <p className="text-sm">Term: {data.term || 'Not detected'}</p>
          <p className="text-sm font-medium">Overall GPA: {data.gpa || 'Not detected'}</p>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-md font-medium">Subject Grades</h3>
          
          {data.subjects && Object.keys(data.subjects).length > 0 ? (
            Object.entries(data.subjects).map(([subject, subjectData]: [string, any]) => (
              <div key={subject} className="p-3 border rounded-md">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{subject}</span>
                  <span className="font-medium">
                    {subjectData.letterGrade || 'N/A'} 
                    {subjectData.score ? ` (${subjectData.score}%)` : ''}
                  </span>
                </div>
                <Progress 
                  value={typeof subjectData.score === 'number' ? subjectData.score : 
                         typeof subjectData.score === 'string' ? parseFloat(subjectData.score) : 0} 
                  className="h-2 mb-2" 
                />
                {subjectData.comments && (
                  <p className="text-xs text-gray-600 italic">"{subjectData.comments}"</p>
                )}
              </div>
            ))
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                No subject data could be extracted. Try uploading a clearer image.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="bg-edu-primary/10 p-4 rounded-md">
          <h3 className="font-medium mb-2 text-edu-primary">AI Analysis & Recommendations</h3>
          <p className="text-sm mb-3">
            Based on your grades, we recommend focusing on {getLowestSubject()} to improve your overall performance.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            {data.recommendations && data.recommendations.length > 0 ? (
              data.recommendations.map((recommendation: string, index: number) => (
                <li key={index} className="text-sm">{recommendation}</li>
              ))
            ) : (
              <>
                <li className="text-sm">Schedule dedicated study time for challenging subjects</li>
                <li className="text-sm">Consider utilizing our AI tutoring for areas needing improvement</li>
                <li className="text-sm">Practice regularly with our subject-specific exercises</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex-col space-y-2">
        <Button className="w-full" onClick={saveResults}>
          Save Results to My Profile
        </Button>
        <PdfReportGenerator
          studentName={data.studentName || 'Student'}
          data={data}
          reportType="report-card"
        />
      </CardFooter>
    </Card>
  );
};

export default ReportResults;
