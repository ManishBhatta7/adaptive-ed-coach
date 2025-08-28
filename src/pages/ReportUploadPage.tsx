
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ReportUploadPage = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { currentUser, isAuthenticated } = state;
  const { toast } = useToast();
  
  const [reportImage, setReportImage] = useState<File | null>(null);
  const [reportImageUrl, setReportImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.match('image.*')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file (JPEG, PNG)',
          variant: 'destructive'
        });
        return;
      }
      
      // Check file size (max 5MB)
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
      setExtractedData(null);
    }
  };
  
  const processReport = async () => {
    if (!reportImage) return;
    
    setIsProcessing(true);
    setProgressValue(0);
    
    // Simulate OCR processing with progress updates
    const simulateProgress = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        
        setProgressValue(Math.round(progress));
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Simulate OCR results
          setTimeout(() => {
            const mockResults = generateMockOCRResults();
            setExtractedData(mockResults);
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
    
    // Start simulated processing
    simulateProgress();
  };
  
  // Helper function to generate mock OCR results
  const generateMockOCRResults = () => {
    const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Art'];
    const results: Record<string, any> = {
      studentName: currentUser?.name || 'Student',
      schoolName: 'Springfield Elementary School',
      grade: '5',
      term: 'Spring 2025',
      subjects: {}
    };
    
    // Generate random grades for each subject
    subjects.forEach(subject => {
      const grade = Math.floor(Math.random() * 41) + 60; // 60-100
      const letterGrade = getLetterGrade(grade);
      
      results.subjects[subject] = {
        score: grade,
        letterGrade,
        comments: getRandomComment(subject, grade)
      };
    });
    
    // Calculate GPA
    const scores = Object.values(results.subjects).map((subject: any) => subject.score);
    results.gpa = (scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length).toFixed(1);
    
    return results;
  };
  
  // Helper function to get letter grade from numerical grade
  const getLetterGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };
  
  // Helper function to get random comment based on subject and score
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
  
  const saveResults = () => {
    // In a real app, this would save the data to the user's profile
    toast({
      title: 'Results saved',
      description: 'Report data has been saved to your profile',
      variant: 'default'
    });
    
    navigate('/dashboard');
  };
  
  return (
    <MainLayout>
      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Report Card Analysis</h1>
            <p className="text-gray-600 mt-2">
              Upload a photo of your report card to automatically extract and analyze your grades
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
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
                
                {reportImage && !isProcessing && !extractedData && (
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
            
            <div>
              {extractedData ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Extracted Report Data</CardTitle>
                    <CardDescription>
                      Results extracted from your report card
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Student: {extractedData.studentName}</p>
                      <p className="text-sm">School: {extractedData.schoolName}</p>
                      <p className="text-sm">Grade: {extractedData.grade}</p>
                      <p className="text-sm">Term: {extractedData.term}</p>
                      <p className="text-sm font-medium">Overall GPA: {extractedData.gpa}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-md font-medium">Subject Grades</h3>
                      
                      {Object.entries(extractedData.subjects).map(([subject, data]: [string, any]) => (
                        <div key={subject} className="p-3 border rounded-md">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{subject}</span>
                            <span className="font-medium">{data.letterGrade} ({data.score}%)</span>
                          </div>
                          <Progress value={data.score} className="h-2 mb-2" />
                          <p className="text-xs text-gray-600 italic">"{data.comments}"</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-edu-primary/10 p-4 rounded-md">
                      <h3 className="font-medium mb-2 text-edu-primary">AI Analysis & Recommendations</h3>
                      <p className="text-sm mb-3">
                        Based on your grades, we recommend focusing on {getLowestSubject(extractedData)} to improve your overall performance.
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
              ) : (
                <Alert className="h-full flex flex-col justify-center text-center">
                  <AlertTitle className="text-center">No data extracted yet</AlertTitle>
                  <AlertDescription className="text-center">
                    Upload and process a report card image to see the extracted data here
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

// Helper function to find the subject with the lowest score
const getLowestSubject = (data: Record<string, any>) => {
  let lowestSubject = '';
  let lowestScore = 100;
  
  Object.entries(data.subjects).forEach(([subject, data]: [string, any]) => {
    if (data.score < lowestScore) {
      lowestScore = data.score;
      lowestSubject = subject;
    }
  });
  
  return lowestSubject;
};

export default ReportUploadPage;
