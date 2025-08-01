
import React from 'react';
import { ChatReadOnlyInput } from './chat-input/ChatReadOnlyInput';

interface EnhancedLiveChatInputProps {
  selectedTopic?: string | null;
  topicName?: string | null;
  messageThreadId?: number | null;
}

export function EnhancedLiveChatInput({ 
  selectedTopic, 
  topicName, 
  messageThreadId 
}: EnhancedLiveChatInputProps) {
  // Always show read-only input
  return <ChatReadOnlyInput />;
}
