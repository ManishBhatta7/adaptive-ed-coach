import React from 'react';
import { Card, CardProps } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TRANSITIONS, CARD_EFFECTS } from '@/lib/animations';

export interface AnimatedCardProps extends CardProps {
  /**
   * Card interaction style
   */
  variant?: 'static' | 'hover' | 'interactive' | 'glow';
  
  /**
   * Click handler
   */
  onClick?: () => void;
  
  /**
   * Loading state
   */
  isLoading?: boolean;
  
  /**
   * Selected state
   */
  isSelected?: boolean;
  
  /**
   * Disabled state
   */
  isDisabled?: boolean;
  
  /**
   * Show badge
   */
  badge?: React.ReactNode;
  
  /**
   * Badge position
   */
  badgePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Animated card with hover effects and interactions
 */
export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      children,
      variant = 'hover',
      onClick,
      isLoading = false,
      isSelected = false,
      isDisabled = false,
      badge,
      badgePosition = 'top-right',
      className,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      static: CARD_EFFECTS.static,
      hover: CARD_EFFECTS.hover,
      interactive: CARD_EFFECTS.interactive,
      glow: `${CARD_EFFECTS.interactive} animate-glow`
    };

    const badgePositionClasses = {
      'top-left': 'top-2 left-2',
      'top-right': 'top-2 right-2',
      'bottom-left': 'bottom-2 left-2',
      'bottom-right': 'bottom-2 right-2'
    };

    return (
      <Card
        ref={ref}
        onClick={!isDisabled && !isLoading ? onClick : undefined}
        className={cn(
          'relative',
          variantClasses[variant],
          isSelected && 'ring-2 ring-primary border-primary',
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          isLoading && 'animate-pulse pointer-events-none',
          onClick && !isDisabled && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {/* Badge */}
        {badge && (
          <div
            className={cn(
              'absolute z-20 animate-scale-in',
              badgePositionClasses[badgePosition]
            )}
          >
            {badge}
          </div>
        )}

        {/* Card content */}
        {children}
      </Card>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

/**
 * Gradient card with animated border
 */
export interface GradientCardProps extends Omit<AnimatedCardProps, 'variant'> {
  gradientFrom?: string;
  gradientTo?: string;
}

export const GradientCard = React.forwardRef<HTMLDivElement, GradientCardProps>(
  ({ gradientFrom = 'from-blue-500', gradientTo = 'to-purple-500', className, children, ...props }, ref) => {
    return (
      <div className="relative p-[2px] rounded-lg overflow-hidden group">
        {/* Animated gradient border */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-r opacity-75 group-hover:opacity-100',
            'transition-opacity duration-300',
            'animate-gradient-shift',
            gradientFrom,
            gradientTo
          )}
        />
        
        {/* Card */}
        <AnimatedCard
          ref={ref}
          variant="hover"
          className={cn('relative bg-background', className)}
          {...props}
        >
          {children}
        </AnimatedCard>
      </div>
    );
  }
);

GradientCard.displayName = 'GradientCard';

/**
 * Feature card with icon
 */
export interface FeatureCardProps extends AnimatedCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ icon, title, description, children, className, ...props }, ref) => {
    return (
      <AnimatedCard
        ref={ref}
        variant="hover"
        className={cn('p-6', className)}
        {...props}
      >
        {icon && (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
        
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}
        
        {children}
      </AnimatedCard>
    );
  }
);

FeatureCard.displayName = 'FeatureCard';

/**
 * Stat card with animated number
 */
export interface StatCardProps extends Omit<AnimatedCardProps, 'children'> {
  label: string;
  value: number | string;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, change, icon, trend, className, ...props }, ref) => {
    const trendColors = {
      up: 'text-green-600',
      down: 'text-red-600',
      neutral: 'text-gray-600'
    };

    return (
      <AnimatedCard
        ref={ref}
        variant="hover"
        className={cn('p-6', className)}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {label}
            </p>
            <p className="text-3xl font-bold tracking-tight animate-fade-in">
              {value}
            </p>
            {change !== undefined && (
              <p className={cn('text-sm mt-2', trend && trendColors[trend])}>
                {change > 0 && '+'}
                {change}% {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              </p>
            )}
          </div>
          
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
      </AnimatedCard>
    );
  }
);

StatCard.displayName = 'StatCard';

/**
 * Expandable card
 */
export interface ExpandableCardProps extends AnimatedCardProps {
  title: string;
  preview?: React.ReactNode;
  defaultExpanded?: boolean;
}

export const ExpandableCard = React.forwardRef<HTMLDivElement, ExpandableCardProps>(
  ({ title, preview, defaultExpanded = false, children, className, ...props }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    return (
      <AnimatedCard
        ref={ref}
        variant="hover"
        className={cn('overflow-hidden', className)}
        {...props}
      >
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full p-4 flex items-center justify-between text-left',
            TRANSITIONS.colors,
            'hover:bg-accent'
          )}
        >
          <h3 className="font-semibold">{title}</h3>
          <svg
            className={cn(
              'h-5 w-5 transition-transform duration-300',
              isExpanded && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {!isExpanded && preview && (
          <div className="px-4 pb-4 text-sm text-muted-foreground animate-fade-in">
            {preview}
          </div>
        )}

        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="p-4 pt-0 animate-slide-in-down">
            {children}
          </div>
        </div>
      </AnimatedCard>
    );
  }
);

ExpandableCard.displayName = 'ExpandableCard';

export default AnimatedCard;
