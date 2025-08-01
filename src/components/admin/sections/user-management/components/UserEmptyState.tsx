
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw } from 'lucide-react';

interface UserEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function UserEmptyState({ hasFilters, onClearFilters }: UserEmptyStateProps) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-semibold mb-2">No users found</h3>
      {hasFilters ? (
        <>
          <p>No users match your current filters.</p>
          <Button onClick={onClearFilters} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </>
      ) : (
        <p>No users have been created yet.</p>
      )}
    </div>
  );
}
