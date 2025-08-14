
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LiveChatMessageList } from './LiveChatMessageList';
import { LiveChatEmptyState } from './LiveChatEmptyState';

interface LiveChatContentProps {
  displayMessages: any[];
  hasRealData: boolean;
  selectedTopic: string;
  showTopicFeatures: boolean;
  messagesLoading: boolean;
  autoScrollEnabled: boolean;
  selectedTopicDetails: any;
  subscriber: any;
}

export function LiveChatContent({
  displayMessages,
  hasRealData,
  selectedTopic,
  showTopicFeatures,
  messagesLoading,
  autoScrollEnabled,
  selectedTopicDetails,
  subscriber
}: LiveChatContentProps) {
  // ✅ Performance: Only log in development
  if (import.meta.env.DEV) {
    console.log('💬 LiveChatContent render:', {
      hasRealData,
      messageCount: displayMessages?.length || 0,
      selectedTopic,
      messagesLoading
    });
  }

  if (!hasRealData && !messagesLoading) {
    return (
      <CardContent className="flex-1 flex items-center justify-center p-6">
        <LiveChatEmptyState 
          showTopicFeatures={showTopicFeatures}
          subscriber={subscriber}
        />
      </CardContent>
    );
  }

  return (
    <CardContent className="flex-1 p-0 relative overflow-hidden">
      <ScrollArea className="h-full" data-chat-messages>
        <div className="p-4 space-y-3">
          <LiveChatMessageList 
            messages={displayMessages}
            loading={messagesLoading}
            selectedTopic={selectedTopic}
            selectedTopicDetails={selectedTopicDetails}
            hasRealData={hasRealData}
          />
        </div>
      </ScrollArea>
    </CardContent>
  );
}
