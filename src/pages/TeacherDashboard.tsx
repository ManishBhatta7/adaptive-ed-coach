import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PageLayout from '@/components/layout/PageLayout';
import { AssignmentDistribution } from '@/components/classroom/AssignmentDistribution';
import { DoubtsList } from '@/components/doubts/DoubtsList';

interface DashboardStats {
  totalStudents: number;
  totalClassrooms: number;
  totalAssignments: number;
  pendingDoubts: number;
  recentSubmissions: number;
}

interface RecentActivity {
  id: string;
  type: 'submission' | 'doubt' | 'assignment';
  title: string;
  studentName?: string;
  timestamp: string;
  status?: string;
}

const TeacherDashboard = () => {
  const { state } = useAppContext();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalClassrooms: 0,
    totalAssignments: 0,
    pendingDoubts: 0,
    recentSubmissions: 0,
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.currentUser && state.isTeacher) {
      loadDashboardData();
    }
  }, [state.currentUser, state.isTeacher]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get teacher's classrooms
      const { data: classrooms } = await supabase
        .from('classrooms')
        .select('id, name')
        .eq('teacher_id', state.currentUser?.id)
        .eq('is_active', true);
      
      const classroomIds = classrooms?.map(c => c.id) || [];
      
      // Get students count
      let totalStudents = 0;
      if (classroomIds.length > 0) {
        const { count } = await supabase
          .from('classroom_students')
          .select('*', { count: 'exact', head: true })
          .in('classroom_id', classroomIds)
          .eq('is_active', true);
        totalStudents = count || 0;
      }
      
      // Get assignments count
      const { count: assignmentsCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', state.currentUser?.id)
        .eq('is_active', true);
      
      // Get pending doubts count (for all students - teachers can see all doubts)
      const { count: doubtsCount } = await supabase
        .from('doubts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      
      // Get recent submissions count (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: recentSubmissionsCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', weekAgo.toISOString());
      
      setStats({
        totalStudents,
        totalClassrooms: classrooms?.length || 0,
        totalAssignments: assignmentsCount || 0,
        pendingDoubts: doubtsCount || 0,
        recentSubmissions: recentSubmissionsCount || 0,
      });

      // Load recent activity
      await loadRecentActivity();
      
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const activities: RecentActivity[] = [];
      
      // Get recent submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select(`
          id,
          assignment_type,
          submitted_at,
          status,
          user_id
        `)
        .order('submitted_at', { ascending: false })
        .limit(5);
      
      if (submissions) {
        submissions.forEach(sub => {
          activities.push({
            id: sub.id,
            type: 'submission',
            title: `New ${sub.assignment_type} submission`,
            timestamp: sub.submitted_at,
            status: sub.status,
          });
        });
      }
      
      // Get recent doubts
      const { data: doubts } = await supabase
        .from('doubts')
        .select(`
          id,
          title,
          created_at,
          status
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (doubts) {
        doubts.forEach(doubt => {
          activities.push({
            id: doubt.id,
            type: 'doubt',
            title: doubt.title,
            timestamp: doubt.created_at,
            status: doubt.status,
          });
        });
      }
      
      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setRecentActivity(activities.slice(0, 10));
      
    } catch (error: any) {
      console.error('Error loading recent activity:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return <FileText className="h-4 w-4" />;
      case 'doubt':
        return <MessageSquare className="h-4 w-4" />;
      case 'assignment':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processed':
      case 'solved':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <PageLayout title="Teacher Dashboard" subtitle="Manage your classes and track student progress">
        <div className="container px-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Teacher Dashboard" subtitle="Manage your classes and track student progress">
      <div className="container px-6 max-w-7xl mx-auto space-y-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Students</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Classrooms</p>
                  <p className="text-3xl font-bold text-green-900">{stats.totalClassrooms}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Assignments</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.totalAssignments}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Pending Doubts</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.pendingDoubts}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-600">Recent Submissions</p>
                  <p className="text-3xl font-bold text-pink-900">{stats.recentSubmissions}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="doubts">Student Doubts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getActivityIcon(activity.type)}
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {activity.status && (
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">Assignment Management</h3>
              <AssignmentDistribution 
                classrooms={state.classrooms} 
                onAssignmentCreated={() => loadDashboardData()}
              />
            </div>
            
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Assignment Distribution System</h3>
                <p className="text-gray-600 mb-6">
                  Create and distribute assignments to your classrooms. Track submissions and provide feedback to students.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Plus className="h-6 w-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-blue-900">Create Assignments</h4>
                    <p className="text-sm text-blue-700">Design comprehensive assignments with due dates and point values</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <Users className="h-6 w-6 text-green-600 mb-2" />
                    <h4 className="font-semibold text-green-900">Distribute to Classes</h4>
                    <p className="text-sm text-green-700">Select multiple classrooms to receive the same assignment</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-purple-600 mb-2" />
                    <h4 className="font-semibold text-purple-900">Track Progress</h4>
                    <p className="text-sm text-purple-700">Monitor submission status and provide personalized feedback</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doubts" className="space-y-6">
            <DoubtsList 
              onNewDoubt={() => {}}
              onViewDoubt={() => {}}
              onSolveDoubt={() => loadDashboardData()}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
                <p className="text-gray-600">
                  Comprehensive analytics and insights coming soon. Track student performance, identify learning patterns, and optimize your teaching strategies.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default TeacherDashboard;