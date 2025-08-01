
import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ConnectionState } from '@/services/chat/types';

interface LiveChatStatusBadgesProps {
  hasRealData: boolean;
  connectionState: ConnectionState;
}

export function LiveChatStatusBadges({ hasRealData, connectionState }: LiveChatStatusBadgesProps) {
  return (
    <>
      {!hasRealData && (
        <div className="text-center py-2 mb-3 flex-shrink-0">
          <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs">
            Demo Mode - Waiting for Telegram sync to activate
          </Badge>
        </div>
      )}

      {connectionState.error && (
        <div className="text-center py-2 mb-3 flex-shrink-0">
          <Badge variant="destructive" className="text-xs">
            Sync Error: {connectionState.error}
          </Badge>
        </div>
      )}

      {connectionState.status === 'syncing' && (
        <div className="text-center py-2 mb-3 flex-shrink-0">
          <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs">
            Syncing messages...
          </Badge>
        </div>
      )}
    </>
  );
}
