import React from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'pulse' | 'dots';
  className?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
};

/**
 * Standard loading spinner component
 */
export const LoadingSpinner: React.FC<LoadingStateProps> = ({
  size = 'md',
  className
}) => {
  return (
    <Loader2 
      className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        className
      )}
      aria-label="Loading"
    />
  );
};

/**
 * Pulsing loading indicator
 */
export const LoadingPulse: React.FC<LoadingStateProps> = ({
  size = 'md',
  className
}) => {
  return (
    <div 
      className={cn(
        'rounded-full bg-primary animate-pulse',
        sizeClasses[size],
        className
      )}
      aria-label="Loading"
    />
  );
};

/**
 * Three-dot loading indicator
 */
export const LoadingDots: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('flex space-x-2', className)} role="status" aria-label="Loading">
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
    </div>
  );
};

/**
 * Main loading state component with message
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 'md',
  variant = 'spinner',
  className,
  fullScreen = false
}) => {
  const { t } = useTranslation();
  const displayMessage = message || (t('common.loading') as string);

  const LoadingIcon = {
    spinner: LoadingSpinner,
    pulse: LoadingPulse,
    dots: () => <LoadingDots />
  }[variant];

  const containerClasses = cn(
    'flex flex-col items-center justify-center',
    fullScreen ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50' : 'p-8',
    className
  );

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <LoadingIcon size={size} />
      {displayMessage && (
        <p className={cn('mt-4 text-muted-foreground', textSizeClasses[size])}>
          {displayMessage}
        </p>
      )}
    </div>
  );
};

/**
 * Inline loading indicator for buttons
 */
export const ButtonLoading: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <Loader2 
      className={cn('h-4 w-4 animate-spin mr-2', className)}
      aria-label="Loading"
    />
  );
};

/**
 * Skeleton loader for content placeholders
 */
export const Skeleton: React.FC<{
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}> = ({ 
  className, 
  variant = 'rectangular',
  width,
  height
}) => {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
      aria-label="Loading content"
    />
  );
};

/**
 * Card skeleton for loading cards
 */
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('border rounded-lg p-4 space-y-3', className)}>
      <Skeleton height={20} width="60%" variant="text" />
      <Skeleton height={16} width="100%" variant="text" />
      <Skeleton height={16} width="90%" variant="text" />
      <Skeleton height={16} width="70%" variant="text" />
    </div>
  );
};

/**
 * List skeleton for loading lists
 */
export const ListSkeleton: React.FC<{ 
  items?: number; 
  className?: string;
}> = ({ items = 3, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="70%" variant="text" />
            <Skeleton height={14} width="50%" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Progress bar loading indicator
 */
export const LoadingProgress: React.FC<{
  value?: number;
  message?: string;
  className?: string;
}> = ({ value, message, className }) => {
  const { t } = useTranslation();

  return (
    <div className={cn('w-full space-y-2', className)}>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        {value !== undefined ? (
          <div
            className="bg-primary h-full transition-all duration-300 ease-in-out"
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        ) : (
          <div
            className="bg-primary h-full animate-pulse"
            style={{ width: '100%' }}
            role="progressbar"
            aria-label="Loading"
          />
        )}
      </div>
      {value !== undefined && (
        <p className="text-xs text-muted-foreground text-right">
          {Math.round(value)}%
        </p>
      )}
    </div>
  );
};

/**
 * Full-page loading overlay
 */
export const LoadingOverlay: React.FC<{
  message?: string;
  progress?: number;
}> = ({ message, progress }) => {
  return (
    <div 
      className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-sm w-full mx-4 space-y-4">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" />
          {message && (
            <p className="mt-4 text-center text-foreground">{message}</p>
          )}
        </div>
        {progress !== undefined && (
          <LoadingProgress value={progress} />
        )}
      </div>
    </div>
  );
};

/**
 * Page loading indicator (replaces entire page content)
 */
export const PageLoading: React.FC<{ message?: string }> = ({ message }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingState
        message={message || (t('common.loading') as string)}
        size="lg"
        variant="spinner"
      />
    </div>
  );
};

/**
 * Suspense fallback component
 */
export const SuspenseFallback: React.FC<{ message?: string }> = ({ message }) => {
  return <PageLoading message={message} />;
};

export default LoadingState;
