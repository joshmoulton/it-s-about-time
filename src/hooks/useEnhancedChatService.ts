
import { useState, useEffect, useRef } from 'react';
import EnhancedChatService, { ChatMessage, ConnectionState, Subscriber } from '@/services/EnhancedChatService';

export function useEnhancedChatMessages(subscriber: Subscriber) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const serviceRef = useRef<EnhancedChatService | null>(null);

  useEffect(() => {
    const chatService = EnhancedChatService.getInstance();
    serviceRef.current = chatService;
    
    // Initialize the service with subscriber info
    chatService.initialize(subscriber);
    
    // Subscribe to message updates
    unsubscribeRef.current = chatService.subscribeToMessages((newMessages) => {
      setMessages(newMessages);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [subscriber.subscription_tier]);

  const forceRefresh = () => {
    if (serviceRef.current) {
      serviceRef.current.forceRefresh();
    }
  };

  return {
    messages,
    isLoading,
    forceRefresh
  };
}

export function useEnhancedChatConnection(subscriber: Subscriber) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  });
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const serviceRef = useRef<EnhancedChatService | null>(null);

  useEffect(() => {
    const chatService = EnhancedChatService.getInstance();
    serviceRef.current = chatService;
    
    // Subscribe to connection updates
    unsubscribeRef.current = chatService.subscribeToConnection((newState) => {
      setConnectionState(newState);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [subscriber.subscription_tier]);

  const reconnect = () => {
    if (serviceRef.current) {
      serviceRef.current.reconnect();
    }
  };

  return {
    connectionState,
    reconnect,
    isConnected: connectionState.status === 'connected',
    isConnecting: connectionState.status === 'connecting',
    hasError: connectionState.status === 'error'
  };
}
