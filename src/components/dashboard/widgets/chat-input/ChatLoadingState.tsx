
import React from 'react';
import { Loader2 } from 'lucide-react';

export function ChatLoadingState() {
  return (
    <div className="border-t border-white/20 pt-4 space-y-3 flex-shrink-0">
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Checking permissions...</span>
      </div>
    </div>
  );
}
