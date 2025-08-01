
import React from 'react';

interface LiveChatMessageListProps {
  messages: any[];
  loading: boolean;
  selectedTopic: string;
  selectedTopicDetails: any;
  hasRealData: boolean;
}

export function LiveChatMessageList({
  messages,
  loading,
  selectedTopic,
  selectedTopicDetails,
  hasRealData
}: LiveChatMessageListProps) {
  console.log('💬 LiveChatMessageList render:', {
    messageCount: messages?.length || 0,
    loading,
    selectedTopic,
    hasRealData
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No messages available</p>
        {selectedTopic && (
          <p className="text-sm mt-2">Topic: {selectedTopic}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => (
        <div key={message.id || index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {message.first_name?.[0] || message.username?.[0] || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm text-gray-900">
                {message.first_name || message.username || 'User'}
              </span>
              {message.timestamp && (
                <span className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 break-words">
              {message.message_text}
            </p>
            {message.topic_name && (
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                {message.topic_name}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
