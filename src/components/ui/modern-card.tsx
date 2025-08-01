
import * as React from "react"
import { cn } from "@/lib/utils"

const ModernCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'glass' | 'elevated'
    interactive?: boolean
  }
>(({ className, variant = 'default', interactive = false, ...props }, ref) => {
  const getCardClasses = () => {
    const baseClasses = "rounded-2xl transition-all duration-300"
    
    switch (variant) {
      case 'glass':
        return `${baseClasses} bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-800/20`
      case 'elevated':
        return `${baseClasses} bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-800`
      default:
        return `${baseClasses} bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm`
    }
  }

  const interactiveClasses = interactive 
    ? "hover:shadow-lg cursor-pointer hover:border-gray-300 dark:hover:border-gray-700" 
    : ""

  return (
    <div
      ref={ref}
      className={cn(getCardClasses(), interactiveClasses, className)}
      {...props}
    />
  )
})
ModernCard.displayName = "ModernCard"

const ModernCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pb-4", className)}
    {...props}
  />
))
ModernCardHeader.displayName = "ModernCardHeader"

const ModernCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100",
      className
    )}
    {...props}
  />
))
ModernCardTitle.displayName = "ModernCardTitle"

const ModernCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-6 pb-6", className)} {...props} />
))
ModernCardContent.displayName = "ModernCardContent"

export { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent }
