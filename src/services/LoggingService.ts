import { supabase } from "@/integrations/supabase/client";

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info', 
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class LoggingService {
  private static instance: LoggingService;
  private sessionId: string;
  private userId?: string;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.startPeriodicFlush();
    this.setupErrorListeners();
  }

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error,
    component?: string,
    action?: string,
    duration?: number
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.userId,
      sessionId: this.sessionId,
      component,
      action,
      duration,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
  }

  debug(message: string, context?: Record<string, any>, component?: string) {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context, undefined, component);
      console.debug('[DEBUG]', message, context);
      this.bufferLog(entry);
    }
  }

  info(message: string, context?: Record<string, any>, component?: string, action?: string) {
    const entry = this.createLogEntry(LogLevel.INFO, message, context, undefined, component, action);
    console.info('[INFO]', message, context);
    this.bufferLog(entry);
  }

  warn(message: string, context?: Record<string, any>, component?: string) {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, undefined, component);
    console.warn('[WARN]', message, context);
    this.bufferLog(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>, component?: string) {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error, component);
    console.error('[ERROR]', message, error, context);
    this.bufferLog(entry);
    this.immediateFlush(); // Flush errors immediately
  }

  critical(message: string, error?: Error, context?: Record<string, any>, component?: string) {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, context, error, component);
    console.error('[CRITICAL]', message, error, context);
    this.bufferLog(entry);
    this.immediateFlush(); // Flush critical errors immediately
  }

  // Performance monitoring
  startTimer(action: string, component?: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.info(`${action} completed`, { duration: `${duration.toFixed(2)}ms` }, component, action);
      
      // Log slow operations
      if (duration > 1000) {
        this.warn(`Slow operation detected: ${action}`, { duration: `${duration.toFixed(2)}ms` }, component);
      }
    };
  }

  // Database query logging
  logDatabaseQuery(query: string, table: string, duration?: number, error?: Error) {
    const context = { query, table, duration: duration ? `${duration}ms` : undefined };
    
    if (error) {
      this.error(`Database query failed`, error, context, 'Database');
    } else if (duration && duration > 500) {
      this.warn(`Slow database query`, context, 'Database');
    } else {
      this.debug(`Database query executed`, context, 'Database');
    }
  }

  // API call logging
  logAPICall(url: string, method: string, statusCode?: number, duration?: number, error?: Error) {
    const context = { url, method, statusCode, duration: duration ? `${duration}ms` : undefined };
    
    if (error) {
      this.error(`API call failed`, error, context, 'API');
    } else if (statusCode && statusCode >= 400) {
      this.warn(`API call returned error status`, context, 'API');
    } else if (duration && duration > 2000) {
      this.warn(`Slow API call`, context, 'API');
    } else {
      this.info(`API call completed`, context, 'API');
    }
  }

  // User action logging
  logUserAction(action: string, component: string, context?: Record<string, any>) {
    this.info(`User action: ${action}`, context, component, action);
  }

  private bufferLog(entry: LogEntry) {
    this.logBuffer.push(entry);
    
    // Prevent buffer overflow
    if (this.logBuffer.length > 100) {
      this.flushLogs();
    }
  }

  private startPeriodicFlush() {
    this.flushInterval = setInterval(() => {
      this.flushLogs();
    }, 10000); // Flush every 10 seconds
  }

  private immediateFlush() {
    this.flushLogs();
  }

  private async flushLogs() {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // In production, you might want to send to a dedicated logging service
      // For now, we'll store in Supabase (consider a separate logging table)
      
      if (process.env.NODE_ENV === 'production') {
        // Store critical errors and warnings in database
        const criticalLogs = logsToFlush.filter(log => 
          log.level === LogLevel.CRITICAL || log.level === LogLevel.ERROR
        );

        if (criticalLogs.length > 0) {
          await this.storeCriticalLogs(criticalLogs);
        }
      }
      
      // Send to external monitoring service if configured
      await this.sendToMonitoringService(logsToFlush);
      
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Put logs back in buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  private async storeCriticalLogs(logs: LogEntry[]) {
    try {
      // Store in a dedicated logs table or use existing tables
      // For now, we'll use learning_sessions table as an example
      const logEntries = logs.map(log => ({
        user_id: this.userId || '00000000-0000-0000-0000-000000000000',
        session_type: 'error_log',
        insights: {
          level: log.level,
          message: log.message,
          context: log.context,
          error: log.error,
          component: log.component,
          action: log.action,
          sessionId: log.sessionId,
          timestamp: log.timestamp
        }
      }));

      await supabase.from('learning_sessions').insert(logEntries);
    } catch (error) {
      console.error('Failed to store critical logs:', error);
    }
  }

  private async sendToMonitoringService(logs: LogEntry[]) {
    // Placeholder for external monitoring service integration
    // You could integrate with services like DataDog, LogRocket, Sentry, etc.
    
    if (process.env.NODE_ENV === 'development') {
      // In development, just log to console
      logs.forEach(log => {
        if (log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL) {
          console.group(`🚨 ${log.level.toUpperCase()}: ${log.message}`);
          console.log('Component:', log.component);
          console.log('Action:', log.action);
          console.log('Context:', log.context);
          console.log('Error:', log.error);
          console.groupEnd();
        }
      });
    }
  }

  private setupErrorListeners() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.critical('Unhandled JavaScript error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, 'Global');
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.critical('Unhandled promise rejection', new Error(event.reason), {
        reason: event.reason
      }, 'Global');
    });
  }

  // Analytics and metrics
  trackPageView(page: string, loadTime?: number) {
    this.info('Page view', { page, loadTime: loadTime ? `${loadTime}ms` : undefined }, 'Navigation', 'page_view');
  }

  trackFeatureUsage(feature: string, component: string, metadata?: Record<string, any>) {
    this.info('Feature used', { feature, ...metadata }, component, 'feature_usage');
  }

  trackPerformanceMetric(metric: string, value: number, unit: string, component?: string) {
    this.info('Performance metric', { metric, value, unit }, component, 'performance');
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushLogs(); // Final flush
  }
}

// Export singleton instance
export const logger = LoggingService.getInstance();