import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Download, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ImportLog {
  id: string;
  import_source: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  total_items: number;
  processed_items: number;
  successful_imports: number;
  failed_imports: number;
  error_details?: any;
  started_at: string;
  completed_at?: string;
}

interface ImportFilters {
  subject_area?: string;
  grade_level?: string;
  difficulty_level?: string;
}

const ContentImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [activeImport, setActiveImport] = useState<ImportLog | null>(null);
  const [filters, setFilters] = useState<ImportFilters>({});
  const [sourceUrl, setSourceUrl] = useState('');

  useEffect(() => {
    fetchImportLogs();
    const interval = setInterval(() => {
      if (activeImport && activeImport.status === 'in_progress') {
        checkImportStatus(activeImport.id);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeImport]);

  const fetchImportLogs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('import-content');
      
      if (error) throw error;
      
      setImportLogs(data || []);
    } catch (error) {
      console.error('Error fetching import logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch import logs",
        variant: "destructive"
      });
    }
  };

  const checkImportStatus = async (importId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('import-content', {
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (error) throw error;
      
      const logs = data || [];
      const currentLog = logs.find((log: ImportLog) => log.id === importId);
      
      if (currentLog) {
        setActiveImport(currentLog);
        if (currentLog.status === 'completed' || currentLog.status === 'failed') {
          setIsImporting(false);
          fetchImportLogs();
          
          if (currentLog.status === 'completed') {
            toast({
              title: "Import Completed",
              description: `Successfully imported ${currentLog.successful_imports} items`
            });
          } else {
            toast({
              title: "Import Failed",
              description: "The import process encountered errors",
              variant: "destructive"
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking import status:', error);
    }
  };

  const startImport = async () => {
    if (isImporting) return;

    setIsImporting(true);
    setActiveImport(null);

    try {
      const { data, error } = await supabase.functions.invoke('import-content', {
        body: {
          source_url: sourceUrl || 'Study Rays Network',
          filters: Object.keys(filters).length > 0 ? filters : undefined
        }
      });

      if (error) throw error;

      toast({
        title: "Import Started",
        description: "Content import has been initiated"
      });

      // Start polling for status
      if (data.import_id) {
        setTimeout(() => checkImportStatus(data.import_id), 2000);
      }

    } catch (error) {
      console.error('Error starting import:', error);
      setIsImporting(false);
      toast({
        title: "Import Failed",
        description: "Failed to start content import",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Configuration */}
      <Card className="bg-white/60 backdrop-blur-sm border-pink-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-pink-600" />
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Import Content from Study Rays Network
            </span>
          </CardTitle>
          <CardDescription>
            Fetch and import educational content from Study Rays Network into your platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source-url">Source URL (Optional)</Label>
              <Input
                id="source-url"
                placeholder="https://studyrays.com/api/content"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="border-pink-200 focus:border-pink-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Area Filter</Label>
              <Select onValueChange={(value) => setFilters(prev => ({ ...prev, subject_area: value }))}>
                <SelectTrigger className="border-pink-200 focus:border-pink-500">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subjects</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="literature">Literature</SelectItem>
                  <SelectItem value="computer_science">Computer Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade Level Filter</Label>
              <Select onValueChange={(value) => setFilters(prev => ({ ...prev, grade_level: value }))}>
                <SelectTrigger className="border-pink-200 focus:border-pink-500">
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All grades</SelectItem>
                  <SelectItem value="6th">6th Grade</SelectItem>
                  <SelectItem value="7th">7th Grade</SelectItem>
                  <SelectItem value="8th">8th Grade</SelectItem>
                  <SelectItem value="9th">9th Grade</SelectItem>
                  <SelectItem value="10th">10th Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty_level: value }))}>
                <SelectTrigger className="border-pink-200 focus:border-pink-500">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={startImport}
              disabled={isImporting}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Start Import
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchImportLogs}
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Import Progress */}
      {activeImport && activeImport.status === 'in_progress' && (
        <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              Import in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {activeImport.processed_items} / {activeImport.total_items}</span>
                <span>{Math.round((activeImport.processed_items / activeImport.total_items) * 100)}%</span>
              </div>
              <Progress 
                value={(activeImport.processed_items / activeImport.total_items) * 100} 
                className="h-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-600 font-medium">Successful: </span>
                {activeImport.successful_imports}
              </div>
              <div>
                <span className="text-red-600 font-medium">Failed: </span>
                {activeImport.failed_imports}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      <Card className="bg-white/60 backdrop-blur-sm border-pink-100">
        <CardHeader>
          <CardTitle className="text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Import History
          </CardTitle>
          <CardDescription>
            Recent content import activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {importLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No import history found
            </div>
          ) : (
            <div className="space-y-4">
              {importLogs.map((log) => (
                <div key={log.id} className="border border-pink-100 rounded-lg p-4 bg-white/80">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className="font-medium">{log.import_source}</span>
                      <Badge className={`${getStatusColor(log.status)} border`}>
                        {log.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(log.started_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total:</span> {log.total_items}
                    </div>
                    <div>
                      <span className="text-gray-600">Processed:</span> {log.processed_items}
                    </div>
                    <div>
                      <span className="text-green-600">Success:</span> {log.successful_imports}
                    </div>
                    <div>
                      <span className="text-red-600">Failed:</span> {log.failed_imports}
                    </div>
                  </div>

                  {log.error_details && (
                    <Alert className="mt-2 border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Import completed with {log.failed_imports} errors. 
                        {log.error_details.errors && ` First error: ${log.error_details.errors[0]}`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentImporter;