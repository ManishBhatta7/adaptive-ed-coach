
import { useAppContext } from '@/context/AppContext';
import { useTestDataMode } from '@/hooks/useTestDataMode';
import ProgressChart from '@/components/dashboard/ProgressChart';
import RecentSubmissions from '@/components/dashboard/RecentSubmissions';
import LearningStyleSummary from '@/components/dashboard/LearningStyleSummary';
import TestDataControls from '@/components/debug/TestDataControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, TrendingUp, Users } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

const Dashboard = () => {
  const { state } = useAppContext();
  const { testMode } = useTestDataMode();
  const { currentUser, isLoading } = state;

  // Use test data if available, otherwise use real user data
  const displayUser = testMode.enabled && testMode.studentProfile ? testMode.studentProfile : currentUser;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-edu-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-edu-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to AdaptiveEdCoach</h1>
          <p className="text-gray-600 mb-6">Please log in to access your dashboard</p>
          <Button asChild>
            <a href="/login">Login</a>
          </Button>
        </div>
      </div>
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
            Welcome back, {displayUser.name || 'Student'}!
          </h1>
          <p className="text-gray-600">
            Track your progress and continue your learning journey
          </p>
          {testMode.enabled && (
            <div className="mt-2 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full inline-block">
              Test Mode Active: {testMode.scenario}
            </div>
          )}
        </div>

        {/* Test Data Controls - Only show in development */}
        {import.meta.env.DEV && (
          <div className="mb-8">
            <TestDataControls />
          </div>
        )}

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
              performances={displayUser.performances || []} 
              title="Academic Progress"
              description="Your performance across different subjects over time"
            />
          </div>

          {/* Right Column - Learning Style Summary */}
          <div>
            <LearningStyleSummary
              primaryStyle={displayUser.primaryLearningStyle}
              secondaryStyle={displayUser.secondaryLearningStyle}
              styleStrengths={displayUser.learningStyleStrengths}
            />
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="mt-8">
          <RecentSubmissions 
            performances={displayUser.performances || []} 
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
                {displayUser.performances?.length || 0}
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
                {displayUser.performances?.length ? 
                  Math.round(
                    displayUser.performances
                      .slice(-10)
                      .filter(p => p.score !== undefined)
                      .reduce((sum, p) => sum + (p.score || 0), 0) / 
                    Math.max(1, displayUser.performances.slice(-10).filter(p => p.score !== undefined).length)
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
                {displayUser.performances ? 
                  new Set(displayUser.performances.map(p => p.subjectArea)).size : 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
