
import React from 'react';
import { LiveChatMessageItem } from './LiveChatMessageItem';
import type { ChatMessage } from '@/services/chat/types';

interface LiveChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  formatAuthorName: (message: ChatMessage) => string;
  formatTimeAgo: (timestamp: string) => string;
}

export function LiveChatMessages({ messages, isLoading, formatAuthorName, formatTimeAgo }: LiveChatMessagesProps) {
  if (isLoading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-xs text-muted-foreground mt-2">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {messages.map((message) => (
        <LiveChatMessageItem
          key={message.id}
          message={message}
          formatAuthorName={formatAuthorName}
          formatTimeAgo={formatTimeAgo}
        />
      ))}
    </>
  );
}
