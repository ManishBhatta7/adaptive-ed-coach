
import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

interface ReportUploaderProps {
  onProcessComplete: (data: Record<string, any>) => void;
}

const ReportUploader = ({ onProcessComplete }: ReportUploaderProps) => {
  const { toast } = useToast();
  const [reportImage, setReportImage] = useState<File | null>(null);
  const [reportImageUrl, setReportImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.match('image.*')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file (JPEG, PNG)',
          variant: 'destructive'
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 5MB',
          variant: 'destructive'
        });
        return;
      }
      
      setReportImage(file);
      setReportImageUrl(URL.createObjectURL(file));
    }
  };
  
  const processReport = async () => {
    if (!reportImage) return;
    
    setIsProcessing(true);
    setProgressValue(0);
    
    const simulateProgress = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        
        setProgressValue(Math.round(progress));
        
        if (progress >= 100) {
          clearInterval(interval);
          
          setTimeout(() => {
            const mockResults = generateMockResults();
            onProcessComplete(mockResults);
            setIsProcessing(false);
            
            toast({
              title: 'Report processed',
              description: 'Your report has been successfully analyzed',
              variant: 'default'
            });
          }, 500);
        }
      }, 500);
    };
    
    simulateProgress();
  };
  
  const generateMockResults = () => {
    const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Art'];
    const results: Record<string, any> = {
      studentName: 'Student',
      schoolName: 'Springfield Elementary School',
      grade: '5',
      term: 'Spring 2025',
      subjects: {}
    };
    
    subjects.forEach(subject => {
      const grade = Math.floor(Math.random() * 41) + 60;
      const letterGrade = getLetterGrade(grade);
      
      results.subjects[subject] = {
        score: grade,
        letterGrade,
        comments: getRandomComment(subject, grade)
      };
    });
    
    const scores = Object.values(results.subjects).map((subject: any) => subject.score);
    results.gpa = (scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length).toFixed(1);
    
    return results;
  };
  
  const getLetterGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };
  
  const getRandomComment = (subject: string, score: number) => {
    const excellentComments = [
      'Excellent work! Shows great understanding of the material.',
      'Outstanding performance. Consistently exceeds expectations.',
      'Demonstrates exceptional skills and knowledge in this area.'
    ];
    
    const goodComments = [
      'Good work. Shows solid understanding of key concepts.',
      'Consistent performance. Meets all expectations.',
      'Shows strong effort and good grasp of the material.'
    ];
    
    const averageComments = [
      'Satisfactory work. Basic understanding of the material.',
      'Meeting basic requirements. More practice would be beneficial.',
      'Shows effort but needs to strengthen understanding of concepts.'
    ];
    
    const needsImprovementComments = [
      'Needs improvement. Struggles with key concepts.',
      'Additional practice and support needed in this area.',
      'Showing effort but requires more focused attention.'
    ];
    
    if (score >= 90) return excellentComments[Math.floor(Math.random() * excellentComments.length)];
    if (score >= 80) return goodComments[Math.floor(Math.random() * goodComments.length)];
    if (score >= 70) return averageComments[Math.floor(Math.random() * averageComments.length)];
    return needsImprovementComments[Math.floor(Math.random() * needsImprovementComments.length)];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Report Card</CardTitle>
        <CardDescription>
          Take a clear photo of your report card or upload an existing image
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
          {reportImageUrl ? (
            <div className="w-full">
              <img 
                src={reportImageUrl} 
                alt="Report Card Preview" 
                className="max-h-64 mx-auto object-contain rounded-md shadow-sm" 
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-4"
                onClick={() => {
                  setReportImage(null);
                  setReportImageUrl(null);
                }}
              >
                Remove image
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 text-center mb-2">
                Drag and drop your image here, or click to browse
              </p>
              <p className="text-xs text-gray-400 text-center mb-4">
                Supports JPEG, PNG • Max size 5MB
              </p>
              <Button
                variant="outline"
                onClick={() => document.getElementById('report-upload')?.click()}
              >
                Select File
              </Button>
            </>
          )}
          <input
            id="report-upload"
            type="file"
            className="hidden"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
          />
        </div>
        
        {reportImage && !isProcessing && (
          <Button 
            className="w-full" 
            onClick={processReport}
          >
            Process Report Card
          </Button>
        )}
        
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing...</span>
              <span>{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
            <p className="text-xs text-center text-gray-500 mt-2">
              Our AI is analyzing your report card
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportUploader;
