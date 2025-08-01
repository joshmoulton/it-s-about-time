
import React from 'react';
import type { ChatMessage } from '@/services/chat/types';

interface LiveChatMessageItemProps {
  message: ChatMessage;
  formatAuthorName: (message: ChatMessage) => string;
  formatTimeAgo: (timestamp: string) => string;
}

export function LiveChatMessageItem({ message, formatAuthorName, formatTimeAgo }: LiveChatMessageItemProps) {
  return (
    <div key={message.id} className="flex items-start gap-2 group rounded-lg p-2 transition-all duration-200">
      <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm">
        {message.first_name?.[0] || message.username?.[0] || 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-xs truncate">{formatAuthorName(message)}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap bg-white/50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded">
            {formatTimeAgo(message.timestamp)}
          </span>
        </div>
        <p className="text-xs break-words leading-relaxed text-gray-700 dark:text-gray-300">
          {message.message_text || 'Media content'}
        </p>
      </div>
    </div>
  );
}
