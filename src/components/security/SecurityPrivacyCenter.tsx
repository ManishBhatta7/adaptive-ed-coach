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
  Lock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Database,
  FileText,
  Key,
  Globe,
  Zap,
  Activity,
  Bell,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  MapPin,
  UserCheck,
  Users,
  School,
  BookOpen,
  Target,
  BarChart3,
  Mail,
  Phone,
  CreditCard,
  Home,
  Building,
  Flag,
  Info,
  X,
  Plus,
  Edit,
  Save,
  Copy,
  ExternalLink,
  Archive,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface SecuritySettings {
  id: string;
  two_factor_enabled: boolean;
  session_timeout_minutes: number;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
    password_expiry_days: number;
  };
  data_retention_days: number;
  encryption_enabled: boolean;
  audit_logging_enabled: boolean;
  ferpa_compliance_enabled: boolean;
  privacy_settings: {
    allow_analytics: boolean;
    allow_third_party_cookies: boolean;
    data_sharing_consent: boolean;
    marketing_consent: boolean;
  };
  ip_whitelist: string[];
  allowed_domains: string[];
  created_at: string;
  updated_at: string;
}

interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name?: string;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  details: any;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PrivacyRequest {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  request_type: 'export' | 'delete' | 'rectify' | 'restrict' | 'object';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  description?: string;
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
}

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reported_by: string;
  reported_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

interface DataAccessLog {
  id: string;
  user_id: string;
  user_name?: string;
  data_type: string;
  action: 'view' | 'export' | 'modify' | 'delete';
  student_id?: string;
  student_name?: string;
  accessed_at: string;
  justification?: string;
}

export const SecurityPrivacyCenter: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequest[]>([]);
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>([]);
  const [dataAccessLogs, setDataAccessLogs] = useState<DataAccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [securityScore, setSecurityScore] = useState(85);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedLogEntry, setSelectedLogEntry] = useState<AuditLogEntry | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    if (state.currentUser && (state.currentUser.role === 'admin' || state.currentUser.role === 'teacher')) {
      loadSecuritySettings();
      loadAuditLogs();
      loadPrivacyRequests();
      loadSecurityIncidents();
      loadDataAccessLogs();
    }
  }, [state.currentUser]);

  const loadSecuritySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading security settings:', error);
        return;
      }

      if (data) {
        setSecuritySettings(data);
      } else {
        // Create default settings
        const defaultSettings = {
          two_factor_enabled: false,
          session_timeout_minutes: 30,
          password_policy: {
            min_length: 8,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: true,
            require_symbols: false,
            password_expiry_days: 90,
          },
          data_retention_days: 365,
          encryption_enabled: true,
          audit_logging_enabled: true,
          ferpa_compliance_enabled: true,
          privacy_settings: {
            allow_analytics: false,
            allow_third_party_cookies: false,
            data_sharing_consent: false,
            marketing_consent: false,
          },
          ip_whitelist: [],
          allowed_domains: ['@school.edu'],
        };

        const { data: newSettings, error: createError } = await supabase
          .from('security_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (!createError) {
          setSecuritySettings(newSettings);
        }
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const startDate = new Date();
      switch (dateRange) {
        case '1d':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (
            name
          )
        `)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false })
        .limit(100);

      if (filterType !== 'all') {
        query = query.eq('action_type', filterType);
      }

      if (searchTerm) {
        query = query.or(`action_type.ilike.%${searchTerm}%,resource_type.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading audit logs:', error);
        return;
      }

      const logs: AuditLogEntry[] = (data || []).map((log: any) => ({
        id: log.id,
        user_id: log.user_id,
        user_name: log.profiles?.name,
        action_type: log.action_type,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        timestamp: log.timestamp,
        severity: log.severity,
      }));

      setAuditLogs(logs);

    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const loadPrivacyRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('privacy_requests')
        .select(`
          *,
          profiles:user_id (
            name,
            email
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error loading privacy requests:', error);
        return;
      }

      const requests: PrivacyRequest[] = (data || []).map((request: any) => ({
        id: request.id,
        user_id: request.user_id,
        user_name: request.profiles?.name,
        user_email: request.profiles?.email,
        request_type: request.request_type,
        status: request.status,
        description: request.description,
        requested_at: request.requested_at,
        processed_at: request.processed_at,
        processed_by: request.processed_by,
      }));

      setPrivacyRequests(requests);

    } catch (error) {
      console.error('Error loading privacy requests:', error);
    }
  };

  const loadSecurityIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_incidents')
        .select('*')
        .order('reported_at', { ascending: false });

      if (error) {
        console.error('Error loading security incidents:', error);
        return;
      }

      setSecurityIncidents(data || []);

    } catch (error) {
      console.error('Error loading security incidents:', error);
    }
  };

  const loadDataAccessLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('data_access_logs')
        .select(`
          *,
          user_profile:user_id (
            name
          ),
          student_profile:student_id (
            name
          )
        `)
        .order('accessed_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading data access logs:', error);
        return;
      }

      const accessLogs: DataAccessLog[] = (data || []).map((log: any) => ({
        id: log.id,
        user_id: log.user_id,
        user_name: log.user_profile?.name,
        data_type: log.data_type,
        action: log.action,
        student_id: log.student_id,
        student_name: log.student_profile?.name,
        accessed_at: log.accessed_at,
        justification: log.justification,
      }));

      setDataAccessLogs(accessLogs);

    } catch (error) {
      console.error('Error loading data access logs:', error);
    }
  };

  const updateSecuritySettings = async (newSettings: Partial<SecuritySettings>) => {
    if (!securitySettings) return;

    setLoading(true);
    try {
      const updatedSettings = { ...securitySettings, ...newSettings };
      
      const { error } = await supabase
        .from('security_settings')
        .update(updatedSettings)
        .eq('id', securitySettings.id);

      if (error) {
        throw error;
      }

      setSecuritySettings(updatedSettings);
      
      // Log the security settings change
      await logAuditEvent('security_settings_update', 'security_settings', securitySettings.id, {
        changes: newSettings,
      });

    } catch (error) {
      console.error('Error updating security settings:', error);
      alert('Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const logAuditEvent = async (actionType: string, resourceType: string, resourceId?: string, details?: any) => {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: state.currentUser?.id,
          action_type: actionType,
          resource_type: resourceType,
          resource_id: resourceId,
          details: details || {},
          ip_address: '127.0.0.1', // Would be actual IP in production
          user_agent: navigator.userAgent,
          severity: getSeverityLevel(actionType),
        });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  };

  const getSeverityLevel = (actionType: string): 'low' | 'medium' | 'high' | 'critical' => {
    if (actionType.includes('delete') || actionType.includes('security')) return 'high';
    if (actionType.includes('update') || actionType.includes('create')) return 'medium';
    return 'low';
  };

  const processPrivacyRequest = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('privacy_requests')
        .update({
          status: action === 'approve' ? 'completed' : 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: state.currentUser?.id,
          resolution_notes: notes,
        })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      await loadPrivacyRequests();
      await logAuditEvent('privacy_request_processed', 'privacy_request', requestId, {
        action,
        notes,
      });

    } catch (error) {
      console.error('Error processing privacy request:', error);
      alert('Failed to process privacy request');
    } finally {
      setLoading(false);
    }
  };

  const exportUserData = async (userId: string) => {
    setLoading(true);
    try {
      // This would typically call a backend API to generate and export user data
      const { data, error } = await supabase.rpc('export_user_data', {
        user_id_param: userId
      });

      if (error) {
        throw error;
      }

      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${userId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await logAuditEvent('user_data_export', 'user_data', userId);

    } catch (error) {
      console.error('Error exporting user data:', error);
      alert('Failed to export user data');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'resolved': return 'text-green-600 bg-green-100';
      case 'processing': case 'investigating': return 'text-blue-600 bg-blue-100';
      case 'pending': case 'open': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': case 'closed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Overview Tab
  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Security Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityScore}%</div>
            <Progress value={securityScore} className="mt-2" />
            <p className="text-xs text-gray-600 mt-1">
              {securityScore >= 90 ? 'Excellent' : securityScore >= 80 ? 'Good' : securityScore >= 70 ? 'Fair' : 'Needs Improvement'}
            </p>
          </CardContent>
        </Card>

        {/* FERPA Compliance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FERPA Compliance</CardTitle>
            <School className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Educational records protected
            </p>
          </CardContent>
        </Card>

        {/* Active Incidents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityIncidents.filter(i => i.status === 'open' || i.status === 'investigating').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Security incidents</p>
          </CardContent>
        </Card>

        {/* Privacy Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Privacy Requests</CardTitle>
            <User className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {privacyRequests.filter(r => r.status === 'pending' || r.status === 'processing').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Pending requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Data Encryption</span>
              </div>
              <Badge variant="outline" className="text-green-600">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Audit Logging</span>
              </div>
              <Badge variant="outline" className="text-green-600">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Two-Factor Auth</span>
              </div>
              <Badge variant="outline" className="text-yellow-600">Optional</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Session Management</span>
              </div>
              <Badge variant="outline" className="text-green-600">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">FERPA Compliance</span>
              </div>
              <Badge variant="outline" className="text-green-600">Compliant</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Data Retention</span>
              </div>
              <Badge variant="outline" className="text-blue-600">365 Days</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <X className="h-4 w-4 text-red-600" />
                <span className="text-sm">Third-party Cookies</span>
              </div>
              <Badge variant="outline" className="text-red-600">Disabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <X className="h-4 w-4 text-red-600" />
                <span className="text-sm">Analytics Tracking</span>
              </div>
              <Badge variant="outline" className="text-red-600">Disabled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge className={getSeverityColor(log.severity)}>
                    {log.severity}
                  </Badge>
                  <div>
                    <div className="font-medium text-sm">{log.action_type.replace('_', ' ').toUpperCase()}</div>
                    <div className="text-xs text-gray-600">by {log.user_name || 'Unknown'}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(log.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!state.currentUser || (state.currentUser.role !== 'admin' && state.currentUser.role !== 'teacher')) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-gray-600">Security and privacy settings are only available for administrators and teachers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security & Privacy Center</h1>
          <p className="text-gray-600 mt-2">
            Manage security settings, privacy controls, and FERPA compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            Security Score: {securityScore}%
          </Badge>
          <Badge variant="outline" className={securitySettings?.ferpa_compliance_enabled ? 'text-green-600' : 'text-red-600'}>
            <School className="w-3 h-3 mr-1" />
            {securitySettings?.ferpa_compliance_enabled ? 'FERPA Compliant' : 'FERPA Disabled'}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Incidents
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <School className="w-4 h-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        {/* Other tabs would be implemented here */}
        <TabsContent value="security" className="mt-6">
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Security settings panel would be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Privacy controls panel would be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Audit logs table would be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="mt-6">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Security incidents management would be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <div className="text-center py-8">
            <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">FERPA compliance dashboard would be implemented here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};