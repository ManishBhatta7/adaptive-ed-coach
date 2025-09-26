import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LearningStyle, learningStyleInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Edit, 
  Shield, 
  GraduationCap, 
  Users, 
  Activity, 
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  Settings,
  Save,
  X
} from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details?: string;
  type: 'login' | 'submission' | 'assignment' | 'classroom' | 'profile';
}

const Profile = () => {
  const { state, updateUserProfile } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, isAuthenticated, isLoading } = state;
  
  const [isEditing, setIsEditing] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    avatar: ''
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/profile' } });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name || '',
        bio: '',
        avatar: currentUser.avatar || ''
      });
      loadActivityLogs();
    }
  }, [currentUser]);

  const loadActivityLogs = async () => {
    if (!currentUser?.id) return;
    
    setLoadingActivity(true);
    try {
      // Fetch recent activity from various tables
      const activities: ActivityLog[] = [];
      
      // Get recent submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id, assignment_type, submitted_at, status')
        .eq('user_id', currentUser.id)
        .order('submitted_at', { ascending: false })
        .limit(10);

      if (submissions) {
        submissions.forEach(sub => {
          activities.push({
            id: `sub-${sub.id}`,
            action: `Submitted ${sub.assignment_type.replace('_', ' ')}`,
            timestamp: sub.submitted_at,
            details: `Status: ${sub.status}`,
            type: 'submission'
          });
        });
      }

      // Get recent doubts
      const { data: doubts } = await supabase
        .from('doubts')
        .select('id, title, created_at, status')
        .eq('student_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (doubts) {
        doubts.forEach(doubt => {
          activities.push({
            id: `doubt-${doubt.id}`,
            action: `Asked question: ${doubt.title}`,
            timestamp: doubt.created_at,
            details: `Status: ${doubt.status}`,
            type: 'assignment'
          });
        });
      }

      // Get classroom activities
      const { data: classroomJoins } = await supabase
        .from('classroom_students')
        .select(`
          id,
          joined_at,
          classrooms!inner (
            name
          )
        `)
        .eq('student_id', currentUser.id)
        .order('joined_at', { ascending: false })
        .limit(5);

      if (classroomJoins) {
        classroomJoins.forEach(join => {
          activities.push({
            id: `classroom-${join.id}`,
            action: `Joined classroom: ${join.classrooms.name}`,
            timestamp: join.joined_at,
            type: 'classroom'
          });
        });
      }

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivityLogs(activities.slice(0, 15)); // Keep latest 15 activities
      
    } catch (error) {
      console.error('Error loading activity logs:', error);
      // Create mock activity logs as fallback
      setActivityLogs([
        {
          id: 'mock-1',
          action: 'Profile viewed',
          timestamp: new Date().toISOString(),
          type: 'profile'
        },
        {
          id: 'mock-2',
          action: 'Dashboard accessed',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          type: 'login'
        }
      ]);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    try {
      await updateUserProfile({
        name: editForm.name,
        avatar: editForm.avatar
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'teacher':
        return <GraduationCap className="h-4 w-4 text-blue-600" />;
      case 'student':
        return <Users className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'teacher':
        return 'default';
      case 'student':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'assignment':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'classroom':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'login':
        return <Activity className="h-4 w-4 text-orange-500" />;
      case 'profile':
        return <User className="h-4 w-4 text-pink-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container py-10 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full inline-block mb-4"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!currentUser) {
    return (
      <PageLayout>
        <div className="container py-10">
          <div className="text-center">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
            <p className="text-muted-foreground mb-6">Please log in to view your profile.</p>
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Determine learning style information
  const primaryStyle = currentUser.primaryLearningStyle || LearningStyle.VISUAL;
  const secondaryStyle = currentUser.secondaryLearningStyle;
  const primaryStyleInfo = learningStyleInfo[primaryStyle];

  return (
    <PageLayout 
      title="My Profile" 
      subtitle="Manage your account, view your role, and track your activity"
      className="py-8"
    >
      <div className="container px-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <User className="mr-3 h-6 w-6 text-pink-600" />
            <h2 className="text-2xl font-bold text-gray-800">Profile Management</h2>
          </div>
          
          {!isEditing && (
            <Button 
              onClick={() => setIsEditing(true)} 
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/60 backdrop-blur-sm border border-pink-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <User className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="edit" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <Card className="lg:col-span-1 bg-white/60 backdrop-blur-sm border-pink-100">
                <CardHeader className="text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                    <AvatarFallback className="text-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-xl text-gray-800">{currentUser.name}</CardTitle>
                  <p className="text-sm text-gray-600">{currentUser.email}</p>
                  
                  {/* Role Badge */}
                  <div className="flex justify-center mt-3">
                    <Badge 
                      variant={getRoleBadgeVariant(currentUser.role || 'student')} 
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      {getRoleIcon(currentUser.role || 'student')}
                      <span className="capitalize">{currentUser.role || 'student'}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-pink-600">
                          {currentUser.performances?.length || 0}
                        </div>
                        <div className="text-xs text-gray-600">Submissions</div>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {currentUser.performances?.filter(p => p.score && p.score >= 80).length || 0}
                        </div>
                        <div className="text-xs text-gray-600">High Scores</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Member since:</span>
                        <span className="font-medium">
                          {new Date(currentUser.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last active:</span>
                        <span className="font-medium">
                          {formatDate(currentUser.lastActive)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Style & Performance */}
              <div className="lg:col-span-2 space-y-6">
                {/* Learning Style Card */}
                <Card className="bg-white/60 backdrop-blur-sm border-purple-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      Learning Style Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {primaryStyle ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2 text-purple-700">Primary Learning Style</h3>
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="py-1 border-purple-200">
                              {primaryStyleInfo.title}
                            </Badge>
                            <p className="text-sm text-gray-700">{primaryStyleInfo.description}</p>
                          </div>
                        </div>

                        {secondaryStyle && (
                          <div>
                            <h3 className="font-medium mb-2 text-blue-700">Secondary Learning Style</h3>
                            <div className="flex items-start gap-3">
                              <Badge variant="outline" className="py-1 border-blue-200">
                                {learningStyleInfo[secondaryStyle].title}
                              </Badge>
                              <p className="text-sm text-gray-700">{learningStyleInfo[secondaryStyle].description}</p>
                            </div>
                          </div>
                        )}

                        <div>
                          <h3 className="font-medium mb-2 text-green-700">Personalized Recommendations</h3>
                          <ul className="list-disc pl-5 space-y-1">
                            {primaryStyleInfo.recommendations.slice(0, 3).map((rec, index) => (
                              <li key={index} className="text-sm text-gray-700">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-600 mb-4">You haven't completed the learning style assessment yet.</p>
                        <Button variant="outline" asChild>
                          <a href="/learning-style">Take Learning Style Quiz</a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Performance */}
                <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Recent Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentUser.performances && currentUser.performances.length > 0 ? (
                      <div className="space-y-3">
                        {currentUser.performances.slice(0, 5).map((performance) => (
                          <div key={performance.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-800">{performance.title}</h4>
                              <p className="text-sm text-gray-600">
                                {performance.subjectArea} • {new Date(performance.date).toLocaleDateString()}
                              </p>
                            </div>
                            {performance.score !== undefined && (
                              <Badge 
                                variant={performance.score >= 80 ? 'default' : performance.score >= 60 ? 'secondary' : 'destructive'}
                              >
                                {performance.score}%
                              </Badge>
                            )}
                          </div>
                        ))}
                        <Button variant="outline" className="w-full mt-4" asChild>
                          <a href="/progress">View All Performance Data</a>
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No performance records yet.</p>
                        <Button variant="outline" asChild>
                          <a href="/submit">Submit Your First Assignment</a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border-pink-100">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit className="h-5 w-5 text-pink-600" />
                    Edit Profile Information
                  </div>
                  {isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={editForm.avatar || currentUser.avatar} alt={editForm.name} />
                    <AvatarFallback className="text-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                      {editForm.name.charAt(0).toUpperCase() || currentUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="text-center">
                    <Label htmlFor="avatar-url" className="text-sm font-medium">Avatar URL</Label>
                    <Input
                      id="avatar-url"
                      type="url"
                      value={editForm.avatar}
                      onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.value }))}
                      placeholder="https://example.com/avatar.jpg"
                      className="mt-1 border-pink-200 focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="border-pink-200 focus:border-pink-500"
                  />
                </div>

                {/* Bio Field */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us a bit about yourself..."
                    rows={3}
                    className="border-pink-200 focus:border-pink-500"
                  />
                </div>

                {/* Read-only Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={currentUser.email || ''}
                      disabled
                      className="bg-gray-50 border-gray-200"
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="role"
                        type="text"
                        value={currentUser.role || 'student'}
                        disabled
                        className="bg-gray-50 border-gray-200 capitalize flex-1"
                      />
                      {getRoleIcon(currentUser.role || 'student')}
                    </div>
                    <p className="text-xs text-gray-500">Role is managed by administrators</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditForm({
                        name: currentUser.name || '',
                        bio: '',
                        avatar: currentUser.avatar || ''
                      });
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={!editForm.name.trim()}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Recent Activity
                  </div>
                  <Badge variant="outline">{activityLogs.length} activities</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingActivity ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : activityLogs.length > 0 ? (
                  <div className="space-y-3">
                    {activityLogs.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                        <div className="mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{activity.action}</p>
                          {activity.details && (
                            <p className="text-sm text-gray-600">{activity.details}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent activity found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border-cyan-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cyan-600" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Account Information</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account ID:</span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {currentUser.id.slice(0, 8)}...
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Type:</span>
                        <span className="capitalize font-medium">{currentUser.role || 'student'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email Verified:</span>
                        <Badge variant="default" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href="/settings">
                          <Settings className="h-4 w-4 mr-2" />
                          App Settings
                        </a>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href="/learning-style">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Retake Learning Style Quiz
                        </a>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href="/progress">
                          <FileText className="h-4 w-4 mr-2" />
                          View Progress Report
                        </a>
                      </Button>
                    </div>
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

export default Profile;