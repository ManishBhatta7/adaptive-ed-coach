import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  FileText,
  Award,
  Target,
  BarChart3,
  UserCheck,
  GraduationCap,
  Sparkles,
  Zap,
  Star
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
  activeStudents?: number;
  completionRate?: number;
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
    activeStudents: 0,
    completionRate: 0,
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecentActivity = useCallback(async () => {
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
      
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
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
        activeStudents: Math.round(totalStudents * 0.8), // Mock calculation - could be based on recent activity
        completionRate: assignmentsCount ? Math.round((recentSubmissionsCount / (assignmentsCount * Math.max(1, totalStudents))) * 100) : 0,
      });

      // Load recent activity
      await loadRecentActivity();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [state.currentUser?.id, toast, loadRecentActivity]);

  useEffect(() => {
    if (state.currentUser && state.isTeacher) {
      loadDashboardData();
    }
  }, [state.currentUser, state.isTeacher, loadDashboardData]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'doubt':
        return <MessageSquare className="h-5 w-5 text-amber-600" />;
      case 'assignment':
        return <BookOpen className="h-5 w-5 text-purple-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
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
    <PageLayout title="Teacher Dashboard" subtitle="Empower your students with insights and personalized learning">
      <div className="container px-6 max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header with Teaching Stats */}
        <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <GraduationCap className="h-10 w-10" />
                <div>
                  <h1 className="text-3xl font-bold">Welcome back, {state.currentUser?.name || 'Teacher'}!</h1>
                  <p className="text-teal-100 text-sm">Inspiring minds and shaping futures</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {stats.totalClassrooms} Active Classrooms
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                  <UserCheck className="h-4 w-4 mr-2" />
                  {stats.activeStudents} Engaged Students
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                  <Award className="h-4 w-4 mr-2" />
                  Excellence Educator
                </Badge>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                className="bg-white text-teal-600 hover:bg-teal-50"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Assignment
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                size="lg"
              >
                <Target className="h-5 w-5 mr-2" />
                Set Goals
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview with Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-teal-50 via-teal-100 to-cyan-100 border-teal-300 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-teal-500 rounded-xl shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <Sparkles className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-700 mb-1">Total Students</p>
                <p className="text-4xl font-bold text-teal-900 mb-2">{stats.totalStudents}</p>
                <div className="flex items-center gap-2">
                  <Progress value={85} className="h-2 bg-teal-200" />
                  <span className="text-xs text-teal-600 font-medium">85% active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 via-green-100 to-lime-100 border-emerald-300 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500 rounded-xl shadow-md">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <Star className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700 mb-1">Classrooms</p>
                <p className="text-4xl font-bold text-emerald-900 mb-2">{stats.totalClassrooms}</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-200 text-emerald-800 border-0">All Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-sky-50 via-blue-100 to-indigo-100 border-sky-300 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-sky-500 rounded-xl shadow-md">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <Zap className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-sky-700 mb-1">Assignments</p>
                <p className="text-4xl font-bold text-sky-900 mb-2">{stats.totalAssignments}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-sky-600 font-medium">{stats.completionRate}% completion rate</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 via-orange-100 to-yellow-100 border-amber-300 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500 rounded-xl shadow-md">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <AlertTriangle className={`h-5 w-5 ${stats.pendingDoubts > 5 ? 'text-red-500' : 'text-amber-400'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-700 mb-1">Student Doubts</p>
                <p className="text-4xl font-bold text-amber-900 mb-2">{stats.pendingDoubts}</p>
                <div className="flex items-center gap-2">
                  {stats.pendingDoubts > 0 ? (
                    <Badge className="bg-amber-200 text-amber-800 border-0">Needs attention</Badge>
                  ) : (
                    <Badge className="bg-green-200 text-green-800 border-0">All resolved</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-1 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-violet-900">
                <Zap className="h-5 w-5 text-violet-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-3" />
                Create Assignment
              </Button>
              <Button 
                className="w-full justify-start bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
                size="lg"
              >
                <Users className="h-5 w-5 mr-3" />
                Manage Classes
              </Button>
              <Button 
                className="w-full justify-start bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                size="lg"
              >
                <BarChart3 className="h-5 w-5 mr-3" />
                View Analytics
              </Button>
              <Button 
                className="w-full justify-start bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                size="lg"
              >
                <MessageSquare className="h-5 w-5 mr-3" />
                Answer Doubts
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates from your classrooms</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent activity</p>
                  <p className="text-sm text-gray-500 mt-2">Student submissions and doubts will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'submission' ? 'bg-blue-100' :
                          activity.type === 'doubt' ? 'bg-amber-100' : 'bg-purple-100'
                        }`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{activity.title}</p>
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
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-rose-50 to-pink-100 border-rose-200">
            <CardHeader>
              <CardTitle className="text-rose-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-rose-600 mb-2">{stats.recentSubmissions}</div>
              <p className="text-sm text-rose-700">In the last 7 days</p>
              <Progress value={75} className="mt-3 h-2 bg-rose-200" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-blue-100 border-cyan-200">
            <CardHeader>
              <CardTitle className="text-cyan-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-cyan-600 mb-2">{stats.activeStudents}</div>
              <p className="text-sm text-cyan-700">Engaged this week</p>
              <Progress value={stats.totalStudents ? (stats.activeStudents / stats.totalStudents) * 100 : 0} className="mt-3 h-2 bg-cyan-200" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-lime-50 to-green-100 border-lime-200">
            <CardHeader>
              <CardTitle className="text-lime-900 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-lime-600 mb-2">{stats.completionRate}%</div>
              <p className="text-sm text-lime-700">Assignment completion</p>
              <Progress value={stats.completionRate} className="mt-3 h-2 bg-lime-200" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-teal-100 to-cyan-100 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">Assignments</TabsTrigger>
            <TabsTrigger value="doubts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">Student Doubts</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Performance Overview */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <BarChart3 className="h-5 w-5" />
                  Classroom Performance Overview
                </CardTitle>
                <CardDescription>Track your students' progress and engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Engagement</span>
                        <span className="text-sm font-bold text-indigo-600">85%</span>
                      </div>
                      <Progress value={85} className="h-3 bg-indigo-100" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Assignment Completion</span>
                        <span className="text-sm font-bold text-emerald-600">{stats.completionRate}%</span>
                      </div>
                      <Progress value={stats.completionRate} className="h-3 bg-emerald-100" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Active Participation</span>
                        <span className="text-sm font-bold text-cyan-600">92%</span>
                      </div>
                      <Progress value={92} className="h-3 bg-cyan-100" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-inner">
                    <h4 className="font-semibold text-gray-900 mb-4">This Week's Highlights</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-sm">15 assignments graded</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                        <span className="text-sm">8 doubts resolved</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-amber-500" />
                        <span className="text-sm">3 students achieved excellence</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-teal-500" />
                        <span className="text-sm">Class average improved by 12%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">Assignment Management</h3>
              <AssignmentDistribution 
                classrooms={state.classrooms} 
                onAssignmentCreated={() => loadDashboardData()}
              />
            </div>
            
            <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-16 w-16 text-sky-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Assignment Distribution System</h3>
                <p className="text-gray-600 mb-6">
                  Create and distribute assignments to your classrooms. Track submissions and provide feedback to students.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
                    <Plus className="h-6 w-6 text-teal-600 mb-2" />
                    <h4 className="font-semibold text-teal-900">Create Assignments</h4>
                    <p className="text-sm text-teal-700">Design comprehensive assignments with due dates and point values</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                    <Users className="h-6 w-6 text-emerald-600 mb-2" />
                    <h4 className="font-semibold text-emerald-900">Distribute to Classes</h4>
                    <p className="text-sm text-emerald-700">Select multiple classrooms to receive the same assignment</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
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
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Advanced Analytics & Insights</h3>
                <p className="text-gray-600 mb-6">
                  Comprehensive analytics and insights coming soon. Track student performance, identify learning patterns, and optimize your teaching strategies.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-6 bg-white rounded-xl shadow-sm">
                    <BarChart3 className="h-8 w-8 text-teal-600 mx-auto mb-3" />
                    <h4 className="font-semibold mb-2">Performance Trends</h4>
                    <p className="text-sm text-gray-600">Track class and individual student progress over time</p>
                  </div>
                  <div className="p-6 bg-white rounded-xl shadow-sm">
                    <Target className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
                    <h4 className="font-semibold mb-2">Learning Patterns</h4>
                    <p className="text-sm text-gray-600">Identify strengths and areas for improvement</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default TeacherDashboard;