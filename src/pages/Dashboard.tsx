
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import LearningStyleSummary from '@/components/dashboard/LearningStyleSummary';
import ProgressChart from '@/components/dashboard/ProgressChart';
import RecentSubmissions from '@/components/dashboard/RecentSubmissions';
import OpenAITest from '@/components/OpenAITest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Upload, Book, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingScreen from '@/components/loading/LoadingScreen';
import ErrorBoundary from '@/components/error/ErrorBoundary';

const Dashboard = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { currentUser, isAuthenticated, isLoading } = state;
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <LoadingScreen message="Loading your dashboard..." />
      </MainLayout>
    );
  }
  
  if (!isAuthenticated || !currentUser) {
    return null;
  }
  
  return (
    <MainLayout>
      <div className="container px-4 py-8">
        <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {getWelcomeMessage()}, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-gray-600 mt-1">
              Here's an overview of your learning journey
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button asChild variant="outline">
              <a href="/classrooms">
                <Users className="h-4 w-4 mr-2" />
                My Classrooms
              </a>
            </Button>
            <Button asChild>
              <a href="/submit">
                <Upload className="h-4 w-4 mr-2" />
                Submit Assignment
              </a>
            </Button>
          </div>
        </div>
        
        <ErrorBoundary fallback={
          <div className="text-center p-8">
            <p className="text-gray-600">Unable to load learning style summary. Please refresh the page.</p>
          </div>
        }>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <LearningStyleSummary 
                primaryStyle={currentUser.primaryLearningStyle}
                secondaryStyle={currentUser.secondaryLearningStyle}
                styleStrengths={currentUser.learningStyleStrengths}
              />
            </div>
            
            <div className="lg:col-span-2">
              <ProgressChart performances={currentUser.performances || []} />
            </div>
          </div>
        </ErrorBoundary>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks you can perform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild variant="outline" className="w-full justify-start">
                <a href="/submit">
                  <Upload className="h-4 w-4 mr-2" />
                  Submit New Assignment
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <a href="/learning-style">
                  <Book className="h-4 w-4 mr-2" />
                  Review Learning Style
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <a href="/notifications">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Check Notifications
                </a>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest submissions and feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <ErrorBoundary fallback={
                <div className="text-center p-4">
                  <p className="text-gray-600">Unable to load recent submissions.</p>
                </div>
              }>
                <RecentSubmissions performances={currentUser.performances || []} />
              </ErrorBoundary>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-8">
          <ErrorBoundary fallback={
            <Card>
              <CardContent className="p-4">
                <p className="text-center text-gray-600">OpenAI test component unavailable.</p>
              </CardContent>
            </Card>
          }>
            <OpenAITest />
          </ErrorBoundary>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
