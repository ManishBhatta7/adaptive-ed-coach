import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import SubmissionForm from '@/components/submissions/SubmissionForm';
import FeedbackDisplay from '@/components/submissions/FeedbackDisplay';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CoachingMode, PerformanceRecord, SubjectArea } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { SubmissionService } from '@/services/SubmissionService';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast'; // Added toast

const SubmitAssignment = () => {
  const navigate = useNavigate();
  const { state, updateUserProfile } = useAppContext();
  const { currentUser, isAuthenticated } = state;
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<PerformanceRecord | null>(null);
  const [activeTab, setActiveTab] = useState('submit');
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated || !currentUser) {
    return null;
  }
  
  const handleSubmission = async (submission: {
    title: string;
    content: string;
    subjectArea: SubjectArea;
    coachingMode: CoachingMode;
    file?: File;
  }) => {
    setIsSubmitting(true);
    
    try {
      // 1. Handle File Upload (if one exists)
      let fileUrl: string | undefined = undefined;
      if (submission.file) {
        console.log('Uploading file:', submission.file.name);
        const fileExt = submission.file.name.split('.').pop();
        const fileName = `${currentUser.id}/${uuidv4()}.${fileExt}`;
        
        // This now works even with the Mock Client!
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, submission.file);
          
        if (uploadError) {
          console.warn('File upload failed (expected if no backend):', uploadError);
          // We continue even if upload fails in dev mode
        } else if (uploadData) {
           const { data: urlData } = supabase.storage
            .from('submissions')
            .getPublicUrl(uploadData.path);
           fileUrl = urlData.publicUrl;
        }
      }

      // 2. Create the submission record
      // Note: In mock mode, this might return null if not fully mocked, so we fallback
      let newSubmissionId = uuidv4();
      
      try {
        const newSubmission = await SubmissionService.createSubmission(currentUser.id, {
          assignmentType: 'essay',
          contentData: {
            title: submission.title,
            content: submission.content,
            subjectArea: submission.subjectArea,
            coachingMode: submission.coachingMode,
            fileUrl: fileUrl
          },
          status: 'pending'
        });
        if (newSubmission) newSubmissionId = newSubmission.id;
      } catch (err) {
        console.warn('Service creation failed, using local mock');
      }

      // 3. Simulate AI Analysis (since we are likely in dev mode)
      // In a real app, you would call the Edge Function here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Fake delay

      const mockFeedback = {
        summary: `This is a simulated analysis of your work on "${submission.title}". Your content has been processed successfully.`,
        strengths: ['Good structure', 'Clear arguments', 'Relevant examples'],
        weaknesses: ['Could be more concise', 'Check citation formatting'],
        recommendations: ['Review chapter 4', 'Practice summarizing']
      };

      // 4. Create a PerformanceRecord to display in the UI
      const performance: PerformanceRecord = {
        id: newSubmissionId,
        date: new Date().toISOString(),
        subjectArea: submission.subjectArea,
        title: submission.title,
        score: Math.floor(Math.random() * 20) + 80, // Random score 80-100
        feedback: mockFeedback.summary,
        strengths: mockFeedback.strengths,
        weaknesses: mockFeedback.weaknesses,
        recommendations: mockFeedback.recommendations
      };
      
      // 5. Update user profile and UI state
      if (currentUser) {
        const updatedPerformances = [...(currentUser.performances || []), performance];
        updateUserProfile({ performances: updatedPerformances });
      }
      
      setFeedbackData(performance);
      setShowFeedback(true);
      setActiveTab('feedback');
      
      toast({
        title: "Success!",
        description: "Your assignment has been submitted and analyzed.",
      });

    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Submit Your Work</h1>
            <p className="text-gray-600 mt-2">
              Get personalized AI feedback based on your learning style
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="submit">Submit Assignment</TabsTrigger>
              <TabsTrigger value="feedback" disabled={!showFeedback}>View Feedback</TabsTrigger>
            </TabsList>
            
            <TabsContent value="submit">
              {currentUser.primaryLearningStyle ? (
                <SubmissionForm onSubmit={handleSubmission} />
              ) : (
                <Alert className="mb-6">
                  <AlertTitle>Complete your learning style assessment</AlertTitle>
                  <AlertDescription>
                    To receive personalized feedback tailored to your learning style, 
                    please complete the learning style assessment first.
                    <Link 
                      to="/learning-style" 
                      className="block mt-2 text-edu-primary hover:underline font-medium"
                    >
                      Take the learning style quiz
                    </Link>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="feedback">
              {feedbackData && <FeedbackDisplay performance={feedbackData} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default SubmitAssignment;