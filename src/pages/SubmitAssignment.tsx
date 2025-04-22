
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import SubmissionForm from '@/components/submissions/SubmissionForm';
import FeedbackDisplay from '@/components/submissions/FeedbackDisplay';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CoachingMode, PerformanceRecord, SubjectArea } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const SubmitAssignment = () => {
  const navigate = useNavigate();
  const { state, updateUserProfile } = useAppContext();
  const { currentUser, isAuthenticated } = state;
  
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
      // In a real implementation, this would call an API to process the submission
      // For now, we'll simulate the AI response
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create sample feedback based on the submission
      const performance: PerformanceRecord = {
        id: uuidv4(),
        date: new Date().toISOString(),
        subjectArea: submission.subjectArea,
        title: submission.title,
        score: Math.floor(Math.random() * 31) + 70, // Random score between 70-100
        feedback: generateFeedback(submission),
        strengths: generateStrengths(submission),
        weaknesses: generateWeaknesses(submission),
        recommendations: generateRecommendations(submission)
      };
      
      // Update user profile with the new performance record
      if (currentUser) {
        const updatedPerformances = [...currentUser.performances, performance];
        updateUserProfile({ performances: updatedPerformances });
      }
      
      setFeedbackData(performance);
      setShowFeedback(true);
      setActiveTab('feedback');
    } catch (error) {
      console.error('Error submitting assignment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper functions to generate simulated feedback
  const generateFeedback = (submission: any) => {
    const feedbackTemplates = [
      `Your submission demonstrates a good understanding of the core concepts. Your approach to ${submission.title.toLowerCase()} shows thoughtful consideration of the main ideas, though there are some areas that could be expanded upon. The structure is clear and logical, making it easy to follow your thinking process.`,
      `You've made a solid attempt at addressing the assignment requirements. Your analysis of ${submission.title.toLowerCase()} includes some insightful observations, but could benefit from more specific examples to support your claims. Your writing style is clear and concise.`,
      `This is a well-structured response that effectively addresses the key points related to ${submission.title.toLowerCase()}. You've shown good critical thinking skills in your approach, though some of your arguments could be developed further with additional evidence.`
    ];
    
    return feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];
  };
  
  const generateStrengths = (submission: any) => {
    const strengths = [
      `Clear and logical organization of ideas`,
      `Strong understanding of core concepts`,
      `Effective use of specific examples`,
      `Well-developed main arguments`,
      `Appropriate use of terminology`,
      `Thoughtful analysis of key points`
    ];
    
    // Select 3 random strengths
    return strengths.sort(() => 0.5 - Math.random()).slice(0, 3);
  };
  
  const generateWeaknesses = (submission: any) => {
    const weaknesses = [
      `Some arguments could be supported with more evidence`,
      `Certain concepts could be explained more thoroughly`,
      `Additional examples would strengthen your points`,
      `Consider exploring counterarguments to strengthen your position`,
      `More attention to technical terminology would improve precision`,
      `Some transitions between ideas could be smoother`
    ];
    
    // Select 2-3 random weaknesses
    return weaknesses.sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 2));
  };
  
  const generateRecommendations = (submission: any) => {
    const recommendations = [
      `Review the section on ${submission.subjectArea} in your textbook to strengthen your understanding of key concepts`,
      `Try creating a mind map to visualize how different ideas connect to each other`,
      `Practice explaining these concepts aloud to improve your understanding and retention`,
      `Consider finding additional examples from real-world scenarios to illustrate your points`,
      `Create flashcards for key terms to ensure accurate use of terminology`,
      `Set aside time for focused practice on this topic with minimal distractions`
    ];
    
    // Select 3 random recommendations
    return recommendations.sort(() => 0.5 - Math.random()).slice(0, 3);
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
                    <a 
                      href="/learning-style" 
                      className="block mt-2 text-edu-primary hover:underline font-medium"
                    >
                      Take the learning style quiz
                    </a>
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
