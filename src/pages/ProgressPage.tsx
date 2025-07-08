import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import ProgressChart from '@/components/dashboard/ProgressChart';
import AcademicProgressTimeline from '@/components/progress/AcademicProgressTimeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SubjectArea } from '@/types';
import { Upload, LineChart, BarChart3, TrendingUp } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

const ProgressPage = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { currentUser, isAuthenticated } = state;
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated || !currentUser) {
    return null;
  }
  
  // Filter performances by subject area
  const getPerformancesBySubject = (subject: SubjectArea) => {
    return currentUser.performances.filter(p => p.subjectArea === subject);
  };
  
  // Get all unique subject areas from the user's performances
  const getUniqueSubjects = () => {
    const subjects = new Set<SubjectArea>();
    currentUser.performances.forEach(p => subjects.add(p.subjectArea));
    return Array.from(subjects);
  };
  
  const uniqueSubjects = getUniqueSubjects();
  
  return (
    <PageLayout 
      title="Learning Progress" 
      subtitle="Track your academic achievements and growth over time"
      className="py-8"
    >
      <div className="container px-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
          <div className="flex items-center">
            <TrendingUp className="mr-3 h-6 w-6 text-pink-600" />
            <h2 className="text-2xl font-bold text-gray-800">Your Learning Journey</h2>
          </div>
          
          <Button 
            asChild
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <a href="/submit">
              <Upload className="h-4 w-4 mr-2" />
              Submit New Assignment
            </a>
          </Button>
        </div>
        
        <div className="mb-8">
          <Tabs defaultValue="overview">
            <TabsList className="bg-white/60 backdrop-blur-sm border border-pink-100">
              <TabsTrigger value="overview" className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <LineChart className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Progress Timeline
              </TabsTrigger>
            </TabsList>
            
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
                      performances={currentUser.performances}
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
                  performances={currentUser.performances}
                  title="Academic Progress Over Time"
                  description="Track your performance trends and improvement over time"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {uniqueSubjects.length > 0 ? (
          <Tabs defaultValue={uniqueSubjects[0]}>
            <TabsList className="mb-6 bg-white/60 backdrop-blur-sm border border-pink-100">
              {uniqueSubjects.map(subject => (
                <TabsTrigger 
                  key={subject} 
                  value={subject} 
                  className="capitalize data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                >
                  {subject.replace('_', ' ')}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {uniqueSubjects.map(subject => (
              <TabsContent key={subject} value={subject}>
                <Card className="bg-white/60 backdrop-blur-sm border-pink-100">
                  <CardHeader>
                    <CardTitle className="capitalize text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {subject.replace('_', ' ')} Progress
                    </CardTitle>
                    <CardDescription>
                      Detailed view of your performance in this subject
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                        performance.score >= 80
                                          ? 'bg-green-100 text-green-800 border-green-200'
                                          : performance.score >= 60
                                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                          : 'bg-red-100 text-red-800 border-red-200'
                                      }`}>
                                        {performance.score}%
                                      </span>
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
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
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
    </PageLayout>
  );
};

export default ProgressPage;