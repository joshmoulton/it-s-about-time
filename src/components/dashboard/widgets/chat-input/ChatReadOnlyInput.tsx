
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Eye } from 'lucide-react';

export function ChatReadOnlyInput() {
  return (
    <div className="border-t border-white/20 pt-4 space-y-3 flex-shrink-0">
      <div className="flex items-center justify-center gap-2 py-4">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Community chat is in read-only mode
        </span>
      </div>
      
      <div className="text-center">
        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
          <MessageSquare className="h-3 w-3 mr-1" />
          Live Community Feed
        </Badge>
      </div>
    </div>
  );
}
