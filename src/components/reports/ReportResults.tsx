import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Lightbulb, Target, Clock } from 'lucide-react';
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
  
  // Helper for recommendation icons based on "type"
  const getIconForType = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'immediate': return <Target className="h-4 w-4 text-red-500" />;
      case 'habit': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'strategic': return <Lightbulb className="h-4 w-4 text-amber-500" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-500" />;
    }
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
    <Card className="w-full max-w-4xl mx-auto">
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
        
        {/* FIX: Enhanced Actionable Insights Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <h3 className="flex items-center gap-2 font-semibold text-lg text-blue-900 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Strategic Action Plan
          </h3>
          
          <div className="grid gap-4">
            {data.recommendations && data.recommendations.length > 0 ? (
              data.recommendations.map((rec: any, index: number) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 flex gap-4 items-start">
                  <div className="mt-1 p-2 bg-gray-50 rounded-full">
                    {getIconForType(rec.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs font-normal border-blue-200 text-blue-700 bg-blue-50">
                        {rec.type || 'Insight'}
                      </Badge>
                      <h4 className="font-semibold text-gray-900">{rec.title || 'Recommendation'}</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {rec.action || (typeof rec === 'string' ? rec : 'Review this area.')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No specific recommendations generated.</p>
            )}
          </div>
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
      </CardContent>
      <CardFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
        <Button className="w-full flex-1" onClick={saveResults}>
          Save Results to My Profile
        </Button>
        <div className="w-full flex-1">
          <PdfReportGenerator
            studentName={data.studentName || 'Student'}
            data={data}
            reportType="report-card"
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default ReportResults;