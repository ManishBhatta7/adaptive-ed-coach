import { logger } from './LoggingService';
import { toast } from '@/hooks/use-toast';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;

  private constructor() {}

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  // Handle and categorize errors
  handleError(error: Error, context: ErrorContext, showToUser = true): void {
    const errorCategory = this.categorizeError(error);
    
    logger.error(
      `${errorCategory}: ${error.message}`,
      error,
      { category: errorCategory, ...context.metadata },
      context.component
    );

    if (showToUser) {
      this.showUserFriendlyError(error, errorCategory);
    }

    // Track error for analytics
    this.trackError(error, errorCategory, context);
  }

  // Categorize errors for better handling
  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network Error';
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'Authentication Error';
    }
    if (message.includes('permission') || message.includes('forbidden')) {
      return 'Permission Error';
    }
    if (message.includes('timeout')) {
      return 'Timeout Error';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Validation Error';
    }
    if (message.includes('database') || message.includes('sql')) {
      return 'Database Error';
    }
    if (message.includes('api') || message.includes('service')) {
      return 'API Error';
    }
    
    return 'Application Error';
  }

  // Show user-friendly error messages
  private showUserFriendlyError(error: Error, category: string): void {
    let title = 'Something went wrong';
    let description = 'Please try again in a moment.';

    switch (category) {
      case 'Network Error':
        title = 'Connection Problem';
        description = 'Please check your internet connection and try again.';
        break;
      case 'Authentication Error':
        title = 'Authentication Required';
        description = 'Please log in again to continue.';
        break;
      case 'Permission Error':
        title = 'Access Denied';
        description = 'You don\'t have permission to perform this action.';
        break;
      case 'Timeout Error':
        title = 'Request Timeout';
        description = 'The operation took too long. Please try again.';
        break;
      case 'Validation Error':
        title = 'Invalid Input';
        description = 'Please check your input and try again.';
        break;
      case 'Database Error':
        title = 'Data Error';
        description = 'Unable to save or retrieve data. Please try again.';
        break;
      case 'API Error':
        title = 'Service Unavailable';
        description = 'Our service is temporarily unavailable. Please try again later.';
        break;
    }

    toast({
      title,
      description,
      variant: 'destructive'
    });
  }

  // Retry mechanism with exponential backoff
  async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    context: ErrorContext
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.info(
            `Retrying operation (attempt ${attempt}/${config.maxRetries})`,
            { attempt, maxRetries: config.maxRetries },
            context.component,
            context.action
          );
        }
        
        return await operation();
        
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === config.maxRetries) {
          logger.error(
            `Operation failed after ${config.maxRetries} retries`,
            lastError,
            { attempts: attempt + 1 },
            context.component
          );
          break;
        }
        
        // Calculate delay
        let delay = config.delay;
        if (config.backoff === 'exponential') {
          delay = config.delay * Math.pow(2, attempt);
        } else if (config.backoff === 'linear') {
          delay = config.delay * (attempt + 1);
        }
        
        // Add jitter to prevent thundering herd
        delay += Math.random() * 1000;
        
        logger.warn(
          `Operation failed, retrying in ${delay}ms`,
          { attempt: attempt + 1, delay, error: lastError.message },
          context.component
        );
        
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  // Circuit breaker pattern for external services
  private serviceStates = new Map<string, {
    failures: number;
    lastFailure?: Date;
    state: 'closed' | 'open' | 'half-open';
  }>();

  async withCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>,
    context: ErrorContext
  ): Promise<T> {
    const state = this.serviceStates.get(serviceName) || {
      failures: 0,
      state: 'closed' as const
    };

    const now = new Date();
    const timeSinceLastFailure = state.lastFailure 
      ? now.getTime() - state.lastFailure.getTime()
      : Infinity;

    // Check if circuit should be half-open
    if (state.state === 'open' && timeSinceLastFailure > 60000) { // 1 minute
      state.state = 'half-open';
      state.failures = 0;
    }

    // Reject if circuit is open
    if (state.state === 'open') {
      const error = new Error(`Service ${serviceName} is temporarily unavailable`);
      this.handleError(error, context);
      throw error;
    }

    try {
      const result = await operation();
      
      // Reset on success
      if (state.state === 'half-open') {
        state.state = 'closed';
        state.failures = 0;
        delete state.lastFailure;
        logger.info(`Circuit breaker closed for ${serviceName}`, {}, context.component);
      }
      
      this.serviceStates.set(serviceName, state);
      return result;
      
    } catch (error) {
      state.failures++;
      state.lastFailure = now;
      
      // Open circuit after 3 failures
      if (state.failures >= 3) {
        state.state = 'open';
        logger.warn(`Circuit breaker opened for ${serviceName}`, { failures: state.failures }, context.component);
      }
      
      this.serviceStates.set(serviceName, state);
      throw error;
    }
  }

  // Graceful degradation
  async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T> | T,
    context: ErrorContext
  ): Promise<T> {
    try {
      return await primary();
    } catch (error) {
        logger.warn(
          'Primary operation failed, using fallback',
          { error: (error as Error).message },
          context.component
        );
      
      return await fallback();
    }
  }

  // Track errors for analytics
  private trackError(error: Error, category: string, context: ErrorContext): void {
    // Track error patterns for monitoring
    logger.info('Error tracked', {
      errorName: error.name,
      errorMessage: error.message,
      category,
      component: context.component,
      action: context.action,
      userId: context.userId
    }, 'ErrorTracking');
  }

  // Input validation and sanitization
  validateAndSanitize(input: any, schema: any): { isValid: boolean; sanitized?: any; errors?: string[] } {
    try {
      const sanitized = schema.parse(input);
      return { isValid: true, sanitized };
    } catch (error: any) {
      const errors = error.errors?.map((err: any) => err.message) || [error.message];
      return { isValid: false, errors };
    }
  }

  // Rate limiting
  private rateLimits = new Map<string, { count: number; resetTime: number }>();

  checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(key);
    
    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (limit.count >= maxRequests) {
      return false;
    }
    
    limit.count++;
    return true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const errorHandler = ErrorHandlingService.getInstance();