/**
 * Universal Card Framework Configuration
 * Flexible, theme-aware configuration system for consistent card styling
 */

// Size configurations
export const cardSizes = {
  xs: {
    padding: 'p-3',
    titleSize: 'text-sm',
    contentSize: 'text-xs',
    minHeight: 'min-h-[120px]',
    maxWidth: 'max-w-xs'
  },
  sm: {
    padding: 'p-4',
    titleSize: 'text-base',
    contentSize: 'text-sm',
    minHeight: 'min-h-[160px]',
    maxWidth: 'max-w-sm'
  },
  md: {
    padding: 'p-6',
    titleSize: 'text-lg',
    contentSize: 'text-base',
    minHeight: 'min-h-[200px]',
    maxWidth: 'max-w-md'
  },
  lg: {
    padding: 'p-8',
    titleSize: 'text-xl',
    contentSize: 'text-lg',
    minHeight: 'min-h-[240px]',
    maxWidth: 'max-w-lg'
  },
  xl: {
    padding: 'p-10',
    titleSize: 'text-2xl',
    contentSize: 'text-xl',
    minHeight: 'min-h-[300px]',
    maxWidth: 'max-w-xl'
  },
  full: {
    padding: 'p-6',
    titleSize: 'text-lg',
    contentSize: 'text-base',
    minHeight: 'min-h-[200px]',
    maxWidth: 'w-full'
  }
} as const;

// Style variant configurations
export const cardVariants = {
  default: {
    background: 'bg-card',
    border: 'border border-border',
    shadow: 'shadow-sm',
    radius: 'rounded-lg'
  },
  glass: {
    background: 'bg-background/80 backdrop-blur-xl',
    border: 'border border-border/20',
    shadow: 'shadow-lg',
    radius: 'rounded-xl'
  },
  gradient: {
    background: 'bg-gradient-to-br from-card to-card/80',
    border: 'border-0',
    shadow: 'shadow-md',
    radius: 'rounded-xl'
  },
  elevated: {
    background: 'bg-card',
    border: 'border-0',
    shadow: 'shadow-lg',
    radius: 'rounded-lg'
  },
  flat: {
    background: 'bg-card',
    border: 'border-0',
    shadow: 'shadow-none',
    radius: 'rounded-md'
  },
  outlined: {
    background: 'bg-transparent',
    border: 'border-2 border-border',
    shadow: 'shadow-none',
    radius: 'rounded-lg'
  },
  minimal: {
    background: 'bg-transparent',
    border: 'border-0',
    shadow: 'shadow-none',
    radius: 'rounded-none'
  }
} as const;

// Color theme configurations
export const cardColors = {
  default: {
    background: '',
    text: 'text-card-foreground',
    accent: 'text-primary'
  },
  primary: {
    background: 'bg-primary/5 border-primary/20',
    text: 'text-primary-foreground',
    accent: 'text-primary'
  },
  secondary: {
    background: 'bg-secondary/5 border-secondary/20',
    text: 'text-secondary-foreground',
    accent: 'text-secondary'
  },
  accent: {
    background: 'bg-accent/5 border-accent/20',
    text: 'text-accent-foreground',
    accent: 'text-accent'
  },
  muted: {
    background: 'bg-muted/5 border-muted/20',
    text: 'text-muted-foreground',
    accent: 'text-foreground'
  },
  success: {
    background: 'bg-green-500/5 border-green-500/20',
    text: 'text-green-700 dark:text-green-300',
    accent: 'text-green-600 dark:text-green-400'
  },
  warning: {
    background: 'bg-yellow-500/5 border-yellow-500/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    accent: 'text-yellow-600 dark:text-yellow-400'
  },
  error: {
    background: 'bg-red-500/5 border-red-500/20',
    text: 'text-red-700 dark:text-red-300',
    accent: 'text-red-600 dark:text-red-400'
  }
} as const;

// Interactive state configurations
export const cardInteractions = {
  static: {
    hover: '',
    focus: '',
    active: '',
    transition: ''
  },
  hover: {
    hover: 'hover:shadow-lg hover:scale-[1.02]',
    focus: 'focus:outline-none focus:ring-2 focus:ring-primary/20',
    active: '',
    transition: 'transition-all duration-200 ease-out'
  },
  focus: {
    hover: 'hover:shadow-md',
    focus: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
    active: '',
    transition: 'transition-all duration-150 ease-out'
  },
  press: {
    hover: 'hover:shadow-lg',
    focus: 'focus:outline-none focus:ring-2 focus:ring-primary/20',
    active: 'active:scale-[0.98]',
    transition: 'transition-all duration-100 ease-out'
  }
} as const;

// Animation presets
export const cardAnimations = {
  none: '',
  subtle: 'animate-fade-in',
  smooth: 'animate-scale-in',
  spring: 'animate-fade-in animate-scale-in'
} as const;

// Default configuration
export const defaultCardConfig = {
  size: 'md' as keyof typeof cardSizes,
  variant: 'default' as keyof typeof cardVariants,
  color: 'default' as keyof typeof cardColors,
  interactive: 'static' as keyof typeof cardInteractions,
  animation: 'none' as keyof typeof cardAnimations,
  clickable: false,
  disabled: false
} as const;

// Type exports
export type CardSize = keyof typeof cardSizes;
export type CardVariant = keyof typeof cardVariants;
export type CardColor = keyof typeof cardColors;
export type CardInteraction = keyof typeof cardInteractions;
export type CardAnimation = keyof typeof cardAnimations;

export interface CardConfig {
  size?: CardSize;
  variant?: CardVariant;
  color?: CardColor;
  interactive?: CardInteraction;
  animation?: CardAnimation;
  clickable?: boolean;
  disabled?: boolean;
}