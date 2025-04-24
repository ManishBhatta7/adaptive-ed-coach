
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import ProgressChart from '@/components/dashboard/ProgressChart';
import AcademicProgressTimeline from '@/components/progress/AcademicProgressTimeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SubjectArea } from '@/types';
import { Upload, LineChart, BarChart3 } from 'lucide-react';

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
    <MainLayout>
      <div className="container px-4 py-8">
        <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learning Progress</h1>
            <p className="text-gray-600 mt-1">
              Track your performance over time across different subjects
            </p>
          </div>
          
          <Button asChild>
            <a href="/submit">
              <Upload className="h-4 w-4 mr-2" />
              Submit New Assignment
            </a>
          </Button>
        </div>
        
        <div className="mb-8">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center">
                <LineChart className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Progress Timeline
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Performance</CardTitle>
                  <CardDescription>
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
              <AcademicProgressTimeline 
                performances={currentUser.performances}
                title="Academic Progress Over Time"
                description="Track your performance trends and improvement over time"
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {uniqueSubjects.length > 0 ? (
          <Tabs defaultValue={uniqueSubjects[0]}>
            <TabsList className="mb-6">
              {uniqueSubjects.map(subject => (
                <TabsTrigger key={subject} value={subject} className="capitalize">
                  {subject.replace('_', ' ')}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {uniqueSubjects.map(subject => (
              <TabsContent key={subject} value={subject}>
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">{subject.replace('_', ' ')} Progress</CardTitle>
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
                        <h3 className="text-lg font-medium">Recent Submissions</h3>
                        
                        {getPerformancesBySubject(subject).length === 0 ? (
                          <p className="text-gray-500">No submissions for this subject yet.</p>
                        ) : (
                          <div className="space-y-4">
                            {getPerformancesBySubject(subject)
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .slice(0, 5)
                              .map(performance => (
                                <div key={performance.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-md font-medium">{performance.title}</h4>
                                    {performance.score !== undefined && (
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        performance.score >= 80
                                          ? 'bg-green-100 text-green-800'
                                          : performance.score >= 60
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
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
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No performance data yet</h3>
              <p className="text-gray-600 mb-6">
                Submit your first assignment to start tracking your progress
              </p>
              <Button asChild>
                <a href="/submit">
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Your First Assignment
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default ProgressPage;
