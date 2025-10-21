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
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  Link,
  Unlink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  Download,
  Settings,
  Users,
  BookOpen,
  Target,
  BarChart3,
  Sync,
  Globe,
  Key,
  Shield,
  Database,
  CloudLightning,
  Zap,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Copy,
  Save,
  X,
  Info,
  AlertTriangle,
  FileText,
  Calendar
} from 'lucide-react';

interface LMSIntegration {
  id: string;
  lms_type: 'canvas' | 'blackboard' | 'moodle' | 'google_classroom' | 'schoology';
  lms_course_id: string;
  classroom_id: string;
  classroom_name?: string;
  connection_config: {
    api_url?: string;
    api_key?: string;
    client_id?: string;
    client_secret?: string;
    access_token?: string;
    refresh_token?: string;
    course_name?: string;
  };
  sync_enabled: boolean;
  last_sync_at?: string;
  sync_status: 'connected' | 'error' | 'disconnected';
  created_by: string;
  created_at: string;
}

interface SyncResult {
  id: string;
  integration_id: string;
  student_id: string;
  student_name?: string;
  assignment_type: string;
  assignment_id: string;
  metacog_score: number;
  lms_grade: number;
  sync_status: 'pending' | 'synced' | 'failed';
  synced_at?: string;
  error_message?: string;
}

interface LMSProvider {
  type: string;
  name: string;
  icon: string;
  description: string;
  features: string[];
  setup_fields: {
    field: string;
    label: string;
    type: 'text' | 'password' | 'url';
    required: boolean;
    placeholder: string;
  }[];
}

const LMS_PROVIDERS: LMSProvider[] = [
  {
    type: 'canvas',
    name: 'Canvas LMS',
    icon: '🎨',
    description: 'Popular open-source learning management system',
    features: ['Grade Passback', 'Roster Sync', 'Assignment Integration', 'Deep Linking'],
    setup_fields: [
      { field: 'api_url', label: 'Canvas API URL', type: 'url', required: true, placeholder: 'https://your-school.instructure.com' },
      { field: 'api_key', label: 'API Access Token', type: 'password', required: true, placeholder: 'Your Canvas API token' },
      { field: 'course_id', label: 'Course ID', type: 'text', required: true, placeholder: 'Canvas course ID' }
    ]
  },
  {
    type: 'blackboard',
    name: 'Blackboard Learn',
    icon: '⚫',
    description: 'Enterprise learning management system',
    features: ['Grade Passback', 'Single Sign-On', 'Content Integration'],
    setup_fields: [
      { field: 'api_url', label: 'Blackboard URL', type: 'url', required: true, placeholder: 'https://your-school.blackboard.com' },
      { field: 'client_id', label: 'Application Key', type: 'text', required: true, placeholder: 'Your app key' },
      { field: 'client_secret', label: 'Application Secret', type: 'password', required: true, placeholder: 'Your app secret' },
      { field: 'course_id', label: 'Course ID', type: 'text', required: true, placeholder: 'Blackboard course ID' }
    ]
  },
  {
    type: 'moodle',
    name: 'Moodle',
    icon: '🎓',
    description: 'Open source learning platform',
    features: ['Web Services API', 'Grade Integration', 'User Management'],
    setup_fields: [
      { field: 'api_url', label: 'Moodle URL', type: 'url', required: true, placeholder: 'https://your-school.moodle.com' },
      { field: 'api_key', label: 'Web Service Token', type: 'password', required: true, placeholder: 'Your Moodle token' },
      { field: 'course_id', label: 'Course ID', type: 'text', required: true, placeholder: 'Moodle course ID' }
    ]
  },
  {
    type: 'google_classroom',
    name: 'Google Classroom',
    icon: '📚',
    description: 'Google\'s free web service for schools',
    features: ['OAuth 2.0', 'Roster Sync', 'Assignment Distribution'],
    setup_fields: [
      { field: 'client_id', label: 'Client ID', type: 'text', required: true, placeholder: 'Google OAuth client ID' },
      { field: 'client_secret', label: 'Client Secret', type: 'password', required: true, placeholder: 'Google OAuth secret' },
      { field: 'course_id', label: 'Class ID', type: 'text', required: true, placeholder: 'Google Classroom ID' }
    ]
  },
  {
    type: 'schoology',
    name: 'Schoology',
    icon: '🏫',
    description: 'K-12 focused learning management system',
    features: ['REST API', 'Grade Sync', 'Resource Sharing'],
    setup_fields: [
      { field: 'api_url', label: 'Schoology URL', type: 'url', required: true, placeholder: 'https://your-school.schoology.com' },
      { field: 'client_id', label: 'Consumer Key', type: 'text', required: true, placeholder: 'Your consumer key' },
      { field: 'client_secret', label: 'Consumer Secret', type: 'password', required: true, placeholder: 'Your consumer secret' },
      { field: 'course_id', label: 'Section ID', type: 'text', required: true, placeholder: 'Schoology section ID' }
    ]
  }
];

export const LMSIntegration: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('integrations');
  const [integrations, setIntegrations] = useState<LMSIntegration[]>([]);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<LMSProvider | null>(null);
  const [setupData, setSetupData] = useState<{ [key: string]: string }>({});
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<LMSIntegration | null>(null);
  const [showPasswordFields, setShowPasswordFields] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (state.currentUser && state.currentUser.role === 'teacher') {
      loadIntegrations();
      loadSyncResults();
    }
  }, [state.currentUser]);

  const loadIntegrations = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('lms_integrations')
        .select(`
          *,
          classrooms:classroom_id (
            name
          )
        `)
        .eq('created_by', state.currentUser.id);

      if (error) {
        console.error('Error loading integrations:', error);
        return;
      }

      const integrationList: LMSIntegration[] = (data || []).map((integration: any) => ({
        id: integration.id,
        lms_type: integration.lms_type,
        lms_course_id: integration.lms_course_id,
        classroom_id: integration.classroom_id,
        classroom_name: integration.classrooms?.name,
        connection_config: integration.connection_config || {},
        sync_enabled: integration.sync_enabled,
        last_sync_at: integration.last_sync_at,
        sync_status: integration.sync_status,
        created_by: integration.created_by,
        created_at: integration.created_at
      }));

      setIntegrations(integrationList);

    } catch (error) {
      console.error('Error loading integrations:', error);
    }
  };

  const loadSyncResults = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('lms_grade_sync')
        .select(`
          *,
          profiles:student_id (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading sync results:', error);
        return;
      }

      const syncList: SyncResult[] = (data || []).map((sync: any) => ({
        id: sync.id,
        integration_id: sync.integration_id,
        student_id: sync.student_id,
        student_name: sync.profiles?.name,
        assignment_type: sync.assignment_type,
        assignment_id: sync.assignment_id,
        metacog_score: sync.metacog_score,
        lms_grade: sync.lms_grade,
        sync_status: sync.sync_status,
        synced_at: sync.synced_at,
        error_message: sync.error_message
      }));

      setSyncResults(syncList);

    } catch (error) {
      console.error('Error loading sync results:', error);
    }
  };

  const startSetup = (provider: LMSProvider) => {
    setSelectedProvider(provider);
    setSetupData({});
    setSelectedClassroom('');
    setShowSetupDialog(true);
  };

  const createIntegration = async () => {
    if (!state.currentUser || !selectedProvider || !selectedClassroom) return;

    setIsConnecting(true);
    try {
      // Test connection first
      const connectionTest = await testConnection(selectedProvider.type, setupData);
      
      if (!connectionTest.success) {
        throw new Error(connectionTest.error || 'Connection test failed');
      }

      // Create integration
      const { data, error } = await supabase
        .from('lms_integrations')
        .insert({
          lms_type: selectedProvider.type,
          lms_course_id: setupData.course_id || setupData.course_id,
          classroom_id: selectedClassroom,
          connection_config: setupData,
          sync_enabled: true,
          sync_status: 'connected',
          created_by: state.currentUser.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setShowSetupDialog(false);
      setSelectedProvider(null);
      setSetupData({});
      await loadIntegrations();

      // Show success message
      console.log('Integration created successfully');

    } catch (error) {
      console.error('Error creating integration:', error);
      alert(`Failed to create integration: ${error}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const testConnection = async (lmsType: string, config: any) => {
    // Mock connection test - in production, this would make actual API calls
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      setTimeout(() => {
        // Simulate success/failure
        if (config.api_key || config.client_id) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: 'Invalid credentials' });
        }
      }, 2000);
    });
  };

  const syncGrades = async (integrationId: string) => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.rpc('sync_lms_grades', {
        integration_id_param: integrationId
      });

      if (error) {
        throw error;
      }

      console.log(`Synced ${data} grades`);
      await loadSyncResults();

    } catch (error) {
      console.error('Error syncing grades:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSync = async (integrationId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('lms_integrations')
        .update({ sync_enabled: enabled })
        .eq('id', integrationId);

      if (error) {
        throw error;
      }

      await loadIntegrations();

    } catch (error) {
      console.error('Error toggling sync:', error);
    }
  };

  const deleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    try {
      const { error } = await supabase
        .from('lms_integrations')
        .delete()
        .eq('id', integrationId);

      if (error) {
        throw error;
      }

      await loadIntegrations();

    } catch (error) {
      console.error('Error deleting integration:', error);
    }
  };

  const getLMSIcon = (lmsType: string) => {
    const provider = LMS_PROVIDERS.find(p => p.type === lmsType);
    return provider?.icon || '🔗';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'disconnected': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // Integrations Tab
  const IntegrationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">LMS Integrations</h3>
          <p className="text-gray-600">Connect with external learning management systems</p>
        </div>
        <Button
          onClick={() => setShowSetupDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Integration
        </Button>
      </div>

      {/* Active Integrations */}
      {integrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getLMSIcon(integration.lms_type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg capitalize">
                        {integration.lms_type.replace('_', ' ')}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {integration.classroom_name}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(integration.sync_status)}>
                    {integration.sync_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Course ID</div>
                    <div className="font-medium">{integration.lms_course_id}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Last Sync</div>
                    <div className="font-medium">{formatDate(integration.last_sync_at)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={integration.sync_enabled}
                      onCheckedChange={(enabled) => toggleSync(integration.id, enabled)}
                    />
                    <Label className="text-sm">Auto Sync</Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => syncGrades(integration.id)}
                      variant="outline"
                      size="sm"
                      disabled={isSyncing}
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingIntegration(integration);
                        setShowConfigDialog(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteIntegration(integration.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Link className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No LMS Integrations</h3>
            <p className="text-gray-600 mb-4">
              Connect with your learning management system to sync grades and data.
            </p>
            <Button onClick={() => setShowSetupDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Sync History Tab
  const SyncHistoryTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Sync History</h3>
          <p className="text-gray-600">Track grade synchronization results</p>
        </div>
        <Button
          onClick={() => integrations.forEach(i => syncGrades(i.id))}
          disabled={isSyncing || integrations.length === 0}
          className="flex items-center gap-2"
        >
          <Sync className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync All
        </Button>
      </div>

      {syncResults.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">Student</th>
                    <th className="p-4 font-medium">Assignment</th>
                    <th className="p-4 font-medium">Metacog Score</th>
                    <th className="p-4 font-medium">LMS Grade</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Synced</th>
                  </tr>
                </thead>
                <tbody>
                  {syncResults.map((result) => (
                    <tr key={result.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium">{result.student_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-600">{result.student_id}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{result.assignment_type}</div>
                        <div className="text-sm text-gray-600">{result.assignment_id}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{(result.metacog_score * 100).toFixed(1)}%</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{result.lms_grade}/100</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={getSyncStatusColor(result.sync_status)}>
                          {result.sync_status}
                        </Badge>
                        {result.error_message && (
                          <div className="text-xs text-red-600 mt-1">
                            {result.error_message}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {formatDate(result.synced_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sync History</h3>
            <p className="text-gray-600">Grade sync results will appear here once you start syncing.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Documentation Tab
  const DocumentationTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">LMS Integration Guide</h3>
        <p className="text-gray-600">Learn how to set up and configure LMS integrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {LMS_PROVIDERS.map((provider) => (
          <Card key={provider.type}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="text-3xl">{provider.icon}</div>
                <div>
                  <CardTitle>{provider.name}</CardTitle>
                  <p className="text-sm text-gray-600">{provider.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {provider.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Required Fields</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {provider.setup_fields.filter(f => f.required).map((field, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      {field.label}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={() => startSetup(provider)}
                variant="outline"
                className="w-full"
              >
                Setup Guide
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (!state.currentUser || state.currentUser.role !== 'teacher') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Link className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Teacher Access Required</h3>
          <p className="text-gray-600">LMS integrations are only available for teachers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LMS Integration</h1>
          <p className="text-gray-600 mt-2">
            Connect with external learning management systems to sync grades and data
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Globe className="w-3 h-3" />
          {integrations.length} Active Integrations
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="sync-history" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Sync History
          </TabsTrigger>
          <TabsTrigger value="documentation" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-6">
          <IntegrationsTab />
        </TabsContent>

        <TabsContent value="sync-history" className="mt-6">
          <SyncHistoryTab />
        </TabsContent>

        <TabsContent value="documentation" className="mt-6">
          <DocumentationTab />
        </TabsContent>
      </Tabs>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProvider ? `Setup ${selectedProvider.name}` : 'Choose LMS Provider'}
            </DialogTitle>
          </DialogHeader>
          
          {!selectedProvider ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Choose your learning management system to set up integration:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LMS_PROVIDERS.map((provider) => (
                  <Button
                    key={provider.type}
                    onClick={() => startSetup(provider)}
                    variant="outline"
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <div className="text-2xl">{provider.icon}</div>
                    <div className="text-sm">{provider.name}</div>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl">{selectedProvider.icon}</div>
                <div>
                  <h3 className="font-semibold">{selectedProvider.name}</h3>
                  <p className="text-sm text-gray-600">{selectedProvider.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Select Classroom</Label>
                  <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a classroom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classroom1">Math 101</SelectItem>
                      <SelectItem value="classroom2">Science Advanced</SelectItem>
                      <SelectItem value="classroom3">History AP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedProvider.setup_fields.map((field) => (
                  <div key={field.field}>
                    <Label>{field.label} {field.required && '*'}</Label>
                    <div className="relative">
                      <Input
                        type={field.type === 'password' && !showPasswordFields[field.field] ? 'password' : 'text'}
                        value={setupData[field.field] || ''}
                        onChange={(e) => setSetupData(prev => ({ ...prev, [field.field]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="pr-10"
                      />
                      {field.type === 'password' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPasswordFields(prev => ({
                            ...prev,
                            [field.field]: !prev[field.field]
                          }))}
                        >
                          {showPasswordFields[field.field] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button
                  onClick={() => setSelectedProvider(null)}
                  variant="outline"
                >
                  Back
                </Button>
                <Button
                  onClick={createIntegration}
                  disabled={isConnecting || !selectedClassroom}
                  className="flex items-center gap-2"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link className="w-4 h-4" />
                  )}
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};