import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveAdminHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ResponsiveAdminHeader({ 
  title, 
  description, 
  children, 
  className 
}: ResponsiveAdminHeaderProps) {
  return (
    <div className={cn("admin-header", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}