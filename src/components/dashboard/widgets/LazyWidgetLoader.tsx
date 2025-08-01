
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LazyWidgetLoaderProps {
  height?: string;
  showHeader?: boolean;
}

export function LazyWidgetLoader({ height = "h-64", showHeader = true }: LazyWidgetLoaderProps) {
  return (
    <Card className={`${height} w-full`}>
      {showHeader && (
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="pt-2">
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
