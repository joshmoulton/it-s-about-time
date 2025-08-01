
import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, ConnectionState } from '@/services/SimpleChatService';

// Simple unified hooks that work reliably
export function useUnifiedChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeChat = async () => {
      try {
        // Simple direct import to avoid circular dependencies
        const { default: SimpleChatService } = await import('@/services/SimpleChatService');
        
        if (!mounted) return;
        
        const chatService = SimpleChatService.getInstance();
        
        unsubscribeRef.current = chatService.subscribeToMessages((newMessages) => {
          if (mounted) {
            console.log('📨 Received messages update:', { messageCount: newMessages.length, messages: newMessages.slice(0, 3) });
            setMessages(newMessages);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('❌ Failed to initialize chat:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeChat();

    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const forceRefresh = async () => {
    try {
      const { default: SimpleChatService } = await import('@/services/SimpleChatService');
      const chatService = SimpleChatService.getInstance();
      await chatService.forceRefresh();
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
    }
  };

  return {
    messages,
    isLoading,
    forceRefresh
  };
}

export function useUnifiedChatConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastConnected: null,
    lastSyncTime: null,
    error: null
  });
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeConnection = async () => {
      try {
        const { default: SimpleChatService } = await import('@/services/SimpleChatService');
        
        if (!mounted) return;
        
        const chatService = SimpleChatService.getInstance();
        
        unsubscribeRef.current = chatService.subscribeToConnection((newState) => {
          if (mounted) {
            console.log('🔗 Connection state update:', newState);
            setConnectionState(newState);
          }
        });
      } catch (error) {
        console.error('❌ Failed to initialize connection:', error);
      }
    };

    initializeConnection();

    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const isConnected = connectionState.status === 'connected';

  return {
    connectionState,
    isConnected
  };
}
