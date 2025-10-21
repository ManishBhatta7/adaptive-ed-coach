import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  AlertTriangle, 
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Target,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Plus,
  Send,
  Eye,
  EyeOff,
  Filter,
  Search,
  Star
} from 'lucide-react';

interface InterventionAlert {
  id: string;
  student_id: string;
  student_name: string;
  student_avatar?: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  data_points: any;
  suggested_interventions: string[];
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

interface InterventionTemplate {
  id: string;
  name: string;
  description: string;
  intervention_type: string;
  content_template: string;
  estimated_duration: number;
  requires_meeting: boolean;
  is_system_template: boolean;
}

interface TeacherIntervention {
  id: string;
  student_id: string;
  student_name: string;
  student_avatar?: string;
  intervention_type: string;
  title: string;
  description: string;
  content: string;
  priority: number;
  status: string;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  completion_notes?: string;
  effectiveness_rating?: number;
  student_feedback?: string;
  created_at: string;
}

interface StudentSupportPlan {
  id: string;
  student_id: string;
  student_name: string;
  plan_name: string;
  description: string;
  goals: string[];
  current_challenges: string[];
  strategies_to_focus: string[];
  target_metacog_score: number;
  review_frequency: number;
  is_active: boolean;
  last_reviewed?: string;
  created_at: string;
}

export const TeacherInterventions: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('alerts');
  const [alerts, setAlerts] = useState<InterventionAlert[]>([]);
  const [interventions, setInterventions] = useState<TeacherIntervention[]>([]);
  const [templates, setTemplates] = useState<InterventionTemplate[]>([]);
  const [supportPlans, setSupportPlans] = useState<StudentSupportPlan[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<InterventionAlert | null>(null);
  const [selectedIntervention, setSelectedIntervention] = useState<TeacherIntervention | null>(null);
  const [showNewInterventionDialog, setShowNewInterventionDialog] = useState(false);
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (state.currentUser && state.currentUser.role === 'teacher') {
      loadInterventionData();
    }
  }, [state.currentUser]);

  const loadInterventionData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadAlerts(),
        loadInterventions(),
        loadTemplates(),
        loadSupportPlans()
      ]);
    } catch (error) {
      console.error('Error loading intervention data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('intervention_alerts')
        .select(`
          *,
          profiles:student_id (
            name,
            avatar_url
          )
        `)
        .eq('teacher_id', state.currentUser.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading alerts:', error);
        return;
      }

      const alertList: InterventionAlert[] = (data || []).map((alert: any) => ({
        id: alert.id,
        student_id: alert.student_id,
        student_name: alert.profiles?.name || 'Unknown',
        student_avatar: alert.profiles?.avatar_url,
        alert_type: alert.alert_type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        data_points: alert.data_points,
        suggested_interventions: alert.suggested_interventions || [],
        is_read: alert.is_read,
        is_dismissed: alert.is_dismissed,
        created_at: alert.created_at
      }));

      setAlerts(alertList);

    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadInterventions = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('teacher_interventions')
        .select(`
          *,
          profiles:student_id (
            name,
            avatar_url
          )
        `)
        .eq('teacher_id', state.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading interventions:', error);
        return;
      }

      const interventionList: TeacherIntervention[] = (data || []).map((intervention: any) => ({
        id: intervention.id,
        student_id: intervention.student_id,
        student_name: intervention.profiles?.name || 'Unknown',
        student_avatar: intervention.profiles?.avatar_url,
        intervention_type: intervention.intervention_type,
        title: intervention.title,
        description: intervention.description,
        content: intervention.content,
        priority: intervention.priority,
        status: intervention.status,
        scheduled_for: intervention.scheduled_for,
        started_at: intervention.started_at,
        completed_at: intervention.completed_at,
        completion_notes: intervention.completion_notes,
        effectiveness_rating: intervention.effectiveness_rating,
        student_feedback: intervention.student_feedback,
        created_at: intervention.created_at
      }));

      setInterventions(interventionList);

    } catch (error) {
      console.error('Error loading interventions:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('intervention_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading templates:', error);
        return;
      }

      setTemplates(data || []);

    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadSupportPlans = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('student_support_plans')
        .select(`
          *,
          profiles:student_id (
            name
          )
        `)
        .eq('teacher_id', state.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading support plans:', error);
        return;
      }

      const planList: StudentSupportPlan[] = (data || []).map((plan: any) => ({
        id: plan.id,
        student_id: plan.student_id,
        student_name: plan.profiles?.name || 'Unknown',
        plan_name: plan.plan_name,
        description: plan.description,
        goals: plan.goals || [],
        current_challenges: plan.current_challenges || [],
        strategies_to_focus: plan.strategies_to_focus || [],
        target_metacog_score: plan.target_metacog_score,
        review_frequency: plan.review_frequency,
        is_active: plan.is_active,
        last_reviewed: plan.last_reviewed,
        created_at: plan.created_at
      }));

      setSupportPlans(planList);

    } catch (error) {
      console.error('Error loading support plans:', error);
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('intervention_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) {
        console.error('Error marking alert as read:', error);
        return;
      }

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));

    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('intervention_alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId);

      if (error) {
        console.error('Error dismissing alert:', error);
        return;
      }

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));

    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const createInterventionFromTemplate = async (templateId: string, studentId: string) => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase.rpc(
        'create_intervention_from_template',
        {
          p_teacher_id: state.currentUser.id,
          p_student_id: studentId,
          p_template_id: templateId
        }
      );

      if (error) {
        console.error('Error creating intervention:', error);
        return;
      }

      // Reload interventions
      await loadInterventions();
      setShowNewInterventionDialog(false);

    } catch (error) {
      console.error('Error creating intervention:', error);
    }
  };

  const updateInterventionStatus = async (interventionId: string, newStatus: string, notes?: string) => {
    try {
      const updateData: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      };

      if (newStatus === 'in_progress' && !interventions.find(i => i.id === interventionId)?.started_at) {
        updateData.started_at = new Date().toISOString();
      }

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
        if (notes) updateData.completion_notes = notes;
      }

      const { error } = await supabase
        .from('teacher_interventions')
        .update(updateData)
        .eq('id', interventionId);

      if (error) {
        console.error('Error updating intervention status:', error);
        return;
      }

      await loadInterventions();

    } catch (error) {
      console.error('Error updating intervention status:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'urgent': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high': return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'medium': return <Bell className="w-5 h-5 text-yellow-600" />;
      case 'low': return <Bell className="w-5 h-5 text-blue-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending': return <Calendar className="w-4 h-4 text-gray-600" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
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

  // Filter functions
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch = intervention.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intervention.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || intervention.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Alerts Tab Component
  const AlertsTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-md w-64"
          />
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
            <p className="text-gray-600">Great! All your students seem to be doing well.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity)} ${!alert.is_read ? 'shadow-lg' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{alert.title}</h4>
                        {!alert.is_read && <Badge variant="secondary">New</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{formatTimeAgo(alert.created_at)}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={alert.student_avatar} />
                    <AvatarFallback>{alert.student_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{alert.student_name}</div>
                    <div className="text-sm text-gray-600">{alert.alert_type.replace('_', ' ')}</div>
                  </div>
                </div>

                {alert.data_points && Object.keys(alert.data_points).length > 0 && (
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <h5 className="font-medium mb-2">Supporting Data:</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(alert.data_points).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key.replace('_', ' ')}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {!alert.is_read && (
                    <Button
                      onClick={() => markAlertAsRead(alert.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Mark Read
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setShowNewInterventionDialog(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Intervention
                  </Button>
                  <Button
                    onClick={() => dismissAlert(alert.id)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <EyeOff className="w-4 h-4" />
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Interventions Tab Component
  const InterventionsTab = () => (
    <div className="space-y-6">
      {/* Filters and New Button */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search interventions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border rounded-md w-64"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={() => setShowNewInterventionDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Intervention
        </Button>
      </div>

      {filteredInterventions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Interventions</h3>
            <p className="text-gray-600">Create targeted interventions to support your students.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInterventions.map((intervention) => (
            <Card key={intervention.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={intervention.student_avatar} />
                      <AvatarFallback>{intervention.student_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{intervention.title}</h4>
                        <Badge variant="outline">{intervention.intervention_type.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">for {intervention.student_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(intervention.status)}
                    <Badge
                      variant={
                        intervention.status === 'completed' ? 'secondary' :
                        intervention.status === 'in_progress' ? 'default' : 'outline'
                      }
                    >
                      {intervention.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{intervention.description}</p>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <h5 className="font-medium mb-2">Intervention Content:</h5>
                  <p className="text-sm whitespace-pre-wrap">{intervention.content}</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Priority: {intervention.priority}
                    </div>
                    {intervention.scheduled_for && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(intervention.scheduled_for).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="text-gray-500">{formatTimeAgo(intervention.created_at)}</div>
                </div>

                {intervention.effectiveness_rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Effectiveness:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= intervention.effectiveness_rating! ? 'text-yellow-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {intervention.status === 'pending' && (
                    <Button
                      onClick={() => updateInterventionStatus(intervention.id, 'in_progress')}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Start
                    </Button>
                  )}
                  {intervention.status === 'in_progress' && (
                    <Button
                      onClick={() => updateInterventionStatus(intervention.id, 'completed')}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Complete
                    </Button>
                  )}
                  <Button
                    onClick={() => setSelectedIntervention(intervention)}
                    variant="outline"
                    size="sm"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Support Plans Tab Component (simplified for brevity)
  const SupportPlansTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Student Support Plans</h3>
        <Button 
          onClick={() => setShowNewPlanDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Support Plan
        </Button>
      </div>

      {supportPlans.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Support Plans</h3>
            <p className="text-gray-600">Create personalized support plans for students who need extra help.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supportPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.plan_name}</CardTitle>
                  <Badge variant={plan.is_active ? 'default' : 'outline'}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-gray-600">for {plan.student_name}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{plan.description}</p>
                
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-sm">Goals:</span>
                    <div className="flex gap-1 mt-1">
                      {plan.goals.slice(0, 2).map((goal, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">{goal}</Badge>
                      ))}
                      {plan.goals.length > 2 && <span className="text-xs text-gray-500">+{plan.goals.length - 2} more</span>}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-sm">Target Score:</span> {plan.target_metacog_score}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-gray-500">
                    Review every {plan.review_frequency} days
                  </div>
                  <Button variant="outline" size="sm">View Plan</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (!state.currentUser || state.currentUser.role !== 'teacher') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This page is only accessible to teachers.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Interventions</h1>
          <p className="text-gray-600 mt-2">
            Monitor student progress and provide targeted support
          </p>
        </div>
        <div className="flex items-center gap-2">
          {alerts.filter(a => !a.is_read).length > 0 && (
            <Badge variant="destructive" className="text-sm">
              {alerts.filter(a => !a.is_read).length} unread
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alerts ({alerts.filter(a => !a.is_read).length})
          </TabsTrigger>
          <TabsTrigger value="interventions" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Interventions ({interventions.filter(i => i.status !== 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Support Plans ({supportPlans.filter(p => p.is_active).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-6">
          <AlertsTab />
        </TabsContent>

        <TabsContent value="interventions" className="mt-6">
          <InterventionsTab />
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <SupportPlansTab />
        </TabsContent>
      </Tabs>

      {/* New Intervention Dialog */}
      <Dialog open={showNewInterventionDialog} onOpenChange={setShowNewInterventionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Intervention</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAlert && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Creating intervention for: <strong>{selectedAlert.student_name}</strong> - {selectedAlert.title}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-3">
              <h4 className="font-medium">Suggested Templates:</h4>
              <div className="grid gap-2">
                {templates.filter(t => t.is_system_template).slice(0, 3).map((template) => (
                  <div key={template.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">{template.name}</h5>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{template.intervention_type.replace('_', ' ')}</Badge>
                          <span className="text-xs text-gray-500">{template.estimated_duration} min</span>
                          {template.requires_meeting && <Badge variant="secondary" className="text-xs">Requires meeting</Badge>}
                        </div>
                      </div>
                      <Button
                        onClick={() => selectedAlert && createInterventionFromTemplate(template.id, selectedAlert.student_id)}
                        size="sm"
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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