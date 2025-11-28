import MainLayout from '@/components/layout/MainLayout';
import { useAppContext } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AITutorSystem from '@/components/ai/AITutorSystem';
import ProgressChart from '@/components/dashboard/ProgressChart';
import { PersonalizedInsights } from '@/components/progress/PersonalizedInsights';
import { Sparkles, TrendingUp, Brain } from 'lucide-react';

const ProgressPage = () => {
  const { state } = useAppContext();
  const { currentUser } = state;

  return (
    <MainLayout>
      <div className="container px-4 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Learning Journey</h1>
          <p className="text-gray-600 mt-1">Track your growth and work with your personal AI tutor.</p>
        </div>

        <Tabs defaultValue="tutor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="tutor" className="rounded-lg data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
              <Brain className="w-4 h-4 mr-2" /> AI Tutor
            </TabsTrigger>
            <TabsTrigger value="insights" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Sparkles className="w-4 h-4 mr-2" /> Insights
            </TabsTrigger>
            <TabsTrigger value="metrics" className="rounded-lg data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
              <TrendingUp className="w-4 h-4 mr-2" /> Metrics
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: AI TUTOR (The Main Focus) */}
          <TabsContent value="tutor" className="mt-0">
            <AITutorSystem studentProfile={currentUser} />
          </TabsContent>

          {/* TAB 2: INSIGHTS */}
          <TabsContent value="insights" className="mt-0">
            <PersonalizedInsights studentProfile={currentUser} timeRange="month" />
          </TabsContent>

          {/* TAB 3: CHARTS */}
          <TabsContent value="metrics" className="mt-0">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <ProgressChart 
                performances={currentUser?.performances || []} 
                title="Performance History" 
                description="Your scores over the last semester"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ProgressPage;