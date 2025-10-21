import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  Shield,
  Users,
  Settings,
  BarChart3,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  MapPin,
  User,
  School,
  BookOpen,
  Target,
  Brain,
  MessageSquare,
  FileText,
  Key,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Archive,
  Info,
  X,
  Save,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Home,
  Building,
  Flag
} from 'lucide-react';

interface SystemStats {
  total_users: number;
  active_users_today: number;
  total_assessments: number;
  assessments_today: number;
  total_classrooms: number;
  active_classrooms: number;
  system_health: 'excellent' | 'good' | 'warning' | 'critical';
  uptime_percentage: number;
  response_time_ms: number;
  database_size_mb: number;
  storage_used_gb: number;
  storage_total_gb: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  status: 'active' | 'inactive' | 'suspended';
  last_login: string;
  created_at: string;
  classrooms_count?: number;
  students_count?: number;
  assessments_count?: number;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  created_at: string;
  acknowledged: boolean;
  resolved: boolean;
}

interface PerformanceMetric {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  database_connections: number;
  response_time: number;
  active_users: number;
}

interface AISettings {
  model_name: string;
  api_endpoint: string;
  max_tokens: number;
  temperature: number;
  timeout_seconds: number;
  rate_limit_per_minute: number;
  fallback_enabled: boolean;
  content_filter_enabled: boolean;
  learning_analytics_enabled: boolean;
  personalization_enabled: boolean;
}

export const AdminDashboard: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (state.currentUser?.role === 'admin') {
      loadSystemStats();
      loadUsers();
      loadSystemAlerts();
      loadPerformanceData();
      loadAISettings();

      // Refresh data every 30 seconds
      const interval = setInterval(() => {
        loadSystemStats();
        loadPerformanceData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [state.currentUser]);

  const loadSystemStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_system_stats');
      
      if (error) {
        console.error('Error loading system stats:', error);
        return;
      }

      // Mock system stats with real data
      const stats: SystemStats = {
        total_users: data?.total_users || 0,
        active_users_today: data?.active_users_today || 0,
        total_assessments: data?.total_assessments || 0,
        assessments_today: data?.assessments_today || 0,
        total_classrooms: data?.total_classrooms || 0,
        active_classrooms: data?.active_classrooms || 0,
        system_health: 'good',
        uptime_percentage: 99.2,
        response_time_ms: 245,
        database_size_mb: 1250,
        storage_used_gb: 15.7,
        storage_total_gb: 100
      };

      setSystemStats(stats);

    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          role,
          created_at,
          last_login,
          status
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      const userData: UserData[] = (data || []).map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || 'active',
        last_login: user.last_login || user.created_at,
        created_at: user.created_at,
      }));

      setUsers(userData);

    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      // Mock system alerts - in production, these would come from monitoring systems
      const alerts: SystemAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'High Memory Usage',
          message: 'System memory usage is at 85%. Consider scaling resources.',
          created_at: new Date().toISOString(),
          acknowledged: false,
          resolved: false
        },
        {
          id: '2',
          type: 'info',
          title: 'Maintenance Window',
          message: 'Scheduled maintenance on Sunday 2:00 AM - 4:00 AM UTC.',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          acknowledged: true,
          resolved: false
        },
        {
          id: '3',
          type: 'success',
          title: 'Backup Completed',
          message: 'Daily database backup completed successfully.',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          acknowledged: true,
          resolved: true
        }
      ];

      setSystemAlerts(alerts);

    } catch (error) {
      console.error('Error loading system alerts:', error);
    }
  };

  const loadPerformanceData = async () => {
    try {
      // Mock performance data - in production, this would come from monitoring
      const now = new Date();
      const metrics: PerformanceMetric[] = [];

      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        metrics.push({
          timestamp: timestamp.toISOString(),
          cpu_usage: Math.random() * 40 + 30, // 30-70%
          memory_usage: Math.random() * 30 + 50, // 50-80%
          database_connections: Math.floor(Math.random() * 20 + 10), // 10-30
          response_time: Math.random() * 200 + 100, // 100-300ms
          active_users: Math.floor(Math.random() * 50 + 20) // 20-70 users
        });
      }

      setPerformanceData(metrics);

    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  const loadAISettings = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading AI settings:', error);
        return;
      }

      if (data) {
        setAiSettings(data);
      } else {
        // Default AI settings
        const defaultSettings: AISettings = {
          model_name: 'gpt-4',
          api_endpoint: 'https://api.openai.com/v1/chat/completions',
          max_tokens: 2000,
          temperature: 0.7,
          timeout_seconds: 30,
          rate_limit_per_minute: 60,
          fallback_enabled: true,
          content_filter_enabled: true,
          learning_analytics_enabled: true,
          personalization_enabled: true
        };
        setAiSettings(defaultSettings);
      }

    } catch (error) {
      console.error('Error loading AI settings:', error);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      await loadUsers();
      
      // Log admin action
      await supabase.rpc('log_audit_event', {
        p_action_type: 'user_status_update',
        p_resource_type: 'user',
        p_resource_id: userId,
        p_details: { new_status: newStatus },
        p_severity: 'medium'
      });

    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'teacher' | 'student') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      await loadUsers();
      
      // Log admin action
      await supabase.rpc('log_audit_event', {
        p_action_type: 'user_role_update',
        p_resource_type: 'user',
        p_resource_id: userId,
        p_details: { new_role: newRole },
        p_severity: 'high'
      });

    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      await loadUsers();
      
      // Log admin action
      await supabase.rpc('log_audit_event', {
        p_action_type: 'user_delete',
        p_resource_type: 'user',
        p_resource_id: userId,
        p_details: { deleted_by: state.currentUser?.id },
        p_severity: 'critical'
      });

    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    setSystemAlerts(alerts =>
      alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const resolveAlert = async (alertId: string) => {
    setSystemAlerts(alerts =>
      alerts.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  };

  const exportUserData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('export_all_user_data');

      if (error) {
        throw error;
      }

      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-600 bg-purple-100';
      case 'teacher': return 'text-blue-600 bg-blue-100';
      case 'student': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'success': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Overview Tab
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats?.total_users || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {systemStats?.active_users_today || 0} active today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats?.total_assessments || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {systemStats?.assessments_today || 0} completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classrooms</CardTitle>
            <School className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats?.total_classrooms || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {systemStats?.active_classrooms || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${getHealthColor(systemStats?.system_health || 'good')}`}>
              {systemStats?.system_health || 'Good'}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {systemStats?.uptime_percentage || 99}% uptime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">CPU Usage</span>
                </div>
                <span className="text-sm font-medium">45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MemoryStick className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Memory Usage</span>
                </div>
                <span className="text-sm font-medium">62%</span>
              </div>
              <Progress value={62} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Storage</span>
                </div>
                <span className="text-sm font-medium">
                  {systemStats?.storage_used_gb}GB / {systemStats?.storage_total_gb}GB
                </span>
              </div>
              <Progress value={(systemStats?.storage_used_gb || 0) / (systemStats?.storage_total_gb || 100) * 100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Network className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Response Time</span>
                </div>
                <span className="text-sm font-medium">{systemStats?.response_time_ms}ms</span>
              </div>
              <Progress value={Math.min((systemStats?.response_time_ms || 0) / 1000 * 100, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${alert.acknowledged ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <Badge className={getAlertColor(alert.type)}>
                        {alert.type}
                      </Badge>
                      <div>
                        <div className="font-medium text-sm">{alert.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{alert.message}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {!alert.acknowledged && (
                        <Button
                          onClick={() => acknowledgeAlert(alert.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                      )}
                      {!alert.resolved && (
                        <Button
                          onClick={() => resolveAlert(alert.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">New user registration</div>
                  <div className="text-xs text-gray-600">john.doe@example.com joined as Student</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">5 min ago</div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Assessment completed</div>
                  <div className="text-xs text-gray-600">Metacognitive Learning Assessment in Math 101</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">12 min ago</div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Security alert resolved</div>
                  <div className="text-xs text-gray-600">Failed login attempts from unknown IP</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">1 hour ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // User Management Tab
  const UserManagementTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">User Management</h3>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportUserData} variant="outline" disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => setShowUserDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="student">Student</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Last Login</th>
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getRoleColor(user.role)} variant="outline">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(user.status)} variant="outline">
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatDate(user.last_login)}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDialog(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Select
                          value={user.status}
                          onValueChange={(status: 'active' | 'inactive' | 'suspended') => 
                            updateUserStatus(user.id, status)
                          }
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => deleteUser(user.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (state.currentUser?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
          <p className="text-gray-600">This area is restricted to system administrators only.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            System administration and management center
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            System Health: {systemStats?.system_health || 'Good'}
          </Badge>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserManagementTab />
        </TabsContent>

        {/* Other tabs would be implemented here */}
        <TabsContent value="system" className="mt-6">
          <div className="text-center py-8">
            <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">System monitoring and configuration panel would be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">AI model configuration and settings would be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">System reports and analytics would be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">System configuration settings would be implemented here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};