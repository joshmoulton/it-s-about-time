
import React from 'react';
import { SimpleLiveChatContainer } from './live-chat/SimpleLiveChatContainer';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface LiveChatWidgetProps {
  subscriber: Subscriber;
}

export function LiveChatWidget({ subscriber }: LiveChatWidgetProps) {
  return <SimpleLiveChatContainer subscriber={subscriber} />;
}
