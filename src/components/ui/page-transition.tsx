import React from 'react';
import { cn } from '@/lib/utils';
import { TRANSITIONS, VARIANTS } from '@/lib/animations';

export type TransitionType = 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';

export interface PageTransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  delay?: number;
  className?: string;
}

/**
 * Page transition wrapper with animation
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  type = 'fade',
  duration = 300,
  delay = 0,
  className
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const transitionClasses = {
    fade: 'animate-fade-in',
    'slide-up': 'animate-slide-in-up',
    'slide-down': 'animate-slide-in-down',
    'slide-left': 'animate-slide-in-left',
    'slide-right': 'animate-slide-in-right',
    scale: 'animate-scale-in',
    none: ''
  };

  return (
    <div
      className={cn(
        'w-full',
        isVisible && transitionClasses[type],
        !isVisible && 'opacity-0',
        className
      )}
      style={{
        animationDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
};

/**
 * Route transition wrapper with enter/exit animations
 */
export interface RouteTransitionProps {
  children: React.ReactNode;
  location: string; // Current route/location
  type?: TransitionType;
  mode?: 'wait' | 'concurrent';
  className?: string;
}

export const RouteTransition: React.FC<RouteTransitionProps> = ({
  children,
  location,
  type = 'fade',
  mode = 'wait',
  className
}) => {
  const [displayChildren, setDisplayChildren] = React.useState(children);
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    if (mode === 'wait') {
      // Wait for exit animation before showing new content
      setIsExiting(true);

      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setIsExiting(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      // Show new content immediately
      setDisplayChildren(children);
    }
  }, [location, children, mode]);

  const exitClasses = {
    fade: 'animate-fade-out',
    'slide-up': 'animate-slide-out-up',
    'slide-down': 'animate-slide-out-down',
    'slide-left': 'opacity-0 -translate-x-full',
    'slide-right': 'opacity-0 translate-x-full',
    scale: 'animate-scale-out',
    none: ''
  };

  const enterClasses = {
    fade: 'animate-fade-in',
    'slide-up': 'animate-slide-in-up',
    'slide-down': 'animate-slide-in-down',
    'slide-left': 'animate-slide-in-left',
    'slide-right': 'animate-slide-in-right',
    scale: 'animate-scale-in',
    none: ''
  };

  return (
    <div
      className={cn(
        'w-full',
        TRANSITIONS.all,
        isExiting ? exitClasses[type] : enterClasses[type],
        className
      )}
    >
      {displayChildren}
    </div>
  );
};

/**
 * Stagger children animation
 */
export interface StaggerChildrenProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const StaggerChildren: React.FC<StaggerChildrenProps> = ({
  children,
  delay = 100,
  className
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className="animate-fade-in"
          style={{
            animationDelay: `${index * delay}ms`,
            animationFillMode: 'backwards'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

/**
 * Section reveal animation (scroll-triggered)
 */
export interface SectionRevealProps {
  children: React.ReactNode;
  threshold?: number;
  once?: boolean;
  type?: TransitionType;
  className?: string;
}

export const SectionReveal: React.FC<SectionRevealProps> = ({
  children,
  threshold = 0.1,
  once = true,
  type = 'slide-up',
  className
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) {
              observer.unobserve(element);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, once]);

  const transitionClasses = {
    fade: 'animate-fade-in',
    'slide-up': 'animate-slide-in-up',
    'slide-down': 'animate-slide-in-down',
    'slide-left': 'animate-slide-in-left',
    'slide-right': 'animate-slide-in-right',
    scale: 'animate-scale-in',
    none: ''
  };

  return (
    <div
      ref={ref}
      className={cn(
        isVisible && transitionClasses[type],
        !isVisible && 'opacity-0 translate-y-8',
        TRANSITIONS.all,
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Modal transition wrapper
 */
export interface ModalTransitionProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  type?: 'fade' | 'scale' | 'slide-down';
  showBackdrop?: boolean;
  className?: string;
}

export const ModalTransition: React.FC<ModalTransitionProps> = ({
  children,
  isOpen,
  onClose,
  type = 'scale',
  showBackdrop = true,
  className
}) => {
  const [shouldRender, setShouldRender] = React.useState(isOpen);

  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const transitionClasses = {
    fade: isOpen ? 'animate-fade-in' : 'animate-fade-out',
    scale: isOpen ? 'animate-scale-in' : 'animate-scale-out',
    'slide-down': isOpen ? 'animate-slide-in-down' : 'animate-slide-out-up'
  };

  return (
    <>
      {/* Backdrop */}
      {showBackdrop && (
        <div
          className={cn(
            'fixed inset-0 bg-black/50 z-40',
            isOpen ? 'animate-fade-in' : 'animate-fade-out'
          )}
          onClick={onClose}
        />
      )}

      {/* Modal content */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          'pointer-events-none'
        )}
      >
        <div
          className={cn(
            'pointer-events-auto',
            transitionClasses[type],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
};

/**
 * Tab transition wrapper
 */
export interface TabTransitionProps {
  children: React.ReactNode;
  activeKey: string | number;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export const TabTransition: React.FC<TabTransitionProps> = ({
  children,
  activeKey,
  direction = 'horizontal',
  className
}) => {
  const [displayKey, setDisplayKey] = React.useState(activeKey);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    if (activeKey !== displayKey) {
      setIsTransitioning(true);

      const timer = setTimeout(() => {
        setDisplayKey(activeKey);
        setIsTransitioning(false);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [activeKey, displayKey]);

  return (
    <div
      className={cn(
        'w-full',
        TRANSITIONS.all,
        isTransitioning && 'opacity-0',
        !isTransitioning && 'opacity-100',
        direction === 'horizontal' && isTransitioning && '-translate-x-4',
        direction === 'vertical' && isTransitioning && '-translate-y-4',
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Collapse transition
 */
export interface CollapseTransitionProps {
  children: React.ReactNode;
  isOpen: boolean;
  className?: string;
}

export const CollapseTransition: React.FC<CollapseTransitionProps> = ({
  children,
  isOpen,
  className
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | 'auto'>(isOpen ? 'auto' : 0);

  React.useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;

      if (isOpen) {
        setHeight(contentHeight);
        // Set to auto after animation completes
        const timer = setTimeout(() => {
          setHeight('auto');
        }, 300);
        return () => clearTimeout(timer);
      } else {
        // Force reflow
        setHeight(contentHeight);
        requestAnimationFrame(() => {
          setHeight(0);
        });
      }
    }
  }, [isOpen]);

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out',
        className
      )}
      style={{ height }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
};

export default PageTransition;
