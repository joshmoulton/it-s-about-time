
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ChatMessage } from '../types';
import { ConnectionStateManager } from './ConnectionStateManager';

export class RealtimeConnectionHandler {
  private realtimeChannel: RealtimeChannel | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private stateManager: ConnectionStateManager;

  constructor(stateManager: ConnectionStateManager) {
    this.stateManager = stateManager;
  }

  setupRealtimeConnection(
    onNewMessage: (message: ChatMessage) => void,
    onMessageUpdate: (message: ChatMessage) => void
  ): void {
    if (this.stateManager.isConnectionCleanedUp()) {
      console.log('⚠️ Connection manager is cleaned up, skipping setup');
      return;
    }

    if (this.realtimeChannel) {
      console.log('🔄 Cleaning up existing connection before setup');
      this.cleanupRealtimeConnection();
    }

    // Set syncing status first
    this.stateManager.updateConnectionState({
      ...this.stateManager.getConnectionState(),
      status: 'syncing'
    });

    console.log('🔌 Setting up real-time connection for messages...');
    
    // Use a unique channel name with timestamp
    const channelName = `telegram-messages-${Date.now()}`;
    
    this.realtimeChannel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: '' }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telegram_messages'
        },
        (payload) => {
          if (!this.stateManager.isConnectionCleanedUp()) {
            console.log('📩 New message received via realtime:', payload.new);
            const message = this.formatMessage(payload.new);
            onNewMessage(message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'telegram_messages'
        },
        (payload) => {
          if (!this.stateManager.isConnectionCleanedUp()) {
            console.log('📝 Message updated via realtime:', payload.new);
            const message = this.formatMessage(payload.new);
            onMessageUpdate(message);
          }
        }
      )
      .subscribe((status) => {
        if (this.stateManager.isConnectionCleanedUp()) return;
        
        console.log('📡 Real-time connection status:', status);
        
        if (status === 'SUBSCRIBED') {
          this.stateManager.updateConnectionState({
            status: 'connected',
            lastConnected: new Date(),
            error: null
          });
          
          // Clear any pending reconnection attempts
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.handleConnectionError(`Connection failed: ${status}`);
        } else if (status === 'CLOSED') {
          this.stateManager.updateConnectionState({
            ...this.stateManager.getConnectionState(),
            status: 'syncing'
          });
        }
      });
  }

  private formatMessage(rawMessage: any): ChatMessage {
    return {
      id: String(rawMessage.id),
      telegram_message_id: rawMessage.telegram_message_id || 0,
      chat_id: rawMessage.chat_id || 0,
      user_id: rawMessage.user_id,
      first_name: rawMessage.first_name,
      last_name: rawMessage.last_name,
      username: rawMessage.username,
      message_text: rawMessage.message_text,
      message_type: rawMessage.message_type || 'text',
      message_thread_id: rawMessage.message_thread_id,
      reply_to_message_id: rawMessage.reply_to_message_id,
      forwarded_from: rawMessage.forwarded_from,
      media_url: rawMessage.media_url,
      media_type: rawMessage.media_type,
      timestamp: rawMessage.timestamp || rawMessage.message_time || new Date().toISOString(),
      message_time: rawMessage.message_time || rawMessage.timestamp || new Date().toISOString(),
      topic_name: rawMessage.topic_name,
      is_highlighted: rawMessage.is_highlighted || false,
      is_hidden: rawMessage.is_hidden || false,
      likes_count: rawMessage.likes_count || 0,
      created_at: rawMessage.created_at || new Date().toISOString(),
      updated_at: rawMessage.updated_at || new Date().toISOString()
    };
  }

  private handleConnectionError(error: string): void {
    console.error('❌ Connection error:', error);
    
    this.stateManager.updateConnectionState({
      ...this.stateManager.getConnectionState(),
      status: 'error',
      error
    });

    // Retry connection after delay (mobile-friendly)
    if (!this.reconnectTimeout && !this.stateManager.isConnectionCleanedUp()) {
      this.reconnectTimeout = setTimeout(() => {
        if (!this.stateManager.isConnectionCleanedUp()) {
          console.log('🔄 Attempting to reconnect...');
          // Don't call setupRealtimeConnection directly - let the service handle retry
        }
        this.reconnectTimeout = null;
      }, 15000); // Wait 15 seconds before allowing reconnection
    }
  }

  cleanupRealtimeConnection(): void {
    if (this.realtimeChannel) {
      console.log('🧹 Cleaning up real-time connection');
      try {
        supabase.removeChannel(this.realtimeChannel);
      } catch (error) {
        console.warn('⚠️ Error removing channel:', error);
      }
      this.realtimeChannel = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  cleanup(): void {
    console.log('🧹 Cleaning up RealtimeConnectionHandler');
    this.cleanupRealtimeConnection();
  }
}
