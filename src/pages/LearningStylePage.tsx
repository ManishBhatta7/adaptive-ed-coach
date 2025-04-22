
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { LearningStyleProvider } from '@/context/LearningStyleContext';
import MainLayout from '@/components/layout/MainLayout';
import LearningStyleQuiz from '@/components/learning-style/LearningStyleQuiz';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LearningStylePage = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { isAuthenticated } = state;
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <MainLayout>
      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Discover Your Learning Style</h1>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              Understanding how you learn best will help us provide personalized educational
              coaching tailored to your specific strengths and preferences.
            </p>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Why Learning Styles Matter</CardTitle>
              <CardDescription>
                Personalized learning leads to better outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Research shows that when educational content is presented in a way that matches
                a student's preferred learning style, they can absorb and retain information more
                effectively. Our AI coaching adapts to your unique learning profile to provide:
              </p>
              
              <ul>
                <li>
                  <strong>Tailored explanations</strong> that match how you process information best
                </li>
                <li>
                  <strong>Personalized study strategies</strong> that leverage your natural strengths
                </li>
                <li>
                  <strong>Custom feedback</strong> that resonates with your learning preferences
                </li>
                <li>
                  <strong>Long-term progress tracking</strong> that adapts as your skills develop
                </li>
              </ul>
              
              <p>
                Complete the quiz below to determine your primary and secondary learning styles.
                This will enable our AI coaching system to provide feedback and guidance in the format 
                that works best for you.
              </p>
            </CardContent>
          </Card>
          
          <LearningStyleProvider>
            <LearningStyleQuiz />
          </LearningStyleProvider>
        </div>
      </div>
    </MainLayout>
  );
};

export default LearningStylePage;
