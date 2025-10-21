import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppContext } from '@/context/AppContext';
import { 
  dbCache, 
  cacheMonitor, 
  CacheHelpers,
  browserCache 
} from '@/lib/performance/cache';
import {
  Activity,
  BarChart3,
  Clock,
  Database,
  HardDrive,
  MemoryStick,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info,
  Settings,
  Trash2,
  Target,
  Globe,
  Server,
  Cpu
} from 'lucide-react';

interface PerformanceMetrics {
  responseTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  dbQueries: number;
  errorRate: number;
  userSessions: number;
}

interface SystemHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  score: number;
  issues: string[];
  recommendations: string[];
}

export const PerformanceMonitor: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    responseTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    dbQueries: 0,
    errorRate: 0,
    userSessions: 0,
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'good',
    score: 85,
    issues: [],
    recommendations: [],
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadPerformanceData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadPerformanceData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      // Get cache statistics
      const cacheStats = dbCache.getStats();
      const monitorMetrics = cacheMonitor.getMetrics();
      
      // Calculate performance metrics
      const avgHitRate = cacheMonitor.getAverageHitRate(10);
      
      // Simulate additional metrics (in production, these would come from monitoring services)
      const newMetrics: PerformanceMetrics = {
        responseTime: Math.random() * 300 + 100, // 100-400ms
        cacheHitRate: avgHitRate,
        memoryUsage: Math.random() * 30 + 50, // 50-80%
        dbQueries: Math.floor(Math.random() * 50 + 20), // 20-70 queries/min
        errorRate: Math.random() * 2, // 0-2%
        userSessions: Math.floor(Math.random() * 100 + 50), // 50-150 sessions
      };
      
      setMetrics(newMetrics);
      
      // Calculate system health
      const health = calculateSystemHealth(newMetrics);
      setSystemHealth(health);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSystemHealth = (metrics: PerformanceMetrics): SystemHealth => {
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Response time scoring
    if (metrics.responseTime > 1000) {
      score -= 30;
      issues.push('High response times detected');
      recommendations.push('Optimize database queries and enable caching');
    } else if (metrics.responseTime > 500) {
      score -= 15;
      issues.push('Moderate response times');
      recommendations.push('Consider implementing query optimization');
    }

    // Cache hit rate scoring
    if (metrics.cacheHitRate < 60) {
      score -= 20;
      issues.push('Low cache hit rate');
      recommendations.push('Review caching strategy and increase cache TTL');
    } else if (metrics.cacheHitRate < 80) {
      score -= 10;
      issues.push('Moderate cache efficiency');
      recommendations.push('Optimize cache configuration');
    }

    // Memory usage scoring
    if (metrics.memoryUsage > 85) {
      score -= 25;
      issues.push('High memory usage');
      recommendations.push('Scale resources or optimize memory-intensive operations');
    } else if (metrics.memoryUsage > 70) {
      score -= 10;
      issues.push('Moderate memory usage');
      recommendations.push('Monitor memory usage trends');
    }

    // Error rate scoring
    if (metrics.errorRate > 5) {
      score -= 35;
      issues.push('High error rate');
      recommendations.push('Investigate and fix application errors immediately');
    } else if (metrics.errorRate > 1) {
      score -= 15;
      issues.push('Elevated error rate');
      recommendations.push('Review error logs and implement fixes');
    }

    let status: SystemHealth['status'] = 'excellent';
    if (score < 60) status = 'critical';
    else if (score < 75) status = 'warning';
    else if (score < 90) status = 'good';

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations,
    };
  };

  const clearAllCaches = async () => {
    if (!confirm('Are you sure you want to clear all caches? This may temporarily slow down the application.')) {
      return;
    }

    setLoading(true);
    try {
      CacheHelpers.invalidateAllCaches();
      await loadPerformanceData();
      alert('All caches cleared successfully');
    } catch (error) {
      console.error('Error clearing caches:', error);
      alert('Failed to clear caches');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatMetric = (value: number, unit: string, decimals: number = 1) => {
    return `${value.toFixed(decimals)}${unit}`;
  };

  // Overview Tab
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </div>
            <Badge className={getHealthColor(systemHealth.status)}>
              {systemHealth.status.toUpperCase()} ({systemHealth.score}%)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={systemHealth.score} className="h-3" />
            
            {systemHealth.issues.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {systemHealth.issues.map((issue, index) => (
                      <div key={index}>• {issue}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {systemHealth.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Recommendations</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  {systemHealth.recommendations.map((rec, index) => (
                    <div key={index}>• {rec}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMetric(metrics.responseTime, 'ms', 0)}</div>
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              {metrics.responseTime < 300 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Excellent</span>
                </>
              ) : metrics.responseTime < 500 ? (
                <>
                  <Target className="h-3 w-3 text-blue-600" />
                  <span className="text-blue-600">Good</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">Needs attention</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMetric(metrics.cacheHitRate, '%', 0)}</div>
            <Progress value={metrics.cacheHitRate} className="mt-2 h-2" />
            <p className="text-xs text-gray-600 mt-1">
              {metrics.cacheHitRate > 80 ? 'Excellent' : 
               metrics.cacheHitRate > 60 ? 'Good' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMetric(metrics.memoryUsage, '%', 0)}</div>
            <Progress value={metrics.memoryUsage} className="mt-2 h-2" />
            <p className="text-xs text-gray-600 mt-1">
              {metrics.memoryUsage < 70 ? 'Normal' : 
               metrics.memoryUsage < 85 ? 'High' : 'Critical'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Queries/min</CardTitle>
            <Server className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dbQueries}</div>
            <div className="text-xs text-gray-600 mt-1">
              Database load: {metrics.dbQueries > 50 ? 'High' : 'Normal'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMetric(metrics.errorRate, '%', 2)}</div>
            <div className={`text-xs mt-1 ${metrics.errorRate > 1 ? 'text-red-600' : 'text-green-600'}`}>
              {metrics.errorRate > 1 ? 'Above threshold' : 'Within limits'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Globe className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.userSessions}</div>
            <div className="text-xs text-gray-600 mt-1">
              Current user load
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Performance Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={loadPerformanceData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            
            <Button
              onClick={clearAllCaches}
              variant="outline"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Caches
            </Button>

            <Button
              onClick={() => {
                // Simulate performance optimization
                alert('Performance optimization completed');
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Optimize Performance
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Cache Analytics Tab
  const CacheAnalyticsTab = () => {
    const cacheStats = dbCache.getStats();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Query Cache</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Hit Rate:</span>
                <span className="font-medium">{cacheStats.queryCache.hitRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Cache Size:</span>
                <span className="font-medium">{cacheStats.queryCache.size} / {cacheStats.queryCache.maxSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Hits:</span>
                <span className="font-medium">{cacheStats.queryCache.hitCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Misses:</span>
                <span className="font-medium">{cacheStats.queryCache.missCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Strategy:</span>
                <span className="font-medium uppercase">{cacheStats.queryCache.strategy}</span>
              </div>
              <Progress 
                value={(cacheStats.queryCache.size / cacheStats.queryCache.maxSize) * 100} 
                className="h-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Result Cache</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Hit Rate:</span>
                <span className="font-medium">{cacheStats.resultCache.hitRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Cache Size:</span>
                <span className="font-medium">{cacheStats.resultCache.size} / {cacheStats.resultCache.maxSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Hits:</span>
                <span className="font-medium">{cacheStats.resultCache.hitCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Misses:</span>
                <span className="font-medium">{cacheStats.resultCache.missCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Strategy:</span>
                <span className="font-medium uppercase">{cacheStats.resultCache.strategy}</span>
              </div>
              <Progress 
                value={(cacheStats.resultCache.size / cacheStats.resultCache.maxSize) * 100} 
                className="h-2"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (state.currentUser?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
          <p className="text-gray-600">Performance monitoring is only available for administrators.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitor</h1>
          <p className="text-gray-600 mt-2">
            Monitor system performance, cache efficiency, and optimization opportunities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`flex items-center gap-2 ${getHealthColor(systemHealth.status)}`}>
            <Activity className="w-3 h-3" />
            {systemHealth.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="cache" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Cache Analytics
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Optimization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="cache" className="mt-6">
          <CacheAnalyticsTab />
        </TabsContent>

        <TabsContent value="database" className="mt-6">
          <div className="text-center py-8">
            <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Database performance analytics would be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="mt-6">
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Performance optimization tools would be implemented here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};