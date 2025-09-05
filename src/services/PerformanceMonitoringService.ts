import { logger } from './LoggingService';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  apiResponseTimes: Record<string, number>;
  errorRate: number;
  userActions: number;
}

export interface DatabaseMetrics {
  queryCount: number;
  averageQueryTime: number;
  slowQueries: number;
  connectionCount: number;
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetrics;
  private dbMetrics: DatabaseMetrics;
  private apiCallTimes: Record<string, number[]> = {};
  private renderTimes: number[] = [];
  private errorCount = 0;
  private totalRequests = 0;
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      apiResponseTimes: {},
      errorRate: 0,
      userActions: 0
    };

    this.dbMetrics = {
      queryCount: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      connectionCount: 0
    };

    this.initializePerformanceObservers();
    this.startMemoryMonitoring();
  }

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  // Initialize performance observers
  private initializePerformanceObservers(): void {
    if ('PerformanceObserver' in window) {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.loadTime = navEntry.loadEventEnd - navEntry.fetchStart;
            
            logger.info('Page load completed', {
              loadTime: `${this.metrics.loadTime.toFixed(2)}ms`,
              domContentLoaded: `${navEntry.domContentLoadedEventEnd - navEntry.fetchStart}ms`,
              firstPaint: navEntry.loadEventStart - navEntry.fetchStart,
            }, 'Performance', 'page_load');
          }
        });
      });

      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            const duration = resourceEntry.responseEnd - resourceEntry.requestStart;
            
            // Track slow resources
            if (duration > 1000) {
              logger.warn('Slow resource loading', {
                name: resourceEntry.name,
                duration: `${duration.toFixed(2)}ms`,
                size: resourceEntry.transferSize,
                type: resourceEntry.initiatorType
              }, 'Performance');
            }
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Observe long tasks
      if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'longtask') {
              logger.warn('Long task detected', {
                duration: `${entry.duration.toFixed(2)}ms`,
                startTime: entry.startTime
              }, 'Performance');
            }
          });
        });

        try {
          longTaskObserver.observe({ entryTypes: ['longtask'] });
          this.observers.push(longTaskObserver);
        } catch (e) {
          // Long tasks not supported in this browser
        }
      }
    }
  }

  // Start memory monitoring
  private startMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        
        // Warn about high memory usage
        if (this.metrics.memoryUsage > 100) {
          logger.warn('High memory usage detected', {
            used: `${this.metrics.memoryUsage.toFixed(2)}MB`,
            total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
            limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
          }, 'Performance');
        }
      }, 30000); // Check every 30 seconds
    }
  }

  // Track API call performance
  trackAPICall(url: string, duration: number, success: boolean): void {
    if (!this.apiCallTimes[url]) {
      this.apiCallTimes[url] = [];
    }
    
    this.apiCallTimes[url].push(duration);
    this.totalRequests++;
    
    if (!success) {
      this.errorCount++;
    }
    
    // Keep only last 100 calls for each endpoint
    if (this.apiCallTimes[url].length > 100) {
      this.apiCallTimes[url] = this.apiCallTimes[url].slice(-100);
    }
    
    // Calculate average response time
    const avgTime = this.apiCallTimes[url].reduce((a, b) => a + b, 0) / this.apiCallTimes[url].length;
    this.metrics.apiResponseTimes[url] = avgTime;
    
    // Calculate error rate
    this.metrics.errorRate = (this.errorCount / this.totalRequests) * 100;
    
    // Log slow API calls
    if (duration > 2000) {
      logger.warn('Slow API call', {
        url,
        duration: `${duration.toFixed(2)}ms`,
        averageTime: `${avgTime.toFixed(2)}ms`
      }, 'Performance');
    }
  }

  // Track database query performance
  trackDatabaseQuery(query: string, table: string, duration: number, success: boolean): void {
    this.dbMetrics.queryCount++;
    
    // Update average query time
    this.dbMetrics.averageQueryTime = (
      (this.dbMetrics.averageQueryTime * (this.dbMetrics.queryCount - 1) + duration) / 
      this.dbMetrics.queryCount
    );
    
    // Track slow queries
    if (duration > 500) {
      this.dbMetrics.slowQueries++;
      logger.warn('Slow database query', {
        table,
        duration: `${duration.toFixed(2)}ms`,
        query: query.substring(0, 100) + (query.length > 100 ? '...' : '')
      }, 'Database');
    }
    
    if (!success) {
      logger.error('Database query failed', undefined, { table, query }, 'Database');
    }
  }

  // Track component render time
  trackRenderTime(component: string, duration: number): void {
    this.renderTimes.push(duration);
    
    // Keep only last 100 render times
    if (this.renderTimes.length > 100) {
      this.renderTimes = this.renderTimes.slice(-100);
    }
    
    this.metrics.renderTime = this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
    
    // Log slow renders
    if (duration > 100) {
      logger.warn('Slow component render', {
        component,
        duration: `${duration.toFixed(2)}ms`,
        averageRenderTime: `${this.metrics.renderTime.toFixed(2)}ms`
      }, 'Performance');
    }
  }

  // Track user actions
  trackUserAction(action: string, component: string): void {
    this.metrics.userActions++;
    logger.trackFeatureUsage(action, component);
  }

  // Core Web Vitals
  measureCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        logger.info('LCP measured', {
          value: `${lastEntry.startTime.toFixed(2)}ms`,
          element: (lastEntry as any).element?.tagName
        }, 'Performance', 'core_web_vitals');
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        // LCP not supported
      }
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    if ('PerformanceObserver' in window) {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        logger.info('CLS measured', {
          value: clsValue.toFixed(4)
        }, 'Performance', 'core_web_vitals');
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        // CLS not supported
      }
    }
  }

  // Get current performance snapshot
  getMetricsSnapshot(): { performance: PerformanceMetrics; database: DatabaseMetrics } {
    return {
      performance: { ...this.metrics },
      database: { ...this.dbMetrics }
    };
  }

  // Generate performance report
  generateReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      performance: this.metrics,
      database: this.dbMetrics,
      recommendations: this.generateRecommendations()
    };
    
    return JSON.stringify(report, null, 2);
  }

  // Generate performance recommendations
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Check load time
    if (this.metrics.loadTime > 3000) {
      recommendations.push('Page load time is slow (>3s). Consider optimizing images, reducing bundle size, or implementing code splitting.');
    }
    
    // Check memory usage
    if (this.metrics.memoryUsage > 50) {
      recommendations.push('Memory usage is high (>50MB). Check for memory leaks and optimize component lifecycle.');
    }
    
    // Check API response times
    Object.entries(this.metrics.apiResponseTimes).forEach(([url, time]) => {
      if (time > 1000) {
        recommendations.push(`API endpoint ${url} is slow (${time.toFixed(2)}ms). Consider caching or optimization.`);
      }
    });
    
    // Check error rate
    if (this.metrics.errorRate > 5) {
      recommendations.push(`Error rate is high (${this.metrics.errorRate.toFixed(2)}%). Investigate and fix common errors.`);
    }
    
    // Check database performance
    if (this.dbMetrics.averageQueryTime > 200) {
      recommendations.push(`Database queries are slow (avg: ${this.dbMetrics.averageQueryTime.toFixed(2)}ms). Consider indexing or query optimization.`);
    }
    
    if (this.dbMetrics.slowQueries / this.dbMetrics.queryCount > 0.1) {
      recommendations.push('High percentage of slow database queries. Review and optimize query patterns.');
    }
    
    return recommendations;
  }

  // Clean up observers
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitoringService.getInstance();
