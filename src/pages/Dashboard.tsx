
import { useAppContext } from '@/context/AppContext';
import { useTestDataMode } from '@/hooks/useTestDataMode';
import ProgressChart from '@/components/dashboard/ProgressChart';
import RecentSubmissions from '@/components/dashboard/RecentSubmissions';
import LearningStyleSummary from '@/components/dashboard/LearningStyleSummary';
import TestDataControls from '@/components/debug/TestDataControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BookOpen, FileText, TrendingUp, Users, TestTube, Database } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

const Dashboard = () => {
  const { state } = useAppContext();
  const { testMode, enableTestMode, disableTestMode } = useTestDataMode();

  // Use test data when enabled
  const displayUser = testMode.enabled && testMode.studentProfile 
    ? testMode.studentProfile 
    : state.currentUser;

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

  if (!displayUser) {
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
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700" asChild>
                <a href="/login">Login</a>
              </Button>
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
        {/* Test Mode Toggle */}
        <div className="mb-8">
          <Card className="bg-white/60 backdrop-blur-sm border-purple-100">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TestTube className="h-5 w-5 text-purple-600" />
                  <div>
                    <CardTitle className="text-lg">Development Mode</CardTitle>
                    <CardDescription>
                      {testMode.enabled 
                        ? `Test mode active with ${testMode.scenario} scenario` 
                        : "Using real application data"
                      }
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="test-mode"
                      checked={testMode.enabled}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          enableTestMode('minimal');
                        } else {
                          disableTestMode();
                        }
                      }}
                    />
                    <Label htmlFor="test-mode" className="text-sm font-medium">
                      Test Mode
                    </Label>
                  </div>
                  {testMode.enabled && (
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-purple-700 font-medium">
                        Mock Data Active
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            {testMode.enabled && (
              <CardContent className="pt-0">
                <div className="flex gap-2 flex-wrap">
                  {['edge-cases', 'minimal', 'bulk-data', 'stress-test'].map((scenario) => (
                    <Button
                      key={scenario}
                      variant={testMode.scenario === scenario ? "default" : "outline"}
                      size="sm"
                      onClick={() => enableTestMode(scenario as any)}
                      className={
                        testMode.scenario === scenario 
                          ? "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700" 
                          : "border-purple-200 text-purple-600 hover:bg-purple-50"
                      }
                    >
                      {scenario.charAt(0).toUpperCase() + scenario.slice(1).replace('-', ' ')}
                    </Button>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {displayUser.name || 'Student'}!
          </h1>
          <p className="text-gray-600">
            Track your progress and continue your learning journey
          </p>
          {testMode.enabled && (
            <div className="mt-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-sm rounded-full inline-block border border-purple-200">
              🧪 Test Mode Active: {testMode.scenario}
            </div>
          )}
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
