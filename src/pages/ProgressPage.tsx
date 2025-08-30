import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import ProgressChart from '@/components/dashboard/ProgressChart';
import AcademicProgressTimeline from '@/components/progress/AcademicProgressTimeline';
import { ProgressDashboard } from '@/components/progress/ProgressDashboard';
import { DoubtsList } from '@/components/doubts/DoubtsList';
import { DoubtForm, DoubtFormData } from '@/components/doubts/DoubtForm';
import AgenticInterface from '@/components/AgenticInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SubjectArea } from '@/types';
import { Upload, LineChart, BarChart3, TrendingUp, HelpCircle, Brain, MessageSquare, CheckCircle, Sparkles } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Doubt {
  id: string;
  title: string;
  description: string;
  subject_area: string | null;
  status: 'open' | 'in_progress' | 'solved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  response_count?: number;
}

const ProgressPage = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { currentUser, isAuthenticated } = state;
  const { toast } = useToast();
  
  // State management
  const [showDoubtForm, setShowDoubtForm] = useState(false);
  const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
  const [isSubmittingDoubt, setIsSubmittingDoubt] = useState(false);
  const [isSolvingDoubt, setIsSolvingDoubt] = useState(false);
  const [doubtResponses, setDoubtResponses] = useState<any[]>([]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated || !currentUser) {
    return null;
  }
  
  // Safe data handling with fallback for performances
  const performances = currentUser.performances || [];
  
  // Filter performances by subject area
  const getPerformancesBySubject = (subject: SubjectArea) => {
    return performances.filter(p => p.subjectArea === subject);
  };
  
  // Get all unique subject areas from the user's performances
  const getUniqueSubjects = () => {
    const subjects = new Set<SubjectArea>();
    performances.forEach(p => subjects.add(p.subjectArea));
    return Array.from(subjects);
  };
  
  const uniqueSubjects = getUniqueSubjects();

  // Doubt management functions
  const handleCreateDoubt = async (doubtData: DoubtFormData) => {
    if (!currentUser?.id) return;
    
    setIsSubmittingDoubt(true);
    try {
      const { data, error } = await supabase
        .from('doubts')
        .insert({
          student_id: currentUser.id,
          title: doubtData.title,
          description: doubtData.description,
          subject_area: doubtData.subject_area || null,
          difficulty_level: doubtData.difficulty_level,
          priority: doubtData.priority,
          tags: doubtData.tags,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Question submitted!',
        description: 'Your doubt has been added to your folder',
      });
      
      setShowDoubtForm(false);
    } catch (error: any) {
      console.error('Error creating doubt:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit your question. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingDoubt(false);
    }
  };

  const handleViewDoubt = async (doubt: Doubt) => {
    setSelectedDoubt(doubt);
    
    // Fetch responses for this doubt
    try {
      const { data, error } = await supabase
        .from('doubt_responses')
        .select('*')
        .eq('doubt_id', doubt.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setDoubtResponses(data || []);
    } catch (error) {
      console.error('Error fetching doubt responses:', error);
      setDoubtResponses([]);
    }
  };

  const handleSolveDoubt = async (doubt: Doubt) => {
    setIsSolvingDoubt(true);
    try {
      // Use the agentic layer instead of direct solve-doubt call
      const { data, error } = await supabase.functions.invoke('gemini-agent', {
        body: {
          action: 'solve_student_doubt',
          context: {
            userMessage: 'Please solve this doubt using AI',
            data: { doubt_id: doubt.id, action: 'generate_solution' }
          }
        }
      });

      if (error) throw error;
      
      toast({
        title: 'AI Agent Processed Doubt!',
        description: 'Your doubt has been analyzed and a solution is ready',
      });
      
      // Automatically open the doubt to show the solution
      handleViewDoubt(doubt);
      
    } catch (error: any) {
      console.error('Error solving doubt:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate AI solution',
        variant: 'destructive',
      });
    } finally {
      setIsSolvingDoubt(false);
    }
  };
  
  return (
    <PageLayout 
      title="Learning Progress & Doubts" 
      subtitle="Track your academic achievements, get AI help, and manage your doubts"
      className="py-8"
    >
      <div className="container px-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
          <div className="flex items-center">
            <TrendingUp className="mr-3 h-6 w-6 text-pink-600" />
            <h2 className="text-2xl font-bold text-gray-800">Your Learning Dashboard</h2>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowDoubtForm(true)}
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Brain className="h-4 w-4 mr-2" />
              Ask Question
            </Button>
            <Button 
              asChild
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <a href="/submit">
                <Upload className="h-4 w-4 mr-2" />
                Submit Assignment
              </a>
            </Button>
          </div>
        </div>
        
        <div className="mb-8">
          <Tabs defaultValue="dashboard">
            <TabsList className="bg-white/60 backdrop-blur-sm border border-pink-100">
              <TabsTrigger value="dashboard" className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <TrendingUp className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="ai-agent" className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
                <Brain className="h-4 w-4 mr-2" />
                AI Agent
              </TabsTrigger>
              <TabsTrigger value="doubts" className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                <HelpCircle className="h-4 w-4 mr-2" />
                My Doubts
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
                <LineChart className="h-4 w-4 mr-2" />
                Charts
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="mt-6">
              <ProgressDashboard performances={performances} />
            </TabsContent>

            <TabsContent value="ai-agent" className="mt-6">
              <AgenticInterface />
            </TabsContent>

            <TabsContent value="doubts" className="mt-6">
              <DoubtsList 
                onNewDoubt={() => setShowDoubtForm(true)}
                onViewDoubt={handleViewDoubt}
                onSolveDoubt={handleSolveDoubt}
              />
            </TabsContent>
            
            <TabsContent value="overview" className="mt-6">
              <Card className="bg-white/60 backdrop-blur-sm border-pink-100">
                <CardHeader>
                  <CardTitle className="text-xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Overall Performance
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Your progress across all subject areas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ProgressChart 
                      performances={performances}
                      title="All Subjects Performance" 
                      description="Track your scores across all academic areas"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="timeline" className="mt-6">
              <div className="bg-white/60 backdrop-blur-sm border border-pink-100 rounded-lg p-6">
                <AcademicProgressTimeline 
                  performances={performances}
                  title="Academic Progress Over Time"
                  description="Track your performance trends and improvement over time"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {uniqueSubjects.length > 0 && (
          <Card className="bg-white/60 backdrop-blur-sm border-pink-100 mb-8">
            <CardHeader>
              <CardTitle className="text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Subject-wise Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={uniqueSubjects[0]}>
                <TabsList className="mb-6">
                  {uniqueSubjects.map(subject => (
                    <TabsTrigger 
                      key={subject} 
                      value={subject} 
                      className="capitalize"
                    >
                      {subject.replace('_', ' ')}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {uniqueSubjects.map(subject => (
                  <TabsContent key={subject} value={subject}>
                    <div className="space-y-6">
                      <ProgressChart 
                        performances={getPerformancesBySubject(subject)}
                        title={`${subject.charAt(0).toUpperCase() + subject.slice(1).replace('_', ' ')} Performance`}
                        description="Your scores over time in this subject"
                      />
                      
                      <div className="space-y-4 mt-6">
                        <h3 className="text-lg font-medium text-gray-800">Recent Submissions</h3>
                        
                        {getPerformancesBySubject(subject).length === 0 ? (
                          <div className="text-center py-8 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                            <p className="text-gray-600">No submissions for this subject yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {getPerformancesBySubject(subject)
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .slice(0, 5)
                              .map(performance => (
                                <div key={performance.id} className="border border-pink-100 rounded-lg p-4 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all bg-white/80 backdrop-blur-sm">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-md font-medium text-gray-800">{performance.title}</h4>
                                    {performance.score !== undefined && (
                                      <Badge variant={performance.score >= 80 ? 'default' : performance.score >= 60 ? 'secondary' : 'destructive'}>
                                        {performance.score}%
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="text-xs text-gray-500 mb-2">
                                    {new Date(performance.date).toLocaleDateString()}
                                  </div>
                                  
                                  <p className="text-sm text-gray-700 line-clamp-2">{performance.feedback}</p>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {performances.length === 0 && (
          <Card className="bg-white/60 backdrop-blur-sm border-pink-100">
            <CardContent className="text-center py-12">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
                <Upload className="h-12 w-12 text-pink-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-3">No performance data yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Submit your first assignment to start tracking your progress and see detailed analytics
              </p>
              <Button 
                asChild
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <a href="/submit">
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Your First Assignment
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Doubt Form Dialog */}
      <Dialog open={showDoubtForm} onOpenChange={setShowDoubtForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ask a New Question</DialogTitle>
          </DialogHeader>
          <DoubtForm
            onSubmit={handleCreateDoubt}
            onCancel={() => setShowDoubtForm(false)}
            isSubmitting={isSubmittingDoubt}
          />
        </DialogContent>
      </Dialog>

      {/* Doubt Details Dialog */}
      <Dialog open={!!selectedDoubt} onOpenChange={() => setSelectedDoubt(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedDoubt && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{selectedDoubt.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={selectedDoubt.status === 'solved' ? 'default' : 'secondary'}>
                        {selectedDoubt.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">{selectedDoubt.priority}</Badge>
                      {selectedDoubt.subject_area && (
                        <Badge variant="secondary">{selectedDoubt.subject_area.replace('_', ' ')}</Badge>
                      )}
                    </div>
                  </div>
                  {selectedDoubt.status === 'open' && (
                    <Button
                      onClick={() => handleSolveDoubt(selectedDoubt)}
                      disabled={isSolvingDoubt}
                      className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                    >
                      {isSolvingDoubt ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Getting AI Help...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Get AI Solution
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Question Details</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedDoubt.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Asked {formatDistanceToNow(new Date(selectedDoubt.created_at), { addSuffix: true })}
                  </p>
                </div>

                {doubtResponses.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Responses ({doubtResponses.length})
                    </h4>
                    <div className="space-y-4">
                      {doubtResponses.map((response) => (
                        <div
                          key={response.id}
                          className={`p-4 rounded-lg border ${
                            response.response_type === 'ai'
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-green-50 border-green-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {response.response_type === 'ai' ? (
                              <Brain className="h-4 w-4 text-blue-600" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            <span className="text-sm font-medium">
                              {response.response_type === 'ai' ? 'AI Tutor' : 'Teacher'} Response
                            </span>
                            {response.is_solution && (
                              <Badge variant="default" className="text-xs">Solution</Badge>
                            )}
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-800 whitespace-pre-wrap">{response.response_text}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default ProgressPage;