import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  cardSizes, 
  cardVariants, 
  cardColors, 
  cardInteractions, 
  cardAnimations,
  defaultCardConfig,
  type CardConfig 
} from "@/lib/cardConfig";
import { useOptionalCardTheme } from "@/contexts/CardThemeContext";

// Base UniversalCard component
interface UniversalCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>, CardConfig {
  asChild?: boolean;
}

const UniversalCard = React.forwardRef<HTMLDivElement, UniversalCardProps>(
  ({ 
    className, 
    size,
    variant,
    color,
    interactive,
    animation,
    clickable,
    disabled,
    asChild = false,
    ...props 
  }, ref) => {
    const { globalConfig } = useOptionalCardTheme();
    
    // Merge props with global config, prioritizing props
    const config = {
      size: size || globalConfig.size || defaultCardConfig.size,
      variant: variant || globalConfig.variant || defaultCardConfig.variant,
      color: color || globalConfig.color || defaultCardConfig.color,
      interactive: interactive || globalConfig.interactive || defaultCardConfig.interactive,
      animation: animation || globalConfig.animation || defaultCardConfig.animation,
      clickable: clickable ?? globalConfig.clickable ?? defaultCardConfig.clickable,
      disabled: disabled ?? globalConfig.disabled ?? defaultCardConfig.disabled
    };

    const sizeClasses = cardSizes[config.size];
    const variantClasses = cardVariants[config.variant];
    const colorClasses = cardColors[config.color];
    const interactionClasses = cardInteractions[config.interactive];
    const animationClass = cardAnimations[config.animation];

    const cardClasses = cn(
      // Base styles
      "relative overflow-hidden",
      
      // Size-based styles
      sizeClasses.padding,
      sizeClasses.maxWidth,
      sizeClasses.minHeight,
      
      // Variant styles
      variantClasses.background,
      variantClasses.border,
      variantClasses.shadow,
      variantClasses.radius,
      
      // Color theme
      colorClasses.background,
      colorClasses.text,
      
      // Interactive states
      config.clickable && !config.disabled && [
        "cursor-pointer",
        interactionClasses.hover,
        interactionClasses.focus,
        interactionClasses.active,
        interactionClasses.transition
      ],
      
      // Animation
      animationClass,
      
      // Disabled state
      config.disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      
      className
    );

    if (asChild) {
      return (
        <div ref={ref} className={cardClasses} {...props} />
      );
    }

    return (
      <div 
        ref={ref} 
        className={cardClasses}
        role={config.clickable ? "button" : undefined}
        tabIndex={config.clickable && !config.disabled ? 0 : undefined}
        {...props} 
      />
    );
  }
);
UniversalCard.displayName = "UniversalCard";

// Header component
const UniversalCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
UniversalCardHeader.displayName = "UniversalCardHeader";

// Title component
interface UniversalCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: keyof typeof cardSizes;
}

const UniversalCardTitle = React.forwardRef<
  HTMLHeadingElement,
  UniversalCardTitleProps
>(({ className, size, ...props }, ref) => {
  const { globalConfig } = useOptionalCardTheme();
  const titleSize = size || globalConfig.size || defaultCardConfig.size;
  const sizeClass = cardSizes[titleSize].titleSize;

  return (
    <h3
      ref={ref}
      className={cn(
        "font-semibold leading-none tracking-tight",
        sizeClass,
        className
      )}
      {...props}
    />
  );
});
UniversalCardTitle.displayName = "UniversalCardTitle";

// Description component
interface UniversalCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: keyof typeof cardSizes;
}

const UniversalCardDescription = React.forwardRef<
  HTMLParagraphElement,
  UniversalCardDescriptionProps
>(({ className, size, ...props }, ref) => {
  const { globalConfig } = useOptionalCardTheme();
  const contentSize = size || globalConfig.size || defaultCardConfig.size;
  const sizeClass = cardSizes[contentSize].contentSize;

  return (
    <p
      ref={ref}
      className={cn("text-muted-foreground", sizeClass, className)}
      {...props}
    />
  );
});
UniversalCardDescription.displayName = "UniversalCardDescription";

// Content component
interface UniversalCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof cardSizes;
}

const UniversalCardContent = React.forwardRef<
  HTMLDivElement,
  UniversalCardContentProps
>(({ className, size, ...props }, ref) => {
  const { globalConfig } = useOptionalCardTheme();
  const contentSize = size || globalConfig.size || defaultCardConfig.size;
  const sizeClass = cardSizes[contentSize].contentSize;

  return (
    <div 
      ref={ref} 
      className={cn("flex-1", sizeClass, className)} 
      {...props} 
    />
  );
});
UniversalCardContent.displayName = "UniversalCardContent";

// Footer component
const UniversalCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center", className)}
    {...props}
  />
));
UniversalCardFooter.displayName = "UniversalCardFooter";

// Utility function to create preset card configurations
export function createCardPreset(config: CardConfig) {
  return function PresetCard(props: Omit<UniversalCardProps, keyof CardConfig>) {
    return <UniversalCard {...config} {...props} />;
  };
}

// Common preset cards
export const GlassCard = createCardPreset({ variant: 'glass', interactive: 'hover' });
export const ElevatedCard = createCardPreset({ variant: 'elevated', interactive: 'hover' });
export const MinimalCard = createCardPreset({ variant: 'minimal', interactive: 'focus' });
export const ClickableCard = createCardPreset({ interactive: 'press', clickable: true });

export { 
  UniversalCard, 
  UniversalCardHeader, 
  UniversalCardTitle, 
  UniversalCardDescription, 
  UniversalCardContent, 
  UniversalCardFooter 
};