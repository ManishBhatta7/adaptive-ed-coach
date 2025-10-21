import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TRANSITIONS, HOVER_EFFECTS, INTERACTIVE_STATES } from '@/lib/animations';

export interface AnimatedButtonProps extends ButtonProps {
  /**
   * Icon to display before the button text
   */
  icon?: LucideIcon;
  
  /**
   * Icon to display after the button text
   */
  iconRight?: LucideIcon;
  
  /**
   * Loading state
   */
  isLoading?: boolean;
  
  /**
   * Custom loading text
   */
  loadingText?: string;
  
  /**
   * Animation style
   */
  animation?: 'lift' | 'scale' | 'glow' | 'none';
  
  /**
   * Ripple effect on click
   */
  ripple?: boolean;
  
  /**
   * Icon animation on hover
   */
  iconAnimation?: 'bounce' | 'wiggle' | 'slideRight' | 'rotate' | 'none';
}

/**
 * Enhanced button with animations and loading states
 */
export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      icon: Icon,
      iconRight: IconRight,
      isLoading = false,
      loadingText,
      animation = 'lift',
      ripple = false,
      iconAnimation = 'slideRight',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const animationClasses = {
      lift: HOVER_EFFECTS.lift,
      scale: HOVER_EFFECTS.scale,
      glow: HOVER_EFFECTS.glow,
      none: ''
    };

    const iconAnimationClasses = {
      bounce: 'group-hover:animate-bounce',
      wiggle: 'group-hover:animate-wiggle',
      slideRight: 'group-hover:translate-x-1 transition-transform duration-200',
      rotate: 'group-hover:rotate-12 transition-transform duration-200',
      none: ''
    };

    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'group relative overflow-hidden',
          TRANSITIONS.all,
          INTERACTIVE_STATES.active,
          INTERACTIVE_STATES.focus,
          INTERACTIVE_STATES.disabled,
          animationClasses[animation],
          ripple && 'ripple',
          className
        )}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
        )}

        {/* Left icon */}
        {!isLoading && Icon && (
          <Icon
            className={cn(
              'h-4 w-4 mr-2',
              iconAnimationClasses[iconAnimation]
            )}
            aria-hidden="true"
          />
        )}

        {/* Button content */}
        <span className={cn(isLoading && 'opacity-0')}>
          {children}
        </span>

        {/* Loading text overlay */}
        {isLoading && loadingText && (
          <span className="absolute inset-0 flex items-center justify-center">
            {loadingText}
          </span>
        )}

        {/* Right icon */}
        {!isLoading && IconRight && (
          <IconRight
            className={cn(
              'h-4 w-4 ml-2',
              iconAnimationClasses[iconAnimation]
            )}
            aria-hidden="true"
          />
        )}

        {/* Ripple effect */}
        {ripple && (
          <span className="absolute inset-0 overflow-hidden">
            <span className="ripple-effect" />
          </span>
        )}
      </Button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

/**
 * Icon button with tooltip
 */
export interface IconButtonProps extends Omit<AnimatedButtonProps, 'children'> {
  icon: LucideIcon;
  label: string;
  showLabel?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, showLabel = false, className, ...props }, ref) => {
    return (
      <AnimatedButton
        ref={ref}
        variant="ghost"
        size="icon"
        aria-label={label}
        title={label}
        className={cn('relative', className)}
        {...props}
      >
        <Icon className="h-4 w-4" />
        {showLabel && (
          <span className="ml-2 hidden sm:inline">{label}</span>
        )}
      </AnimatedButton>
    );
  }
);

IconButton.displayName = 'IconButton';

/**
 * Floating action button
 */
export interface FABProps extends AnimatedButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ position = 'bottom-right', className, ...props }, ref) => {
    const positionClasses = {
      'bottom-right': 'fixed bottom-6 right-6',
      'bottom-left': 'fixed bottom-6 left-6',
      'top-right': 'fixed top-6 right-6',
      'top-left': 'fixed top-6 left-6'
    };

    return (
      <AnimatedButton
        ref={ref}
        size="lg"
        className={cn(
          'rounded-full shadow-lg z-50',
          positionClasses[position],
          'hover:shadow-xl hover:scale-110',
          'animate-float',
          className
        )}
        {...props}
      />
    );
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';

/**
 * Button group with animations
 */
export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  className
}) => {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        '[&>button]:rounded-none',
        '[&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md',
        orientation === 'vertical' && '[&>button:first-child]:rounded-t-md [&>button:first-child]:rounded-l-none',
        orientation === 'vertical' && '[&>button:last-child]:rounded-b-md [&>button:last-child]:rounded-r-none',
        TRANSITIONS.all,
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
};

/**
 * Pulsing notification button
 */
export interface NotificationButtonProps extends AnimatedButtonProps {
  count?: number;
  showPulse?: boolean;
}

export const NotificationButton = React.forwardRef<HTMLButtonElement, NotificationButtonProps>(
  ({ count = 0, showPulse = true, className, children, ...props }, ref) => {
    return (
      <div className="relative inline-block">
        <AnimatedButton
          ref={ref}
          variant="ghost"
          className={cn('relative', className)}
          {...props}
        >
          {children}
        </AnimatedButton>
        
        {count > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 h-5 min-w-[20px] px-1',
              'flex items-center justify-center',
              'text-xs font-bold text-white bg-red-500 rounded-full',
              'animate-scale-in',
              showPulse && 'animate-pulse'
            )}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
        
        {showPulse && count > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 animate-ping opacity-75" />
        )}
      </div>
    );
  }
);

NotificationButton.displayName = 'NotificationButton';

export default AnimatedButton;
