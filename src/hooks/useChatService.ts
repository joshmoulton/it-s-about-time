
import { useState, useEffect, useRef } from 'react';
import ChatServiceManager, { ChatMessage, ConnectionState } from '@/services/ChatServiceManager';

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const chatService = ChatServiceManager.getInstance();
    
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
    const chatService = ChatServiceManager.getInstance();
    chatService.forceRefresh();
  };

  return {
    messages,
    isLoading,
    forceRefresh
  };
}

export function useChatConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  });
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const chatService = ChatServiceManager.getInstance();
    
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

  const reconnect = () => {
    const chatService = ChatServiceManager.getInstance();
    chatService.reconnect();
  };

  return {
    connectionState,
    reconnect,
    isConnected: connectionState.status === 'connected',
    isConnecting: connectionState.status === 'connecting',
    hasError: connectionState.status === 'error'
  };
}

// Legacy compatibility hook - simplified
export function useStableTelegramMessages(limit: number = 30) {
  const { messages, isLoading, forceRefresh } = useChatMessages();
  
  return {
    data: messages.slice(0, limit),
    isLoading,
    refetch: forceRefresh,
    error: null
  };
}
