
import { useState, useEffect, useRef } from 'react';
import SimpleChatService, { ChatMessage, ConnectionState } from '@/services/SimpleChatService';

export function useSimpleChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const serviceRef = useRef<SimpleChatService | null>(null);

  useEffect(() => {
    const chatService = SimpleChatService.getInstance();
    serviceRef.current = chatService;
    
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
  }, []);

  const forceRefresh = () => {
    if (serviceRef.current) {
      serviceRef.current.forceRefresh();
    }
  };

  const triggerSync = async () => {
    if (serviceRef.current) {
      return await serviceRef.current.triggerTelegramSync();
    }
  };

  return {
    messages,
    isLoading,
    forceRefresh,
    triggerSync
  };
}

export function useSimpleChatConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastConnected: null,
    lastSyncTime: null,
    error: null
  });
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const chatService = SimpleChatService.getInstance();
    
    // Subscribe to connection updates
    unsubscribeRef.current = chatService.subscribeToConnection((newState) => {
      setConnectionState(newState);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    connectionState,
    isConnected: connectionState.status === 'connected',
    isSyncing: connectionState.status === 'syncing',
    hasError: connectionState.status === 'error'
  };
}
