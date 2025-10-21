import { toast } from '@/hooks/use-toast';
import i18next from 'i18next';

export interface ErrorOptions {
  title?: string;
  description?: string;
  retry?: () => void | Promise<void>;
  logToService?: boolean;
  duration?: number;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace?.(this, AppError);
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', 503, context);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTH_ERROR', 401, context);
    this.name = 'AuthenticationError';
  }
}

/**
 * Main error handler - displays user-friendly toast notifications
 */
export const handleError = (error: unknown, options?: ErrorOptions): void => {
  let errorMessage = i18next.t('errors.unknown') as string;
  let errorTitle = i18next.t('common.error') as string;
  let errorCode = 'UNKNOWN';

  // Parse error type
  if (error instanceof AppError) {
    errorMessage = error.message;
    errorCode = error.code;
    
    // Try to get translated error message
    const translatedError = i18next.t(`errors.${error.code.toLowerCase()}`);
    if (translatedError !== `errors.${error.code.toLowerCase()}`) {
      errorTitle = translatedError;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // Log error
  console.error('[Error Handler]', {
    code: errorCode,
    message: errorMessage,
    error,
    timestamp: new Date().toISOString(),
    options
  });

  // Optional: Log to external service (e.g., Sentry, LogRocket)
  if (options?.logToService && process.env.NODE_ENV === 'production') {
    // logToMonitoringService(error);
  }

  // Show user-friendly toast
  toast({
    title: options?.title || errorTitle,
    description: options?.description || errorMessage,
    variant: 'destructive',
    duration: options?.duration || 5000,
    action: options?.retry ? {
      label: i18next.t('common.retry') as string,
      onClick: () => {
        const retryFn = options.retry;
        if (retryFn) {
          Promise.resolve(retryFn()).catch((err) => {
            console.error('Retry failed:', err);
          });
        }
      }
    } : undefined
  });
};

/**
 * Network-specific error handler
 */
export const handleNetworkError = (
  error: unknown, 
  retry?: () => void | Promise<void>
): void => {
  const isOffline = !navigator.onLine;
  
  if (isOffline) {
    handleError(new NetworkError('No internet connection'), {
      title: i18next.t('errors.network') as string,
      description: i18next.t('common.offlineDescription') as string,
      retry
    });
  } else {
    handleError(error, {
      title: i18next.t('errors.network') as string,
      description: i18next.t('errors.networkDescription', {
        defaultValue: 'Network request failed. Please check your connection.'
      }) as string,
      retry
    });
  }
};

/**
 * Validation error handler
 */
export const handleValidationError = (
  error: unknown,
  fieldErrors?: Record<string, string>
): void => {
  let description = i18next.t('errors.validation') as string;
  
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    const errors = Object.entries(fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('\n');
    description = errors;
  }

  handleError(error, {
    title: i18next.t('errors.validationTitle', {
      defaultValue: 'Validation Error'
    }) as string,
    description
  });
};

/**
 * Authentication error handler
 */
export const handleAuthError = (error: unknown): void => {
  handleError(error, {
    title: i18next.t('errors.unauthorized') as string,
    description: i18next.t('errors.authDescription', {
      defaultValue: 'You need to sign in to access this resource.'
    }) as string
  });
};

/**
 * Success toast helper
 */
export const showSuccess = (
  title: string,
  description?: string,
  duration?: number
): void => {
  toast({
    title,
    description,
    duration: duration || 3000
  });
};

/**
 * Info toast helper
 */
export const showInfo = (
  title: string,
  description?: string,
  duration?: number
): void => {
  toast({
    title,
    description,
    duration: duration || 4000
  });
};

/**
 * Warning toast helper
 */
export const showWarning = (
  title: string,
  description?: string,
  duration?: number
): void => {
  toast({
    title,
    description,
    variant: 'default',
    duration: duration || 4000
  });
};

/**
 * Parse Supabase errors
 */
export const parseSupabaseError = (error: any): AppError => {
  if (!error) {
    return new AppError('Unknown error occurred', 'UNKNOWN');
  }

  const message = error.message || error.error_description || 'An error occurred';
  const code = error.code || error.error || 'UNKNOWN';
  const statusCode = error.status || error.statusCode;

  return new AppError(message, code, statusCode, { originalError: error });
};

/**
 * Safe async wrapper that catches errors
 */
export const safeAsync = async <T>(
  fn: () => Promise<T>,
  errorOptions?: ErrorOptions
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    handleError(error, errorOptions);
    return null;
  }
};

export default {
  handleError,
  handleNetworkError,
  handleValidationError,
  handleAuthError,
  showSuccess,
  showInfo,
  showWarning,
  parseSupabaseError,
  safeAsync,
  AppError,
  NetworkError,
  ValidationError,
  AuthenticationError
};
