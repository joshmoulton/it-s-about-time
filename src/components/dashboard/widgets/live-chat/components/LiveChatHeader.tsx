
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { TopicSelector } from '../../TopicSelector';
import type { ConnectionState } from '@/services/chat/types';

interface LiveChatHeaderProps {
  connectionState: ConnectionState;
  isConnected: boolean;
  selectedTopic: string | null;
  onTopicChange: (topic: string | null) => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export function LiveChatHeader({
  connectionState,
  isConnected,
  selectedTopic,
  onTopicChange,
  onRefresh,
  isRefreshing
}: LiveChatHeaderProps) {
  return (
    <CardHeader className="pb-2 relative z-10 flex-shrink-0">
      <CardTitle className="text-lg font-bold flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl text-white shadow-lg">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              Community Chat
              <div className="flex items-center gap-1 text-xs">
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs ${
                  isConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {connectionState.status === 'syncing' ? 'SYNCING' : 
                   isConnected ? 'CONNECTED' : connectionState.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TopicSelector selectedTopic={selectedTopic} onTopicChange={onTopicChange} />
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 px-2 flex-shrink-0"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardTitle>
    </CardHeader>
  );
}
