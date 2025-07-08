import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { LearningStyleProvider } from '@/context/LearningStyleContext';
import LearningStyleQuiz from '@/components/learning-style/LearningStyleQuiz';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageLayout from '@/components/layout/PageLayout';

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
    <PageLayout 
      title="Learning Style Discovery" 
      subtitle="Discover how you learn best with our AI-powered assessment"
      className="py-8"
    >
      <div className="container px-6 max-w-4xl mx-auto">
        <Card className="mb-8 bg-white/60 backdrop-blur-sm border-pink-100">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Why Learning Styles Matter
            </CardTitle>
            <CardDescription className="text-lg">
              Personalized learning leads to better outcomes
            </CardDescription>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p className="text-gray-700">
              Research shows that when educational content is presented in a way that matches
              a student's preferred learning style, they can absorb and retain information more
              effectively. Our AI coaching adapts to your unique learning profile to provide:
            </p>
            
            <ul className="space-y-3 mt-6">
              <li className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-purple-700">Tailored explanations</strong> that match how you process information best
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-purple-700">Personalized study strategies</strong> that leverage your natural strengths
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-purple-700">Custom feedback</strong> that resonates with your learning preferences
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-purple-700">Long-term progress tracking</strong> that adapts as your skills develop
                </div>
              </li>
            </ul>
            
            <p className="mt-6 text-gray-700">
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
    </PageLayout>
  );
};

export default LearningStylePage;