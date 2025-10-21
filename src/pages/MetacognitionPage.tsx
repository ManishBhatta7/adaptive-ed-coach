import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { StudentMetacogView } from '@/components/metacog/StudentMetacogView';
import { MetacogDashboard } from '@/components/metacog/MetacogDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Users, BookOpen } from 'lucide-react';

const MetacognitionPage: React.FC = () => {
  const { state } = useAppContext();

  // If not authenticated, show login prompt
  if (!state.isAuthenticated || !state.currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Access Metacognition Features</h2>
            <p className="text-gray-600">
              Please log in to access your metacognition dashboard and reflection tools.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-600" />
          Metacognition Center
        </h1>
        <p className="text-gray-600">
          Reflect on your learning strategies and track your growth as a problem solver.
        </p>
      </div>

      {state.isTeacher ? (
        // Teacher View with Tabs
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Student Reflections
            </TabsTrigger>
            <TabsTrigger value="my-reflections" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              My Reflections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Dashboard</CardTitle>
                <p className="text-sm text-gray-600">
                  Review and rate student reflections, provide feedback, and track class progress.
                </p>
              </CardHeader>
            </Card>
            <MetacogDashboard />
          </TabsContent>

          <TabsContent value="my-reflections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Personal Reflections</CardTitle>
                <p className="text-sm text-gray-600">
                  Reflect on your own teaching strategies and problem-solving approaches.
                </p>
              </CardHeader>
            </Card>
            <StudentMetacogView />
          </TabsContent>
        </Tabs>
      ) : (
        // Student View
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Welcome to Your Metacognition Journey
              </CardTitle>
              <p className="text-sm text-gray-600">
                Metacognition means "thinking about thinking." By reflecting on how you solve problems, 
                you'll become a more effective learner. Track your progress, earn badges, and get 
                feedback from your teachers and AI.
              </p>
            </CardHeader>
          </Card>
          
          <StudentMetacogView />
        </div>
      )}
    </div>
  );
};

export default MetacognitionPage;
