
import React, { useState } from 'react';
import { UnifiedChatContainer } from './UnifiedChatContainer';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface ModernChatWidgetProps {
  subscriber: Subscriber;
  hideHeader?: boolean;
}

export function ModernChatWidget({ subscriber, hideHeader = false }: ModernChatWidgetProps) {
  return <UnifiedChatContainer subscriber={subscriber} />;
}
