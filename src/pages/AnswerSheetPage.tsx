
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import AnswerSheetFeedback from '@/components/answer-sheet/AnswerSheetFeedback';
import AnswerSheetUploader from '@/components/answer-sheet/AnswerSheetUploader';
import { SubmissionService } from '@/services/SubmissionService';

const AnswerSheetPage = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { isAuthenticated, currentUser } = state;
  const { toast } = useToast();
  
  const [extractedText, setExtractedText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    content: string[];
    completed: boolean;
    score: number;
    strengths: string[];
    improvements: string[];
  } | null>(null);
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleTextExtracted = async (text: string, imgUrl: string) => {
    if (!currentUser) return;

    setExtractedText(text);
    setImageUrl(imgUrl);
    setIsAnalyzing(true);

    try {
      // Create submission record
      const submission = await SubmissionService.createSubmission(
        currentUser.id,
        {
          assignmentType: 'answer_sheet',
          contentData: {
            extractedText: text,
            imageUrl: imgUrl
          }
        }
      );

      if (!submission) {
        throw new Error('Failed to create submission record');
      }

      setSubmissionId(submission.id);

      // Start AI analysis
      const analysisResult = await SubmissionService.analyzeSubmission(
        submission.id,
        text,
        'General', // Could be made configurable
        'answer_sheet'
      );

      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'Analysis failed');
      }

      const analysis = analysisResult.analysis;
      
      // Convert analysis to feedback format
      setFeedback({
        content: [analysis.overall_feedback || 'Analysis completed'],
        completed: true,
        score: analysis.score || 0,
        strengths: analysis.strengths || analysis.correct_concepts || [],
        improvements: analysis.improvements || analysis.errors || []
      });

      toast({
        title: 'Analysis Complete',
        description: 'Your answer sheet has been analyzed successfully',
      });

    } catch (error) {
      console.error('Error analyzing submission:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze your submission',
        variant: 'destructive',
      });

      // Show basic feedback as fallback
      setFeedback({
        content: ['Unable to complete full analysis. Please try again.'],
        completed: true,
        score: 0,
        strengths: ['Submission received'],
        improvements: ['Try uploading a clearer image']
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProcessingStart = () => {
    setFeedback(null);
    setExtractedText('');
    setSubmissionId(null);
  };

  const resetAll = () => {
    setExtractedText('');
    setImageUrl('');
    setFeedback(null);
    setSubmissionId(null);
    setIsAnalyzing(false);
  };

  return (
    <MainLayout>
      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Answer Sheet Feedback</h1>
            <p className="text-gray-600 mt-2">
              Upload your handwritten answer and get detailed AI feedback
            </p>
          </div>
          
          <Tabs defaultValue={feedback ? "feedback" : "upload"}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upload">Upload Answer</TabsTrigger>
              <TabsTrigger value="feedback" disabled={!feedback}>AI Feedback</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <AnswerSheetUploader 
                onTextExtracted={handleTextExtracted}
                onProcessingStart={handleProcessingStart}
              />
              
              {extractedText && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Extracted Text</CardTitle>
                    <CardDescription>
                      The text extracted from your handwritten answer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line max-h-64 overflow-y-auto">
                      {extractedText}
                    </div>
                  </CardContent>
                </Card>
              )}

              {isAnalyzing && (
                <Card className="mt-6">
                  <CardContent className="py-6">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                      <span>Analyzing your answer with AI...</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="feedback">
              {feedback && (
                <AnswerSheetFeedback feedback={feedback} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default AnswerSheetPage;
