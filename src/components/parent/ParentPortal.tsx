import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  User,
  TrendingUp,
  TrendingDown,
  Award,
  MessageCircle,
  Bell,
  Settings,
  Calendar,
  BookOpen,
  Brain,
  Users,
  Trophy,
  Star,
  Clock,
  Send,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface StudentProgress {
  student_id: string;
  student_name: string;
  student_avatar?: string;
  current_metacog_score: number;
  score_change: number;
  reflection_count: number;
  collaboration_count: number;
  achievement_count: number;
  recent_achievements: any[];
  last_activity: string;
  level_name?: string;
}

interface ParentNotification {
  id: string;
  notification_type: string;
  title: string;
  content: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  student_name?: string;
}

interface TeacherMessage {
  id: string;
  teacher_name: string;
  teacher_avatar?: string;
  student_name: string;
  sender_type: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  replied_to_message_id?: string;
}

interface StudentRelationship {
  student_id: string;
  student_name: string;
  student_avatar?: string;
  relationship_type: string;
  permission_level: string;
  is_primary_contact: boolean;
  approved_by_teacher: boolean;
  classroom_name?: string;
  teacher_name?: string;
}

export const ParentPortal: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [studentRelationships, setStudentRelationships] = useState<StudentRelationship[]>([]);
  const [studentProgress, setStudentProgress] = useState<{ [key: string]: StudentProgress }>({});
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [timeRange, setTimeRange] = useState('7');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (state.currentUser && state.currentUser.role === 'parent') {
      loadParentData();
    }
  }, [state.currentUser]);

  useEffect(() => {
    if (selectedChild) {
      loadStudentProgress(selectedChild);
    }
  }, [selectedChild, timeRange]);

  const loadParentData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadStudentRelationships(),
        loadNotifications(),
        loadMessages()
      ]);
    } catch (error) {
      console.error('Error loading parent data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentRelationships = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('parent_student_relationships')
        .select(`
          *,
          profiles:student_id (
            name,
            avatar_url
          )
        `)
        .eq('parent_id', state.currentUser.id)
        .eq('approved_by_teacher', true);

      if (error) {
        console.error('Error loading student relationships:', error);
        return;
      }

      const relationships: StudentRelationship[] = (data || []).map((rel: any) => ({
        student_id: rel.student_id,
        student_name: rel.profiles?.name || 'Unknown',
        student_avatar: rel.profiles?.avatar_url,
        relationship_type: rel.relationship_type,
        permission_level: rel.permission_level,
        is_primary_contact: rel.is_primary_contact,
        approved_by_teacher: rel.approved_by_teacher
      }));

      setStudentRelationships(relationships);

      // Auto-select first child if none selected
      if (relationships.length > 0 && !selectedChild) {
        setSelectedChild(relationships[0].student_id);
      }

    } catch (error) {
      console.error('Error loading student relationships:', error);
    }
  };

  const loadStudentProgress = async (studentId: string) => {
    if (!state.currentUser) return;

    try {
      // Use the database function to generate a progress report
      const { data, error } = await supabase.rpc(
        'generate_parent_progress_report',
        {
          p_student_id: studentId,
          p_parent_id: state.currentUser.id,
          p_period_days: parseInt(timeRange)
        }
      );

      if (error) {
        console.error('Error loading student progress:', error);
        return;
      }

      const progress: StudentProgress = {
        student_id: studentId,
        student_name: studentRelationships.find(r => r.student_id === studentId)?.student_name || 'Unknown',
        student_avatar: studentRelationships.find(r => r.student_id === studentId)?.student_avatar,
        current_metacog_score: data.current_metacog_score || 0,
        score_change: data.score_change || 0,
        reflection_count: data.reflection_count || 0,
        collaboration_count: data.collaboration_count || 0,
        achievement_count: data.achievement_count || 0,
        recent_achievements: data.recent_achievements || [],
        last_activity: data.generated_at,
        level_name: getDifficultyLevelName(data.current_metacog_score)
      };

      setStudentProgress(prev => ({ ...prev, [studentId]: progress }));

    } catch (error) {
      console.error('Error loading student progress:', error);
    }
  };

  const loadNotifications = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('parent_notifications')
        .select(`
          *,
          profiles:student_id (
            name
          )
        `)
        .eq('parent_id', state.currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      const notificationList: ParentNotification[] = (data || []).map((notif: any) => ({
        id: notif.id,
        notification_type: notif.notification_type,
        title: notif.title,
        content: notif.content,
        priority: notif.priority,
        is_read: notif.is_read,
        created_at: notif.created_at,
        student_name: notif.profiles?.name
      }));

      setNotifications(notificationList);

    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadMessages = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('parent_teacher_messages')
        .select(`
          *,
          teacher:teacher_id (
            name,
            avatar_url
          ),
          student:student_id (
            name
          )
        `)
        .eq('parent_id', state.currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const messageList: TeacherMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        teacher_name: msg.teacher?.name || 'Unknown Teacher',
        teacher_avatar: msg.teacher?.avatar_url,
        student_name: msg.student?.name || 'Unknown Student',
        sender_type: msg.sender_type,
        subject: msg.subject,
        message: msg.message,
        is_read: msg.is_read,
        created_at: msg.created_at,
        replied_to_message_id: msg.replied_to_message_id
      }));

      setMessages(messageList);

    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('parent_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!state.currentUser || !selectedChild || !selectedTeacher || !newMessageSubject.trim() || !newMessageContent.trim()) return;

    try {
      const { error } = await supabase
        .from('parent_teacher_messages')
        .insert({
          parent_id: state.currentUser.id,
          teacher_id: selectedTeacher,
          student_id: selectedChild,
          sender_type: 'parent',
          subject: newMessageSubject,
          message: newMessageContent
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessageSubject('');
      setNewMessageContent('');
      setShowNewMessageDialog(false);
      await loadMessages();

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getDifficultyLevelName = (score: number) => {
    if (score >= 0.8) return 'Expert';
    if (score >= 0.6) return 'Advanced';
    if (score >= 0.4) return 'Intermediate';
    if (score >= 0.2) return 'Novice';
    return 'Beginner';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'normal': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const currentProgress = selectedChild ? studentProgress[selectedChild] : null;

  // Overview Tab
  const OverviewTab = () => (
    <div className="space-y-6">
      {currentProgress ? (
        <>
          {/* Student Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={currentProgress.student_avatar} />
                    <AvatarFallback>{currentProgress.student_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{currentProgress.student_name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{currentProgress.level_name} Level</Badge>
                      <Badge variant={currentProgress.score_change >= 0 ? 'default' : 'destructive'}>
                        {currentProgress.score_change >= 0 ? '+' : ''}{(currentProgress.score_change * 100).toFixed(1)}% this {timeRange === '7' ? 'week' : 'period'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {(currentProgress.current_metacog_score * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Metacognition Score</div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Reflections</p>
                    <p className="text-2xl font-bold">{currentProgress.reflection_count}</p>
                  </div>
                  <Brain className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Collaboration</p>
                    <p className="text-2xl font-bold">{currentProgress.collaboration_count}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Achievements</p>
                    <p className="text-2xl font-bold">{currentProgress.achievement_count}</p>
                  </div>
                  <Trophy className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last Active</p>
                    <p className="text-sm font-medium">{formatTimeAgo(currentProgress.last_activity)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Achievements */}
          {currentProgress.recent_achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentProgress.recent_achievements.map((achievement: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium">{achievement.name}</div>
                          <div className="text-sm text-gray-600">{achievement.type}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-yellow-600">+{achievement.points} pts</div>
                        <div className="text-xs text-gray-500">
                          {formatTimeAgo(achievement.earned_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Progress chart visualization</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Showing {timeRange} days of metacognitive development
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Child</h3>
            <p className="text-gray-600">Choose a child from the dropdown to view their progress.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Notifications Tab
  const NotificationsTab = () => (
    <div className="space-y-4">
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <Card key={notification.id} className={`border-l-4 ${getPriorityColor(notification.priority)} ${!notification.is_read ? 'shadow-lg' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    notification.notification_type === 'achievement_earned' ? 'bg-yellow-100' :
                    notification.notification_type === 'low_performance' ? 'bg-red-100' :
                    notification.notification_type === 'teacher_message' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {notification.notification_type === 'achievement_earned' && <Trophy className="w-5 h-5 text-yellow-600" />}
                    {notification.notification_type === 'low_performance' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                    {notification.notification_type === 'teacher_message' && <MessageCircle className="w-5 h-5 text-blue-600" />}
                    {notification.notification_type === 'weekly_summary' && <Calendar className="w-5 h-5 text-green-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{notification.title}</h4>
                      {!notification.is_read && <Badge variant="secondary">New</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.content}</p>
                    {notification.student_name && (
                      <p className="text-xs text-gray-500 mt-1">Regarding: {notification.student_name}</p>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">{formatTimeAgo(notification.created_at)}</div>
              </div>
            </CardHeader>
            {!notification.is_read && (
              <CardContent className="pt-0">
                <Button 
                  onClick={() => markNotificationAsRead(notification.id)}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Read
                </Button>
              </CardContent>
            )}
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
            <p className="text-gray-600">You're all caught up! New notifications will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Messages Tab
  const MessagesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Communication with Teachers</h3>
        <Button onClick={() => setShowNewMessageDialog(true)} className="flex items-center gap-2">
          <Send className="w-4 h-4" />
          New Message
        </Button>
      </div>

      {messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className={!message.is_read ? 'border-blue-400 shadow-lg' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.teacher_avatar} />
                      <AvatarFallback>{message.teacher_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{message.teacher_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {message.sender_type === 'teacher' ? 'From Teacher' : 'From You'}
                        </Badge>
                        {!message.is_read && <Badge variant="secondary">Unread</Badge>}
                      </div>
                      <div className="text-sm text-gray-600">Re: {message.student_name}</div>
                      <div className="font-medium mt-1">{message.subject}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{formatTimeAgo(message.created_at)}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{message.message}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">Reply</Button>
                  {!message.is_read && (
                    <Button variant="ghost" size="sm">Mark as Read</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Messages</h3>
            <p className="text-gray-600">Start a conversation with your child's teacher.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (!state.currentUser || state.currentUser.role !== 'parent') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This portal is only accessible to parents and guardians.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parent Portal</h1>
          <p className="text-gray-600 mt-2">
            Monitor your child's metacognitive learning progress
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {studentRelationships.map((relationship) => (
                <SelectItem key={relationship.student_id} value={relationship.student_id}>
                  {relationship.student_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications ({notifications.filter(n => !n.is_read).length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Messages ({messages.filter(m => !m.is_read).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <MessagesTab />
        </TabsContent>
      </Tabs>

      {/* New Message Dialog */}
      <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Message to Teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Child:</label>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentRelationships.map((relationship) => (
                      <SelectItem key={relationship.student_id} value={relationship.student_id}>
                        {relationship.student_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Teacher:</label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher1">Ms. Johnson</SelectItem>
                    <SelectItem value="teacher2">Mr. Smith</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subject:</label>
              <input
                type="text"
                value={newMessageSubject}
                onChange={(e) => setNewMessageSubject(e.target.value)}
                placeholder="Message subject"
                className="w-full p-3 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message:</label>
              <Textarea
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[120px]"
              />
            </div>

            <div className="flex justify-between">
              <Button onClick={() => setShowNewMessageDialog(false)} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={sendMessage}
                disabled={!selectedChild || !selectedTeacher || !newMessageSubject.trim() || !newMessageContent.trim()}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      )}
    </div>
  );
};