
import React from 'react';
import { UnifiedChatContainer } from '../UnifiedChatContainer';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface SimpleLiveChatContainerProps {
  subscriber: Subscriber;
}

export function SimpleLiveChatContainer({ subscriber }: SimpleLiveChatContainerProps) {
  return <UnifiedChatContainer subscriber={subscriber} />;
}
