import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { TRANSITIONS } from '@/lib/animations';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface AnimatedToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: React.ReactNode;
  duration?: number;
  showProgress?: boolean;
  onClose?: () => void;
}

/**
 * Get icon for toast variant
 */
const getToastIcon = (variant: ToastVariant) => {
  switch (variant) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-600 animate-scale-in" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-600 animate-shake" />;
    case 'warning':
      return <AlertCircle className="h-5 w-5 text-orange-600 animate-pulse" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-600 animate-bounce" />;
    default:
      return null;
  }
};

/**
 * Get colors for toast variant
 */
const getToastColors = (variant: ToastVariant) => {
  switch (variant) {
    case 'success':
      return 'border-green-200 bg-green-50 text-green-900';
    case 'error':
      return 'border-red-200 bg-red-50 text-red-900';
    case 'warning':
      return 'border-orange-200 bg-orange-50 text-orange-900';
    case 'info':
      return 'border-blue-200 bg-blue-50 text-blue-900';
    default:
      return '';
  }
};

/**
 * Animated toast with progress bar
 */
export const AnimatedToast: React.FC<AnimatedToastProps & { open: boolean }> = ({
  title,
  description,
  variant = 'default',
  action,
  duration = 5000,
  showProgress = true,
  onClose,
  open
}) => {
  const [progress, setProgress] = React.useState(100);

  React.useEffect(() => {
    if (!open || !showProgress) return;

    const interval = 50; // Update every 50ms
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement;
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [open, duration, showProgress]);

  const icon = getToastIcon(variant);
  const colors = getToastColors(variant);

  return (
    <Toast
      open={open}
      onOpenChange={onClose}
      className={cn(
        'animate-slide-in-right overflow-hidden',
        TRANSITIONS.all,
        'hover:scale-105',
        colors
      )}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
        
        <div className="flex-1 min-w-0">
          {title && (
            <ToastTitle className="font-semibold animate-fade-in">
              {title}
            </ToastTitle>
          )}
          {description && (
            <ToastDescription className="text-sm opacity-90 animate-fade-in" style={{ animationDelay: '50ms' }}>
              {description}
            </ToastDescription>
          )}
          {action && (
            <div className="mt-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
              {action}
            </div>
          )}
        </div>

        <ToastClose className="hover:scale-110 transition-transform" />
      </div>

      {/* Progress bar */}
      {showProgress && open && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all ease-linear',
              variant === 'success' && 'bg-green-600',
              variant === 'error' && 'bg-red-600',
              variant === 'warning' && 'bg-orange-600',
              variant === 'info' && 'bg-blue-600',
              variant === 'default' && 'bg-primary'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </Toast>
  );
};

/**
 * Toast notification hook with animations
 */
export interface ToastOptions extends Omit<AnimatedToastProps, 'open'> {
  id?: string;
}

interface ToastState extends ToastOptions {
  id: string;
  open: boolean;
}

let toastCounter = 0;
const toastListeners = new Set<(toasts: ToastState[]) => void>();
let toasts: ToastState[] = [];

/**
 * Show an animated toast
 */
export const showToast = (options: ToastOptions) => {
  const id = options.id || `toast-${++toastCounter}`;
  
  const newToast: ToastState = {
    ...options,
    id,
    open: true
  };

  toasts = [...toasts, newToast];
  notifyListeners();

  // Auto-dismiss after duration
  const duration = options.duration || 5000;
  setTimeout(() => {
    dismissToast(id);
  }, duration);

  return id;
};

/**
 * Dismiss a toast
 */
export const dismissToast = (id: string) => {
  toasts = toasts.map((toast) =>
    toast.id === id ? { ...toast, open: false } : toast
  );
  notifyListeners();

  // Remove from array after animation
  setTimeout(() => {
    toasts = toasts.filter((toast) => toast.id !== id);
    notifyListeners();
  }, 300);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toasts = toasts.map((toast) => ({ ...toast, open: false }));
  notifyListeners();

  setTimeout(() => {
    toasts = [];
    notifyListeners();
  }, 300);
};

/**
 * Notify listeners of toast changes
 */
const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toasts]));
};

/**
 * Hook to use toast notifications
 */
export const useAnimatedToast = () => {
  const [currentToasts, setCurrentToasts] = React.useState<ToastState[]>(toasts);

  React.useEffect(() => {
    toastListeners.add(setCurrentToasts);
    return () => {
      toastListeners.delete(setCurrentToasts);
    };
  }, []);

  return {
    toasts: currentToasts,
    showToast,
    dismissToast,
    dismissAllToasts,
    success: (title: string, description?: string) =>
      showToast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) =>
      showToast({ title, description, variant: 'error' }),
    warning: (title: string, description?: string) =>
      showToast({ title, description, variant: 'warning' }),
    info: (title: string, description?: string) =>
      showToast({ title, description, variant: 'info' })
  };
};

/**
 * Toast container component
 */
export const AnimatedToastContainer: React.FC = () => {
  const { toasts } = useAnimatedToast();

  return (
    <ToastProvider>
      {toasts.map((toast, index) => (
        <AnimatedToast
          key={toast.id}
          {...toast}
          onClose={() => dismissToast(toast.id)}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        />
      ))}
      <ToastViewport className="flex flex-col gap-2 p-4" />
    </ToastProvider>
  );
};

/**
 * Helper functions for common toast patterns
 */
export const toast = {
  success: (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) =>
    showToast({ ...options, title, description, variant: 'success' }),
  
  error: (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) =>
    showToast({ ...options, title, description, variant: 'error' }),
  
  warning: (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) =>
    showToast({ ...options, title, description, variant: 'warning' }),
  
  info: (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) =>
    showToast({ ...options, title, description, variant: 'info' }),
  
  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    const loadingId = showToast({
      title: messages.loading,
      variant: 'info',
      duration: Infinity,
      showProgress: false
    });

    try {
      const result = await promise;
      dismissToast(loadingId);
      showToast({
        title: messages.success,
        variant: 'success'
      });
      return result;
    } catch (error) {
      dismissToast(loadingId);
      showToast({
        title: messages.error,
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'error'
      });
      throw error;
    }
  }
};

export default AnimatedToast;
