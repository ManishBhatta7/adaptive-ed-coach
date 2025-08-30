
import { useAppContext } from '@/context/AppContext';
import ProgressChart from '@/components/dashboard/ProgressChart';
import RecentSubmissions from '@/components/dashboard/RecentSubmissions';
import LearningStyleSummary from '@/components/dashboard/LearningStyleSummary';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, TrendingUp, Users } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

const Dashboard = () => {
  const { state } = useAppContext();
  const { isLoading } = state;

  if (isLoading) {
    return (
      <PageLayout 
        title="Dashboard" 
        subtitle="Track your learning progress and personalized insights"
        className="py-8"
      >
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!state.currentUser) {
    return (
      <PageLayout 
        title="Dashboard" 
        subtitle="Track your learning progress and personalized insights"
        className="py-8"
      >
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to AdaptiveEdCoach</h1>
              <p className="text-gray-600 mb-6">Please log in to access your dashboard</p>
              <button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg" onClick={() => window.location.href = '/login'}>
                Login
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Dashboard" 
      subtitle="Track your learning progress and personalized insights"
      className="py-8"
    >
      <div className="container mx-auto px-6 max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {state.currentUser?.name || 'Student'}!
          </h1>
          <p className="text-gray-600">
            Track your progress and continue your learning journey
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-edu-light rounded-lg">
                  <FileText className="h-6 w-6 text-edu-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Submit Work</h3>
                  <p className="text-sm text-gray-600">Upload assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-edu-light rounded-lg">
                  <TrendingUp className="h-6 w-6 text-edu-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">View Progress</h3>
                  <p className="text-sm text-gray-600">Track performance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-edu-light rounded-lg">
                  <BookOpen className="h-6 w-6 text-edu-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Reading Practice</h3>
                  <p className="text-sm text-gray-600">Voice analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-edu-light rounded-lg">
                  <Users className="h-6 w-6 text-edu-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Classrooms</h3>
                  <p className="text-sm text-gray-600">Join classes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Progress Chart */}
          <div className="xl:col-span-2">
            <ProgressChart 
              performances={state.currentUser?.performances || []} 
              title="Academic Progress"
              description="Your performance across different subjects over time"
            />
          </div>

          {/* Right Column - Learning Style Summary */}
          <div>
            <LearningStyleSummary
              primaryStyle={state.currentUser?.primaryLearningStyle}
              secondaryStyle={state.currentUser?.secondaryLearningStyle}
              styleStrengths={state.currentUser?.learningStyleStrengths}
            />
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="mt-8">
          <RecentSubmissions 
            performances={state.currentUser?.performances || []} 
            limit={5}
          />
        </div>

        {/* Performance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Submissions</CardTitle>
              <CardDescription>All time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-edu-primary">
                {state.currentUser?.performances?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Average Score</CardTitle>
              <CardDescription>Last 10 submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-edu-primary">
                {state.currentUser?.performances?.length ? 
                  Math.round(
                    state.currentUser.performances
                      .slice(-10)
                      .filter(p => p.score !== undefined)
                      .reduce((sum, p) => sum + (p.score || 0), 0) / 
                    Math.max(1, state.currentUser.performances.slice(-10).filter(p => p.score !== undefined).length)
                  ) : 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Subjects</CardTitle>
              <CardDescription>Currently studying</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-edu-primary">
                {state.currentUser?.performances ? 
                  new Set(state.currentUser.performances.map(p => p.subjectArea)).size : 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
