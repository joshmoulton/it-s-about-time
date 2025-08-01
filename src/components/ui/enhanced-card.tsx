
import * as React from "react"
import { cn } from "@/lib/utils"

const EnhancedCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'gradient' | 'glass' | 'colored'
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan'
  }
>(({ className, variant = 'default', color = 'blue', ...props }, ref) => {
  const getCardClasses = () => {
    const baseClasses = "relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
    
    switch (variant) {
      case 'gradient':
        const gradientColors = {
          blue: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700',
          green: 'bg-gradient-to-br from-green-500 via-green-600 to-green-700',
          purple: 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700',
          orange: 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700',
          pink: 'bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700',
          cyan: 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600'
        }
        return `${baseClasses} ${gradientColors[color]} text-white backdrop-blur-xl`
        
      case 'glass':
        return `${baseClasses} bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 text-white`
        
      case 'colored':
        const coloredClasses = {
          blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
          green: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
          purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
          orange: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
          pink: 'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200',
          cyan: 'bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200'
        }
        return `${baseClasses} ${coloredClasses[color]} border`
        
      default:
        return `${baseClasses} bg-card text-card-foreground border`
    }
  }

  return (
    <div
      ref={ref}
      className={cn(getCardClasses(), className)}
      {...props}
    />
  )
})
EnhancedCard.displayName = "EnhancedCard"

const EnhancedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
EnhancedCardHeader.displayName = "EnhancedCardHeader"

const EnhancedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
EnhancedCardTitle.displayName = "EnhancedCardTitle"

const EnhancedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm opacity-80", className)}
    {...props}
  />
))
EnhancedCardDescription.displayName = "EnhancedCardDescription"

const EnhancedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
EnhancedCardContent.displayName = "EnhancedCardContent"

const EnhancedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
EnhancedCardFooter.displayName = "EnhancedCardFooter"

export { 
  EnhancedCard, 
  EnhancedCardHeader, 
  EnhancedCardFooter, 
  EnhancedCardTitle, 
  EnhancedCardDescription, 
  EnhancedCardContent 
}
