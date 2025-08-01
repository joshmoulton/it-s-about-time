
import React from 'react';
import { Loader2 } from 'lucide-react';

export function DashboardLoader() {
  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}
