
import React from 'react';
import { Card } from '@/components/ui/card';
import { useTelegramTopics } from '@/hooks/useTelegramTopics';
import { LiveChatHeader } from '../LiveChatHeader';
import { ConnectionStatusIndicator } from '../ConnectionStatusIndicator';
import { LiveChatContent } from './components/LiveChatContent';
import { LiveChatAutoScroll } from './components/LiveChatAutoScroll';
import { useLiveChatState } from './hooks/useLiveChatState';
import { useLiveChatMessages } from './hooks/useLiveChatMessages';
import { useEnhancedChatMessages, useEnhancedChatConnection } from '@/hooks/useEnhancedChatService';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface EnhancedLiveChatContainerProps {
  subscriber: Subscriber;
}

export function EnhancedLiveChatContainer({ subscriber }: EnhancedLiveChatContainerProps) {
  const {
    selectedTopic,
    autoScrollEnabled,
    setAutoScrollEnabled,
    lastMessageCount,
    setLastMessageCount,
    handleTopicChange
  } = useLiveChatState();

  // Use the enhanced chat service
  const { messages: enhancedMessages, isLoading: messagesLoading, forceRefresh } = useEnhancedChatMessages(subscriber);
  const { connectionState, reconnect, isConnected } = useEnhancedChatConnection(subscriber);
  const { data: topics, refetch: refetchTopics } = useTelegramTopics();
  const { filteredMessages, selectedTopicDetails, hasRealData } = useLiveChatMessages(enhancedMessages, selectedTopic);

  // Enhanced sync function using the service
  const handleSync = React.useCallback(async () => {
    try {
      console.log('🔄 Starting enhanced sync...');
      
      // Refresh topics first
      await refetchTopics();
      
      // Force refresh messages through the enhanced service
      forceRefresh();
      
      console.log('✅ Enhanced sync completed');
    } catch (error) {
      console.error('❌ Failed to perform enhanced sync:', error);
    }
  }, [refetchTopics, forceRefresh]);

  // Show topic features for premium users
  const showTopicFeatures = subscriber.subscription_tier === 'premium';

  return (
    <Card className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20 border-0 rounded-2xl hover:shadow-xl transition-all duration-300" data-tour="live-chat">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-orange-200/30 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr from-yellow-200/40 to-transparent rounded-full blur-xl" />
      
      <LiveChatHeader
        hasRealData={hasRealData}
        showTopicFeatures={showTopicFeatures}
        selectedTopic={selectedTopic}
        onTopicChange={handleTopicChange}
        autoScrollEnabled={autoScrollEnabled}
        onAutoScrollToggle={setAutoScrollEnabled}
        isLive={isConnected}
        lastCleanupTime={connectionState.lastConnected}
      />
      
      {/* Enhanced Connection Status Indicator */}
      <div className="px-6 pb-2">
        <ConnectionStatusIndicator
          connectionState={connectionState}
          onReconnect={reconnect}
          className="justify-center"
        />
        {connectionState.status === 'error' && connectionState.error && (
          <div className="text-xs text-red-600 dark:text-red-400 text-center mt-1">
            {connectionState.error}
          </div>
        )}
      </div>
      
      <LiveChatContent
        displayMessages={filteredMessages}
        hasRealData={hasRealData}
        selectedTopic={selectedTopic}
        showTopicFeatures={showTopicFeatures}
        messagesLoading={messagesLoading}
        autoScrollEnabled={autoScrollEnabled}
        selectedTopicDetails={selectedTopicDetails}
        subscriber={subscriber}
      />

      <LiveChatAutoScroll
        messages={enhancedMessages}
        lastMessageCount={lastMessageCount}
        setLastMessageCount={setLastMessageCount}
        autoScrollEnabled={autoScrollEnabled}
      />
    </Card>
  );
}
