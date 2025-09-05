import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Clock, 
  Database, 
  Download,
  Eye,
  RefreshCw,
  Shield,
  TrendingUp,
  Zap
} from 'lucide-react';
import { performanceMonitor } from '@/services/PerformanceMonitoringService';
import { logger } from '@/services/LoggingService';
import { securityService } from '@/services/SecurityService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface MonitoringDashboardProps {
  className?: string;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ className }) => {
  const [metrics, setMetrics] = useState(performanceMonitor.getMetricsSnapshot());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeData, setRealtimeData] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newMetrics = performanceMonitor.getMetricsSnapshot();
      setMetrics(newMetrics);
      
      // Add to realtime data for charts
      setRealtimeData(prev => {
        const newPoint = {
          timestamp: new Date().toLocaleTimeString(),
          memory: newMetrics.performance.memoryUsage,
          errorRate: newMetrics.performance.errorRate,
          renderTime: newMetrics.performance.renderTime,
          queryCount: newMetrics.database.queryCount
        };
        
        return [...prev.slice(-19), newPoint]; // Keep last 20 points
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    logger.info('Manual metrics refresh triggered', {}, 'MonitoringDashboard', 'refresh_metrics');
    
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newMetrics = performanceMonitor.getMetricsSnapshot();
    setMetrics(newMetrics);
    setIsRefreshing(false);
  };

  const downloadReport = () => {
    const performanceReport = performanceMonitor.generateReport();
    const securityReport = securityService.generateSecurityReport();
    
    const fullReport = {
      generatedAt: new Date().toISOString(),
      performance: JSON.parse(performanceReport),
      security: JSON.parse(securityReport)
    };
    
    const blob = new Blob([JSON.stringify(fullReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    logger.info('Monitoring report downloaded', {}, 'MonitoringDashboard', 'download_report');
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'destructive';
    if (value >= thresholds.warning) return 'secondary';
    return 'default';
  };

  const getPerformanceScore = () => {
    const factors = [
      { weight: 0.3, score: Math.max(0, 100 - (metrics.performance.loadTime / 50)) },
      { weight: 0.2, score: Math.max(0, 100 - (metrics.performance.memoryUsage * 2)) },
      { weight: 0.2, score: Math.max(0, 100 - metrics.performance.errorRate * 10) },
      { weight: 0.2, score: Math.max(0, 100 - (metrics.performance.renderTime / 2)) },
      { weight: 0.1, score: Math.max(0, 100 - (metrics.database.averageQueryTime / 5)) }
    ];
    
    return Math.round(factors.reduce((sum, factor) => sum + (factor.weight * factor.score), 0));
  };

  const performanceScore = getPerformanceScore();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time performance, security, and health metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline" 
            size="sm"
            onClick={downloadReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceScore}</div>
            <Progress value={performanceScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Overall system performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.performance.memoryUsage.toFixed(1)}MB
            </div>
            <Badge 
              variant={getStatusColor(metrics.performance.memoryUsage, { warning: 50, critical: 100 })}
              className="mt-2"
            >
              {metrics.performance.memoryUsage > 100 ? 'Critical' : 
               metrics.performance.memoryUsage > 50 ? 'Warning' : 'Good'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.performance.errorRate.toFixed(1)}%
            </div>
            <Badge 
              variant={getStatusColor(metrics.performance.errorRate, { warning: 2, critical: 5 })}
              className="mt-2"
            >
              {metrics.performance.errorRate > 5 ? 'Critical' : 
               metrics.performance.errorRate > 2 ? 'Warning' : 'Good'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Actions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.performance.userActions}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total interactions tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">
            <Zap className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="realtime">
            <BarChart3 className="h-4 w-4 mr-2" />
            Real-time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Load Times</CardTitle>
                <CardDescription>Page and component performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Page Load Time</span>
                  <span className="text-sm font-medium">
                    {metrics.performance.loadTime.toFixed(0)}ms
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (metrics.performance.loadTime / 5000) * 100)} 
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Render Time</span>
                  <span className="text-sm font-medium">
                    {metrics.performance.renderTime.toFixed(1)}ms
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (metrics.performance.renderTime / 100) * 100)} 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Performance</CardTitle>
                <CardDescription>External service response times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.performance.apiResponseTimes).map(([url, time]) => (
                    <div key={url} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm truncate flex-1 mr-2">
                          {url.split('/').pop() || url}
                        </span>
                        <span className="text-sm font-medium">
                          {time.toFixed(0)}ms
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (time / 2000) * 100)} 
                      />
                    </div>
                  ))}
                  {Object.keys(metrics.performance.apiResponseTimes).length === 0 && (
                    <p className="text-sm text-muted-foreground">No API calls recorded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Query Statistics</CardTitle>
                <CardDescription>Database performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics.database.queryCount}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Queries</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.database.averageQueryTime.toFixed(1)}ms
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Query Time</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {metrics.database.slowQueries}
                    </div>
                    <p className="text-sm text-muted-foreground">Slow Queries</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {metrics.database.connectionCount}
                    </div>
                    <p className="text-sm text-muted-foreground">Connections</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Query Health</CardTitle>
                <CardDescription>Performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Query Speed</span>
                      <span className="text-sm">
                        {metrics.database.averageQueryTime < 100 ? 'Excellent' :
                         metrics.database.averageQueryTime < 300 ? 'Good' :
                         metrics.database.averageQueryTime < 500 ? 'Fair' : 'Poor'}
                      </span>
                    </div>
                    <Progress 
                      value={Math.max(0, 100 - (metrics.database.averageQueryTime / 5))} 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Slow Query Rate</span>
                      <span className="text-sm">
                        {((metrics.database.slowQueries / Math.max(1, metrics.database.queryCount)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, (metrics.database.slowQueries / Math.max(1, metrics.database.queryCount)) * 500)} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Status</CardTitle>
              <CardDescription>Current security measures and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-medium">CSP Enabled</div>
                  <div className="text-xs text-muted-foreground">Content Security Policy</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium">Rate Limiting</div>
                  <div className="text-xs text-muted-foreground">Active Protection</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Eye className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm font-medium">Input Sanitization</div>
                  <div className="text-xs text-muted-foreground">XSS Protection</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Metrics</CardTitle>
              <CardDescription>Live system performance data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={realtimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="memory" 
                      stroke="#8884d8" 
                      name="Memory (MB)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="errorRate" 
                      stroke="#82ca9d" 
                      name="Error Rate (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="renderTime" 
                      stroke="#ffc658" 
                      name="Render Time (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;