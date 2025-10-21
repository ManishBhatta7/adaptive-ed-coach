/**
 * Animation utilities and constants for consistent animations across the app
 */

// Animation duration constants (in ms)
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 700
} as const;

// Easing functions
export const EASING = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  bounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)'
} as const;

// Transition classes for Tailwind
export const TRANSITIONS = {
  all: 'transition-all duration-300 ease-in-out',
  colors: 'transition-colors duration-300 ease-in-out',
  transform: 'transition-transform duration-300 ease-in-out',
  opacity: 'transition-opacity duration-300 ease-in-out',
  shadow: 'transition-shadow duration-300 ease-in-out',
  fast: 'transition-all duration-150 ease-in-out',
  slow: 'transition-all duration-500 ease-in-out',
  spring: 'transition-all duration-300 cubic-bezier(0.68, -0.55, 0.265, 1.55)'
} as const;

// Animation keyframes for Tailwind config
export const KEYFRAMES = {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' }
  },
  fadeOut: {
    '0%': { opacity: '1' },
    '100%': { opacity: '0' }
  },
  slideInUp: {
    '0%': { transform: 'translateY(100%)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' }
  },
  slideInDown: {
    '0%': { transform: 'translateY(-100%)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' }
  },
  slideInLeft: {
    '0%': { transform: 'translateX(-100%)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' }
  },
  slideInRight: {
    '0%': { transform: 'translateX(100%)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' }
  },
  slideOutUp: {
    '0%': { transform: 'translateY(0)', opacity: '1' },
    '100%': { transform: 'translateY(-100%)', opacity: '0' }
  },
  slideOutDown: {
    '0%': { transform: 'translateY(0)', opacity: '1' },
    '100%': { transform: 'translateY(100%)', opacity: '0' }
  },
  scaleIn: {
    '0%': { transform: 'scale(0.9)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' }
  },
  scaleOut: {
    '0%': { transform: 'scale(1)', opacity: '1' },
    '100%': { transform: 'scale(0.9)', opacity: '0' }
  },
  bounce: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-25%)' }
  },
  wiggle: {
    '0%, 100%': { transform: 'rotate(0deg)' },
    '25%': { transform: 'rotate(-3deg)' },
    '75%': { transform: 'rotate(3deg)' }
  },
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' }
  },
  pulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.5' }
  },
  heartbeat: {
    '0%, 100%': { transform: 'scale(1)' },
    '10%, 30%': { transform: 'scale(0.9)' },
    '20%, 40%': { transform: 'scale(1.1)' }
  },
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' }
  },
  float: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' }
  },
  glow: {
    '0%, 100%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
    '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' }
  }
} as const;

// Animation classes for direct use
export const ANIMATIONS = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  slideOutUp: 'animate-slide-out-up',
  slideOutDown: 'animate-slide-out-down',
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  bounce: 'animate-bounce',
  wiggle: 'animate-wiggle',
  shimmer: 'animate-shimmer',
  pulse: 'animate-pulse',
  heartbeat: 'animate-heartbeat',
  shake: 'animate-shake',
  float: 'animate-float',
  glow: 'animate-glow',
  spin: 'animate-spin'
} as const;

// Hover effects
export const HOVER_EFFECTS = {
  lift: 'hover:-translate-y-1 hover:shadow-lg',
  scale: 'hover:scale-105',
  scaleDown: 'hover:scale-95',
  glow: 'hover:shadow-lg hover:shadow-primary/50',
  brightness: 'hover:brightness-110',
  rotate: 'hover:rotate-3',
  slideRight: 'hover:translate-x-1',
  underline: 'hover:underline hover:decoration-2'
} as const;

// Active/Focus states
export const INTERACTIVE_STATES = {
  active: 'active:scale-95 active:brightness-90',
  focus: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
} as const;

// Combined button effects
export const BUTTON_EFFECTS = {
  primary: `${TRANSITIONS.all} ${HOVER_EFFECTS.lift} ${INTERACTIVE_STATES.active} ${INTERACTIVE_STATES.focus}`,
  secondary: `${TRANSITIONS.colors} ${HOVER_EFFECTS.scale} ${INTERACTIVE_STATES.active} ${INTERACTIVE_STATES.focus}`,
  ghost: `${TRANSITIONS.colors} ${HOVER_EFFECTS.brightness} ${INTERACTIVE_STATES.focus}`,
  destructive: `${TRANSITIONS.all} ${HOVER_EFFECTS.scale} ${INTERACTIVE_STATES.active} ${INTERACTIVE_STATES.focus}`
} as const;

// Card effects
export const CARD_EFFECTS = {
  hover: `${TRANSITIONS.all} ${HOVER_EFFECTS.lift} hover:border-primary/50 cursor-pointer`,
  interactive: `${TRANSITIONS.all} ${HOVER_EFFECTS.lift} ${HOVER_EFFECTS.glow} cursor-pointer`,
  static: TRANSITIONS.shadow
} as const;

// Loading skeleton shimmer effect
export const SKELETON_SHIMMER = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer';

// Stagger animation delays (for list items)
export const STAGGER_DELAYS = {
  item1: 'animation-delay-100',
  item2: 'animation-delay-200',
  item3: 'animation-delay-300',
  item4: 'animation-delay-400',
  item5: 'animation-delay-500'
} as const;

/**
 * Generate stagger delay style
 */
export const getStaggerDelay = (index: number, baseDelay: number = 100): string => {
  return `animation-delay-${index * baseDelay}`;
};

/**
 * Generate stagger style object for inline use
 */
export const getStaggerStyle = (index: number, baseDelay: number = 100): React.CSSProperties => {
  return {
    animationDelay: `${index * baseDelay}ms`
  };
};

/**
 * Spring animation config (for framer-motion or similar)
 */
export const SPRING_CONFIG = {
  type: 'spring',
  stiffness: 300,
  damping: 20
} as const;

/**
 * Preset animation variants (for framer-motion)
 */
export const VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 }
  },
  slideDown: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 }
  },
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 }
  },
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }
} as const;

export default {
  ANIMATION_DURATION,
  EASING,
  TRANSITIONS,
  KEYFRAMES,
  ANIMATIONS,
  HOVER_EFFECTS,
  INTERACTIVE_STATES,
  BUTTON_EFFECTS,
  CARD_EFFECTS,
  SKELETON_SHIMMER,
  STAGGER_DELAYS,
  SPRING_CONFIG,
  VARIANTS,
  getStaggerDelay,
  getStaggerStyle
};
