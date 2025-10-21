import { showInfo } from './errorHandler';
import i18next from 'i18next';

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  timeout?: number;
}

export interface RetryState {
  attempt: number;
  totalAttempts: number;
  lastError?: Error;
  isRetrying: boolean;
}

/**
 * Retry an async operation with configurable backoff strategy
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry,
    shouldRetry,
    timeout
  } = options;

  let lastError: Error = new Error('Operation failed');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wrap operation with timeout if specified
      if (timeout) {
        return await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), timeout)
          )
        ]);
      }

      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (attempt < maxRetries) {
        const shouldAttemptRetry = shouldRetry 
          ? shouldRetry(lastError, attempt + 1)
          : true;

        if (!shouldAttemptRetry) {
          throw lastError;
        }

        // Calculate wait time based on backoff strategy
        const waitTime = backoff === 'exponential'
          ? delay * Math.pow(2, attempt)
          : delay * (attempt + 1);

        // Notify caller of retry attempt
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

/**
 * Retry with user feedback - shows toast notifications on retry
 */
export async function retryWithFeedback<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T> {
  return retryOperation(operation, {
    ...options,
    onRetry: (attempt, error) => {
      showInfo(
        i18next.t('common.retrying', { defaultValue: 'Retrying...' }) as string,
        i18next.t('common.retryAttempt', {
          defaultValue: `Attempt ${attempt} of ${options.maxRetries || 3}`,
          attempt,
          max: options.maxRetries || 3
        }) as string,
        2000
      );

      // Call original onRetry if provided
      if (options.onRetry) {
        options.onRetry(attempt, error);
      }
    }
  });
}

/**
 * Retry only for network errors
 */
export async function retryOnNetworkError<T>(
  operation: () => Promise<T>,
  options: Omit<RetryOptions, 'shouldRetry'> = {}
): Promise<T> {
  return retryOperation(operation, {
    ...options,
    shouldRetry: (error) => {
      // Retry only if it's a network error or offline
      return (
        !navigator.onLine ||
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('NetworkError') ||
        error.name === 'NetworkError'
      );
    }
  });
}

/**
 * Retry with exponential backoff and jitter (randomization)
 */
export async function retryWithJitter<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    onRetry,
    shouldRetry,
    timeout
  } = options;

  let lastError: Error = new Error('Operation failed');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (timeout) {
        return await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), timeout)
          )
        ]);
      }

      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const shouldAttemptRetry = shouldRetry
          ? shouldRetry(lastError, attempt + 1)
          : true;

        if (!shouldAttemptRetry) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const baseWaitTime = delay * Math.pow(2, attempt);
        const jitter = Math.random() * 1000; // Add up to 1 second of randomization
        const waitTime = baseWaitTime + jitter;

        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

/**
 * Create a retryable version of a function
 */
export function makeRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: Parameters<T>) => {
    return retryOperation(() => fn(...args), options);
  }) as T;
}

/**
 * Batch retry - retry multiple operations together
 */
export async function retryBatch<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T[]> {
  const results: T[] = [];

  for (const operation of operations) {
    try {
      const result = await retryOperation(operation, options);
      results.push(result);
    } catch (error) {
      console.error('Batch operation failed after retries:', error);
      throw error;
    }
  }

  return results;
}

/**
 * Retry with conditional logic
 */
export async function retryIf<T>(
  condition: () => boolean | Promise<boolean>,
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const conditionResult = await Promise.resolve(condition());

  if (conditionResult) {
    return retryOperation(operation, options);
  }

  return operation();
}

/**
 * Create a retry manager for tracking state
 */
export class RetryManager {
  private state: RetryState = {
    attempt: 0,
    totalAttempts: 0,
    isRetrying: false
  };

  private listeners: Array<(state: RetryState) => void> = [];

  async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    this.state.isRetrying = true;
    this.state.totalAttempts = options.maxRetries || 3;
    this.notifyListeners();

    try {
      const result = await retryOperation(operation, {
        ...options,
        onRetry: (attempt, error) => {
          this.state.attempt = attempt;
          this.state.lastError = error;
          this.notifyListeners();

          if (options.onRetry) {
            options.onRetry(attempt, error);
          }
        }
      });

      this.state.isRetrying = false;
      this.state.attempt = 0;
      this.state.lastError = undefined;
      this.notifyListeners();

      return result;
    } catch (error) {
      this.state.isRetrying = false;
      this.state.lastError = error as Error;
      this.notifyListeners();
      throw error;
    }
  }

  getState(): Readonly<RetryState> {
    return { ...this.state };
  }

  subscribe(listener: (state: RetryState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}

export default {
  retryOperation,
  retryWithFeedback,
  retryOnNetworkError,
  retryWithJitter,
  makeRetryable,
  retryBatch,
  retryIf,
  RetryManager
};
