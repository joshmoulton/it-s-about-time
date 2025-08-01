
import { useEffect, useState } from 'react';
import IntegratedChatService from '@/services/chat/IntegratedChatService';
import type { ChatMessage } from '@/services/chat/types';
import type { ConnectionState } from '@/services/chat/IntegratedChatService';

export function useIntegratedChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  });

  useEffect(() => {
    const chatService = IntegratedChatService.getInstance();
    
    // Subscribe to messages
    const unsubscribeMessages = chatService.subscribeToMessages(setMessages);
    
    // Subscribe to connection state
    const unsubscribeConnection = chatService.subscribeToConnection(setConnectionState);
    
    // Cleanup on unmount
    return () => {
      unsubscribeMessages();
      unsubscribeConnection();
    };
  }, []);

  const forceRefresh = () => {
    const chatService = IntegratedChatService.getInstance();
    chatService.forceRefresh();
  };

  const reconnect = () => {
    const chatService = IntegratedChatService.getInstance();
    chatService.reconnect();
  };

  const getCommandSessionManager = () => {
    return null; // Command session manager temporarily unavailable
  };

  return {
    messages,
    connectionState,
    forceRefresh,
    reconnect,
    getCommandSessionManager,
    isConnected: connectionState.status === 'connected',
    isConnecting: connectionState.status === 'connecting',
    hasError: connectionState.status === 'error'
  };
}
