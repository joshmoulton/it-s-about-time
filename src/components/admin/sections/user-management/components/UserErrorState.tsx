
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface UserErrorStateProps {
  onRetry: () => void;
}

export function UserErrorState({ onRetry }: UserErrorStateProps) {
  return (
    <div className="p-8">
      <div className="text-center text-red-500">
        <h2 className="text-xl font-semibold mb-2">Error Loading Users</h2>
        <p>Failed to load user data. Please try refreshing.</p>
        <Button onClick={onRetry} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  );
}
