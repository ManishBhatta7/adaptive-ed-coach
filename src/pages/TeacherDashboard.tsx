import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';import { useNavigate } from 'react-router-dom';

import { useAppContext } from '@/context/AppContext';import { useAppContext } from '@/context/AppContext';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

import { Button } from '@/components/ui/button';import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';import { Badge } from '@/components/ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Progress } from '@/components/ui/progress';import { Progress } from '@/components/ui/progress';

import { import { 

  Users,   Users, 

  BookOpen,   BookOpen, 

  Calendar,   Calendar, 

  TrendingUp,   TrendingUp, 

  MessageSquare,  MessageSquare,

  CheckCircle2,  CheckCircle2,

  Clock,  Clock,

  AlertTriangle,  AlertTriangle,

  Plus,  Plus,

  FileText,  FileText,

  BarChart3,  BarChart3,

  GraduationCap,  GraduationCap,

  Target,  Target,

  Sparkles,  Sparkles,

  FileQuestion,  FileQuestion,

  Award,  Award,

  Brain,  Brain,

  Zap,  Zap,

  ArrowRight,  ArrowRight,

  Download,  Download,

  Eye,  Eye,

  Edit,  Edit

  PieChart,} from 'lucide-react';

  Activityimport { supabase } from '@/integrations/supabase/client';

} from 'lucide-react';import { useToast } from '@/hooks/use-toast';

import { supabase } from '@/integrations/supabase/client';import PageLayout from '@/components/layout/PageLayout';

import { useToast } from '@/hooks/use-toast';import { AssignmentDistribution } from '@/components/classroom/AssignmentDistribution';

import PageLayout from '@/components/layout/PageLayout';import { DoubtsList } from '@/components/doubts/DoubtsList';



interface DashboardStats {interface DashboardStats {

  totalStudents: number;  totalStudents: number;

  totalClassrooms: number;  totalClassrooms: number;

  activeAssignments: number;  totalAssignments: number;

  pendingDoubts: number;  pendingDoubts: number;

  submissionsToday: number;  recentSubmissions: number;

  averageProgress: number;}

  atRiskStudents: number;

}interface RecentActivity {

  id: string;

interface Student {  type: 'submission' | 'doubt' | 'assignment';

  id: string;  title: string;

  name: string;  studentName?: string;

  email: string;  timestamp: string;

  progress: number;  status?: string;

  lastActive: string;}

  assignmentsCompleted: number;

  totalAssignments: number;const TeacherDashboard = () => {

  performance: 'excellent' | 'good' | 'average' | 'needs_attention';  const { state } = useAppContext();

}  const { toast } = useToast();

  

interface QuickAction {  const [stats, setStats] = useState<DashboardStats>({

  title: string;    totalStudents: 0,

  description: string;    totalClassrooms: 0,

  icon: any;    totalAssignments: 0,

  color: string;    pendingDoubts: 0,

  action: () => void;    recentSubmissions: 0,

}  });

  

const TeacherDashboard = () => {  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const navigate = useNavigate();  const [loading, setLoading] = useState(true);

  const { state } = useAppContext();

  const { toast } = useToast();  useEffect(() => {

      if (state.currentUser && state.isTeacher) {

  const [stats, setStats] = useState<DashboardStats>({      loadDashboardData();

    totalStudents: 0,    }

    totalClassrooms: 0,  }, [state.currentUser, state.isTeacher]);

    activeAssignments: 0,

    pendingDoubts: 0,  const loadDashboardData = async () => {

    submissionsToday: 0,    try {

    averageProgress: 0,      setLoading(true);

    atRiskStudents: 0,      

  });      // Get teacher's classrooms

        const { data: classrooms } = await supabase

  const [recentStudents, setRecentStudents] = useState<Student[]>([]);        .from('classrooms')

  const [loading, setLoading] = useState(true);        .select('id, name')

  const [activeTab, setActiveTab] = useState('overview');        .eq('teacher_id', state.currentUser?.id)

        .eq('is_active', true);

  useEffect(() => {      

    if (state.currentUser && state.isTeacher) {      const classroomIds = classrooms?.map(c => c.id) || [];

      loadDashboardData();      

    }      // Get students count

  }, [state.currentUser, state.isTeacher]);      let totalStudents = 0;

      if (classroomIds.length > 0) {

  const loadDashboardData = async () => {        const { count } = await supabase

    try {          .from('classroom_students')

      setLoading(true);          .select('*', { count: 'exact', head: true })

                .in('classroom_id', classroomIds)

      // Get teacher's classrooms          .eq('is_active', true);

      const { data: classrooms } = await supabase        totalStudents = count || 0;

        .from('classrooms')      }

        .select('id, name')      

        .eq('teacher_id', state.currentUser?.id)      // Get assignments count

        .eq('is_active', true);      const { count: assignmentsCount } = await supabase

              .from('assignments')

      const classroomIds = classrooms?.map(c => c.id) || [];        .select('*', { count: 'exact', head: true })

              .eq('teacher_id', state.currentUser?.id)

      // Get students count and data        .eq('is_active', true);

      let totalStudents = 0;      

      const studentsData: Student[] = [];      // Get pending doubts count (for all students - teachers can see all doubts)

            const { count: doubtsCount } = await supabase

      if (classroomIds.length > 0) {        .from('doubts')

        const { data: enrollments } = await supabase        .select('*', { count: 'exact', head: true })

          .from('classroom_students')        .eq('status', 'open');

          .select(`      

            student_id,      // Get recent submissions count (last 7 days)

            profiles:student_id (      const weekAgo = new Date();

              id,      weekAgo.setDate(weekAgo.getDate() - 7);

              name,      

              email,      const { count: recentSubmissionsCount } = await supabase

              last_active        .from('submissions')

            )        .select('*', { count: 'exact', head: true })

          `)        .gte('submitted_at', weekAgo.toISOString());

          .in('classroom_id', classroomIds)      

          .eq('is_active', true);      setStats({

                totalStudents,

        totalStudents = enrollments?.length || 0;        totalClassrooms: classrooms?.length || 0,

                totalAssignments: assignmentsCount || 0,

        // Process student data        pendingDoubts: doubtsCount || 0,

        if (enrollments) {        recentSubmissions: recentSubmissionsCount || 0,

          enrollments.forEach((enrollment: any) => {      });

            if (enrollment.profiles) {

              studentsData.push({      // Load recent activity

                id: enrollment.profiles.id,      await loadRecentActivity();

                name: enrollment.profiles.name || 'Unknown',      

                email: enrollment.profiles.email || '',    } catch (error: any) {

                progress: Math.floor(Math.random() * 100), // TODO: Calculate actual progress      console.error('Error loading dashboard data:', error);

                lastActive: enrollment.profiles.last_active || new Date().toISOString(),      toast({

                assignmentsCompleted: Math.floor(Math.random() * 10),        title: 'Error',

                totalAssignments: 10,        description: 'Failed to load dashboard data',

                performance: ['excellent', 'good', 'average', 'needs_attention'][Math.floor(Math.random() * 4)] as any,        variant: 'destructive',

              });      });

            }    } finally {

          });      setLoading(false);

        }    }

      }  };

      

      // Get active assignments count  const loadRecentActivity = async () => {

      const { count: assignmentsCount } = await supabase    try {

        .from('assignments')      const activities: RecentActivity[] = [];

        .select('*', { count: 'exact', head: true })      

        .eq('teacher_id', state.currentUser?.id)      // Get recent submissions

        .eq('is_active', true);      const { data: submissions } = await supabase

              .from('submissions')

      // Get pending doubts count        .select(`

      const { count: doubtsCount } = await supabase          id,

        .from('doubts')          assignment_type,

        .select('*', { count: 'exact', head: true })          submitted_at,

        .eq('status', 'open');          status,

                user_id

      // Get submissions today        `)

      const today = new Date();        .order('submitted_at', { ascending: false })

      today.setHours(0, 0, 0, 0);        .limit(5);

            

      const { count: submissionsToday } = await supabase      if (submissions) {

        .from('submissions')        submissions.forEach(sub => {

        .select('*', { count: 'exact', head: true })          activities.push({

        .gte('submitted_at', today.toISOString());            id: sub.id,

                  type: 'submission',

      // Calculate stats            title: `New ${sub.assignment_type} submission`,

      const averageProgress = studentsData.length > 0            timestamp: sub.submitted_at,

        ? Math.floor(studentsData.reduce((acc, s) => acc + s.progress, 0) / studentsData.length)            status: sub.status,

        : 0;          });

              });

      const atRiskStudents = studentsData.filter(s => s.performance === 'needs_attention').length;      }

            

      setStats({      // Get recent doubts

        totalStudents,      const { data: doubts } = await supabase

        totalClassrooms: classrooms?.length || 0,        .from('doubts')

        activeAssignments: assignmentsCount || 0,        .select(`

        pendingDoubts: doubtsCount || 0,          id,

        submissionsToday: submissionsToday || 0,          title,

        averageProgress,          created_at,

        atRiskStudents,          status

      });        `)

              .order('created_at', { ascending: false })

      setRecentStudents(studentsData.slice(0, 5));        .limit(5);

            

    } catch (error: any) {      if (doubts) {

      console.error('Error loading dashboard data:', error);        doubts.forEach(doubt => {

      toast({          activities.push({

        title: 'Error',            id: doubt.id,

        description: 'Failed to load dashboard data',            type: 'doubt',

        variant: 'destructive',            title: doubt.title,

      });            timestamp: doubt.created_at,

    } finally {            status: doubt.status,

      setLoading(false);          });

    }        });

  };      }

      

  const quickActions: QuickAction[] = [      // Sort all activities by timestamp

    {      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      title: 'Create Quiz',      

      description: 'AI-powered quiz generation',      setRecentActivity(activities.slice(0, 10));

      icon: FileQuestion,      

      color: 'from-purple-500 to-indigo-500',    } catch (error: any) {

      action: () => navigate('/teacher-companion'),      console.error('Error loading recent activity:', error);

    },    }

    {  };

      title: 'Generate Worksheet',

      description: 'Custom worksheet creator',  const getActivityIcon = (type: string) => {

      icon: FileText,    switch (type) {

      color: 'from-blue-500 to-cyan-500',      case 'submission':

      action: () => navigate('/teacher-companion'),        return <FileText className="h-4 w-4" />;

    },      case 'doubt':

    {        return <MessageSquare className="h-4 w-4" />;

      title: 'View Analytics',      case 'assignment':

      description: 'Class performance insights',        return <BookOpen className="h-4 w-4" />;

      icon: BarChart3,      default:

      color: 'from-green-500 to-emerald-500',        return <Clock className="h-4 w-4" />;

      action: () => setActiveTab('analytics'),    }

    },  };

    {

      title: 'Track Progress',  const getStatusColor = (status: string) => {

      description: 'Student progress tracking',    switch (status) {

      icon: Target,      case 'pending':

      color: 'from-orange-500 to-amber-500',        return 'bg-yellow-100 text-yellow-800';

      action: () => setActiveTab('students'),      case 'processed':

    },      case 'solved':

  ];        return 'bg-green-100 text-green-800';

      case 'open':

  const getPerformanceBadge = (performance: string) => {        return 'bg-blue-100 text-blue-800';

    const styles = {      case 'in_progress':

      excellent: 'bg-green-100 text-green-800 border-green-200',        return 'bg-orange-100 text-orange-800';

      good: 'bg-blue-100 text-blue-800 border-blue-200',      default:

      average: 'bg-yellow-100 text-yellow-800 border-yellow-200',        return 'bg-gray-100 text-gray-800';

      needs_attention: 'bg-red-100 text-red-800 border-red-200',    }

    };  };

    return styles[performance as keyof typeof styles] || styles.average;

  };  if (loading) {

    return (

  if (loading) {      <PageLayout title="Teacher Dashboard" subtitle="Manage your classes and track student progress">

    return (        <div className="container px-6 max-w-7xl mx-auto">

      <PageLayout title="Teacher Dashboard" subtitle="Empower your teaching with AI-powered tools">          <div className="flex items-center justify-center h-64">

        <div className="container px-6 max-w-7xl mx-auto">            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>

          <div className="flex items-center justify-center h-64">          </div>

            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>        </div>

          </div>      </PageLayout>

        </div>    );

      </PageLayout>  }

    );

  }  return (

    <PageLayout title="Teacher Dashboard" subtitle="Manage your classes and track student progress">

  return (      <div className="container px-6 max-w-7xl mx-auto space-y-8">

    <PageLayout title="Teacher Dashboard" subtitle="Empower your teaching with AI-powered tools">        

      <div className="container px-6 max-w-7xl mx-auto space-y-8 pb-12">        {/* Stats Overview */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

        {/* Welcome Section */}          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">

        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">            <CardContent className="p-6">

          <div className="flex items-center justify-between">              <div className="flex items-center justify-between">

            <div>                <div>

              <h2 className="text-3xl font-bold mb-2">Welcome back, {state.currentUser?.name}! 👋</h2>                  <p className="text-sm font-medium text-blue-600">Students</p>

              <p className="text-indigo-100 text-lg">Ready to make a difference in your students' learning journey?</p>                  <p className="text-3xl font-bold text-blue-900">{stats.totalStudents}</p>

            </div>                </div>

            <div className="hidden md:block">                <Users className="h-8 w-8 text-blue-500" />

              <Sparkles className="h-20 w-20 text-yellow-300 animate-pulse" />              </div>

            </div>            </CardContent>

          </div>          </Card>

        </div>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">

        {/* Stats Grid */}            <CardContent className="p-6">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">              <div className="flex items-center justify-between">

          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">                <div>

            <CardContent className="p-6">                  <p className="text-sm font-medium text-green-600">Classrooms</p>

              <div className="flex items-center justify-between mb-4">                  <p className="text-3xl font-bold text-green-900">{stats.totalClassrooms}</p>

                <div className="p-3 bg-blue-100 rounded-lg">                </div>

                  <Users className="h-6 w-6 text-blue-600" />                <BookOpen className="h-8 w-8 text-green-500" />

                </div>              </div>

                <TrendingUp className="h-5 w-5 text-green-500" />            </CardContent>

              </div>          </Card>

              <p className="text-sm font-medium text-gray-600">Total Students</p>

              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">

              <p className="text-xs text-gray-500 mt-2">Across {stats.totalClassrooms} classrooms</p>            <CardContent className="p-6">

            </CardContent>              <div className="flex items-center justify-between">

          </Card>                <div>

                  <p className="text-sm font-medium text-purple-600">Assignments</p>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">                  <p className="text-3xl font-bold text-purple-900">{stats.totalAssignments}</p>

            <CardContent className="p-6">                </div>

              <div className="flex items-center justify-between mb-4">                <Calendar className="h-8 w-8 text-purple-500" />

                <div className="p-3 bg-purple-100 rounded-lg">              </div>

                  <BookOpen className="h-6 w-6 text-purple-600" />            </CardContent>

                </div>          </Card>

                <Activity className="h-5 w-5 text-purple-500" />

              </div>          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">

              <p className="text-sm font-medium text-gray-600">Active Assignments</p>            <CardContent className="p-6">

              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeAssignments}</p>              <div className="flex items-center justify-between">

              <p className="text-xs text-gray-500 mt-2">{stats.submissionsToday} submissions today</p>                <div>

            </CardContent>                  <p className="text-sm font-medium text-orange-600">Pending Doubts</p>

          </Card>                  <p className="text-3xl font-bold text-orange-900">{stats.pendingDoubts}</p>

                </div>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">                <MessageSquare className="h-8 w-8 text-orange-500" />

            <CardContent className="p-6">              </div>

              <div className="flex items-center justify-between mb-4">            </CardContent>

                <div className="p-3 bg-green-100 rounded-lg">          </Card>

                  <Target className="h-6 w-6 text-green-600" />

                </div>          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">

                <CheckCircle2 className="h-5 w-5 text-green-500" />            <CardContent className="p-6">

              </div>              <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-gray-600">Average Progress</p>                <div>

              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averageProgress}%</p>                  <p className="text-sm font-medium text-pink-600">Recent Submissions</p>

              <Progress value={stats.averageProgress} className="mt-2 h-2" />                  <p className="text-3xl font-bold text-pink-900">{stats.recentSubmissions}</p>

            </CardContent>                </div>

          </Card>                <TrendingUp className="h-8 w-8 text-pink-500" />

              </div>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">            </CardContent>

            <CardContent className="p-6">          </Card>

              <div className="flex items-center justify-between mb-4">        </div>

                <div className="p-3 bg-orange-100 rounded-lg">

                  <MessageSquare className="h-6 w-6 text-orange-600" />        {/* Main Content Tabs */}

                </div>        <Tabs defaultValue="overview" className="space-y-6">

                {stats.pendingDoubts > 0 && <AlertTriangle className="h-5 w-5 text-orange-500" />}          <TabsList className="grid w-full grid-cols-4">

              </div>            <TabsTrigger value="overview">Overview</TabsTrigger>

              <p className="text-sm font-medium text-gray-600">Pending Doubts</p>            <TabsTrigger value="assignments">Assignments</TabsTrigger>

              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingDoubts}</p>            <TabsTrigger value="doubts">Student Doubts</TabsTrigger>

              <p className="text-xs text-orange-500 mt-2">            <TabsTrigger value="analytics">Analytics</TabsTrigger>

                {stats.atRiskStudents} students need attention          </TabsList>

              </p>

            </CardContent>          <TabsContent value="overview" className="space-y-6">

          </Card>            {/* Recent Activity */}

        </div>            <Card>

              <CardHeader>

        {/* Quick Actions */}                <CardTitle className="flex items-center gap-2">

        <Card>                  <Clock className="h-5 w-5" />

          <CardHeader>                  Recent Activity

            <CardTitle className="flex items-center gap-2">                </CardTitle>

              <Zap className="h-5 w-5 text-yellow-500" />              </CardHeader>

              Quick Actions              <CardContent>

            </CardTitle>                {recentActivity.length === 0 ? (

            <CardDescription>AI-powered tools to enhance your teaching</CardDescription>                  <div className="text-center py-8">

          </CardHeader>                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />

          <CardContent>                    <p className="text-gray-600">No recent activity</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">                  </div>

              {quickActions.map((action, index) => {                ) : (

                const IconComponent = action.icon;                  <div className="space-y-4">

                const gradientColors = action.color.split(' ');                    {recentActivity.map((activity) => (

                const fromColor = gradientColors[0].replace('from-', '');                      <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">

                const toColor = gradientColors[1].replace('to-', '');                        <div className="flex items-center gap-3">

                                          {getActivityIcon(activity.type)}

                return (                          <div>

                  <button                            <p className="font-medium">{activity.title}</p>

                    key={index}                            <p className="text-sm text-gray-600">

                    onClick={action.action}                              {new Date(activity.timestamp).toLocaleString()}

                    className="group relative overflow-hidden rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"                            </p>

                    style={{                          </div>

                      background: `linear-gradient(135deg, var(--${fromColor}) 0%, var(--${toColor}) 100%)`,                        </div>

                      backgroundColor: '#8B5CF6',                        {activity.status && (

                    }}                          <Badge className={getStatusColor(activity.status)}>

                  >                            {activity.status}

                    <div className="relative z-10">                          </Badge>

                      <IconComponent className="h-10 w-10 text-white mb-3" />                        )}

                      <h3 className="text-lg font-bold text-white mb-1">{action.title}</h3>                      </div>

                      <p className="text-sm text-white/90">{action.description}</p>                    ))}

                      <ArrowRight className="h-5 w-5 text-white mt-3 group-hover:translate-x-2 transition-transform" />                  </div>

                    </div>                )}

                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />              </CardContent>

                  </button>            </Card>

                );          </TabsContent>

              })}

            </div>          <TabsContent value="assignments" className="space-y-6">

          </CardContent>            <div className="flex justify-between items-center">

        </Card>              <h3 className="text-2xl font-bold">Assignment Management</h3>

              <AssignmentDistribution 

        {/* Main Content Tabs */}                classrooms={state.classrooms} 

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">                onAssignmentCreated={() => loadDashboardData()}

          <TabsList className="grid w-full grid-cols-4 lg:w-auto">              />

            <TabsTrigger value="overview" className="gap-2">            </div>

              <Eye className="h-4 w-4" />            

              Overview            <Card>

            </TabsTrigger>              <CardContent className="p-8 text-center">

            <TabsTrigger value="students" className="gap-2">                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />

              <Users className="h-4 w-4" />                <h3 className="text-xl font-semibold mb-2">Assignment Distribution System</h3>

              Students                <p className="text-gray-600 mb-6">

            </TabsTrigger>                  Create and distribute assignments to your classrooms. Track submissions and provide feedback to students.

            <TabsTrigger value="analytics" className="gap-2">                </p>

              <BarChart3 className="h-4 w-4" />                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">

              Analytics                  <div className="p-4 bg-blue-50 rounded-lg">

            </TabsTrigger>                    <Plus className="h-6 w-6 text-blue-600 mb-2" />

            <TabsTrigger value="tools" className="gap-2">                    <h4 className="font-semibold text-blue-900">Create Assignments</h4>

              <Brain className="h-4 w-4" />                    <p className="text-sm text-blue-700">Design comprehensive assignments with due dates and point values</p>

              AI Tools                  </div>

            </TabsTrigger>                  <div className="p-4 bg-green-50 rounded-lg">

          </TabsList>                    <Users className="h-6 w-6 text-green-600 mb-2" />

                    <h4 className="font-semibold text-green-900">Distribute to Classes</h4>

          {/* Overview Tab */}                    <p className="text-sm text-green-700">Select multiple classrooms to receive the same assignment</p>

          <TabsContent value="overview" className="space-y-6">                  </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">                  <div className="p-4 bg-purple-50 rounded-lg">

              {/* Recent Students Activity */}                    <CheckCircle2 className="h-6 w-6 text-purple-600 mb-2" />

              <Card>                    <h4 className="font-semibold text-purple-900">Track Progress</h4>

                <CardHeader>                    <p className="text-sm text-purple-700">Monitor submission status and provide personalized feedback</p>

                  <CardTitle className="flex items-center gap-2">                  </div>

                    <Activity className="h-5 w-5" />                </div>

                    Recent Student Activity              </CardContent>

                  </CardTitle>            </Card>

                  <CardDescription>Students who were active recently</CardDescription>          </TabsContent>

                </CardHeader>

                <CardContent className="space-y-4">          <TabsContent value="doubts" className="space-y-6">

                  {recentStudents.length === 0 ? (            <DoubtsList 

                    <div className="text-center py-8">              onNewDoubt={() => {}}

                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />              onViewDoubt={() => {}}

                      <p className="text-gray-600">No student activity yet</p>              onSolveDoubt={() => loadDashboardData()}

                      <Button variant="outline" className="mt-4" onClick={() => navigate('/classrooms')}>            />

                        <Plus className="h-4 w-4 mr-2" />          </TabsContent>

                        Add Students

                      </Button>          <TabsContent value="analytics" className="space-y-6">

                    </div>            <Card>

                  ) : (              <CardContent className="p-8 text-center">

                    recentStudents.map((student) => (                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />

                      <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">                <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>

                        <div className="flex items-center gap-3">                <p className="text-gray-600">

                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">                  Comprehensive analytics and insights coming soon. Track student performance, identify learning patterns, and optimize your teaching strategies.

                            {student.name.charAt(0).toUpperCase()}                </p>

                          </div>              </CardContent>

                          <div>            </Card>

                            <p className="font-semibold text-gray-900">{student.name}</p>          </TabsContent>

                            <p className="text-sm text-gray-500">        </Tabs>

                              {student.assignmentsCompleted}/{student.totalAssignments} assignments      </div>

                            </p>    </PageLayout>

                          </div>  );

                        </div>};

                        <div className="text-right">

                          <Badge className={getPerformanceBadge(student.performance)}>export default TeacherDashboard;
                            {student.performance.replace('_', ' ')}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{student.progress}% progress</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
                {recentStudents.length > 0 && (
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('students')}>
                      View All Students
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                )}
              </Card>

              {/* Upcoming Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Assignments
                  </CardTitle>
                  <CardDescription>Deadlines and important dates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No upcoming deadlines</p>
                    <Button onClick={() => navigate('/assignments')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Student Progress Tracking</CardTitle>
                    <CardDescription>Monitor individual student performance and identify areas for improvement</CardDescription>
                  </div>
                  <Button onClick={() => navigate('/classrooms')}>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Students
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No students yet</h3>
                    <p className="text-gray-600 mb-6">Start by creating a classroom and inviting students</p>
                    <Button size="lg" onClick={() => navigate('/classrooms')}>
                      <Plus className="h-5 w-5 mr-2" />
                      Create Classroom
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentStudents.map((student) => (
                      <div key={student.id} className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-500">{student.email}</p>
                            </div>
                          </div>
                          <Badge className={getPerformanceBadge(student.performance)}>
                            {student.performance.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Overall Progress</span>
                            <span className="font-semibold">{student.progress}%</span>
                          </div>
                          <Progress value={student.progress} className="h-2" />
                          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                            <div className="text-sm">
                              <p className="text-gray-500">Assignments</p>
                              <p className="font-semibold">{student.assignmentsCompleted}/{student.totalAssignments}</p>
                            </div>
                            <div className="text-sm">
                              <p className="text-gray-500">Last Active</p>
                              <p className="font-semibold">{new Date(student.lastActive).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Class Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-600 mb-2">{stats.averageProgress}%</div>
                    <p className="text-gray-600">Average Class Progress</p>
                    <Progress value={stats.averageProgress} className="mt-4" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Engagement Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-600 mb-2">
                      {stats.totalStudents > 0 ? Math.floor((stats.submissionsToday / stats.totalStudents) * 100) : 0}%
                    </div>
                    <p className="text-gray-600">Active Today</p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">+12% from last week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attention Needed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-orange-600 mb-2">{stats.atRiskStudents}</div>
                    <p className="text-gray-600">Students at Risk</p>
                    <Button variant="outline" className="mt-4" onClick={() => setActiveTab('students')}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Analytics Dashboard</CardTitle>
                <CardDescription>Comprehensive insights into class performance and learning patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8 text-center">
                  <PieChart className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Advanced Analytics Available</h3>
                  <p className="text-gray-600 mb-6">
                    Get detailed insights on student performance, learning patterns, and areas of improvement
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                      <h4 className="font-semibold mb-1">Performance Trends</h4>
                      <p className="text-sm text-gray-600">Track progress over time</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <Target className="h-8 w-8 text-green-600 mb-2" />
                      <h4 className="font-semibold mb-1">Learning Gaps</h4>
                      <p className="text-sm text-gray-600">Identify weak areas</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <Award className="h-8 w-8 text-purple-600 mb-2" />
                      <h4 className="font-semibold mb-1">Achievement Reports</h4>
                      <p className="text-sm text-gray-600">Generate detailed reports</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Quiz Creator */}
              <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FileQuestion className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>AI Quiz Creation Tool</CardTitle>
                      <Badge className="mt-1">Premium Feature</Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Generate custom quizzes with AI based on any topic or curriculum
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Multiple choice, true/false, and short answer questions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Difficulty level customization</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Instant answer key generation</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => navigate('/teacher-companion')}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Quiz
                  </Button>
                </CardFooter>
              </Card>

              {/* Worksheet Generator */}
              <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Worksheet Generator</CardTitle>
                      <Badge className="mt-1">Premium Feature</Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Create custom worksheets with practice problems and exercises
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Subject-specific problem generation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Print-ready PDF format</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Answer sheets included</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline" onClick={() => navigate('/teacher-companion')}>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Worksheet
                  </Button>
                </CardFooter>
              </Card>

              {/* Progress Tracking */}
              <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Student Progress Tracking</CardTitle>
                      <Badge className="mt-1 bg-green-100 text-green-800 border-green-200">Active</Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Monitor individual and class-wide progress with detailed analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Real-time progress updates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Performance trend analysis</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Identify at-risk students early</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline" onClick={() => setActiveTab('students')}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Progress
                  </Button>
                </CardFooter>
              </Card>

              {/* Priority Support */}
              <Card className="border-2 border-orange-200 hover:border-orange-400 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle>Priority Support</CardTitle>
                      <Badge className="mt-1 bg-orange-100 text-orange-800 border-orange-200">Premium</Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Get dedicated support for all your teaching needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">24/7 technical support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Direct access to education specialists</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Quick response time</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default TeacherDashboard;
