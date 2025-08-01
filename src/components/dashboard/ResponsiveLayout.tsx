import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'default' | 'wide' | 'full';
  padding?: 'default' | 'compact' | 'spacious';
}

export function ResponsiveLayout({ 
  children, 
  className,
  maxWidth = 'default',
  padding = 'default'
}: ResponsiveLayoutProps) {
  const maxWidthClasses = {
    default: 'max-w-[1200px]',
    wide: 'max-w-[1400px]',
    full: 'max-w-none'
  };

  const paddingClasses = {
    compact: 'p-2 sm:p-3 lg:p-4',
    default: 'p-3 sm:p-4 lg:p-6 xl:p-8',
    spacious: 'p-4 sm:p-6 lg:p-8 xl:p-10'
  };

  return (
    <div className={cn(
      'min-h-screen bg-slate-900',
      paddingClasses[padding],
      className
    )}>
      <div className={cn(
        'mx-auto h-full',
        maxWidthClasses[maxWidth]
      )}>
        {children}
      </div>
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'compact' | 'default' | 'spacious';
  minItemWidth?: string;
  autoRows?: boolean;
}

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, lg: 3, xl: 4, '2xl': 5 },
  gap = 'default',
  minItemWidth,
  autoRows = false
}: ResponsiveGridProps) {
  const gapClasses = {
    compact: 'gap-2 sm:gap-3 lg:gap-4',
    default: 'gap-3 sm:gap-4 lg:gap-6 xl:gap-8',
    spacious: 'gap-4 sm:gap-6 lg:gap-8 xl:gap-10'
  };

  const gridColsClasses = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`
  ].filter(Boolean).join(' ');

  const gridStyle = minItemWidth ? {
    gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
  } : {};

  return (
    <div 
      className={cn(
        'grid',
        gridColsClasses,
        gapClasses[gap],
        autoRows && 'auto-rows-fr',
        className
      )}
      style={gridStyle}
    >
      {children}
    </div>
  );
}