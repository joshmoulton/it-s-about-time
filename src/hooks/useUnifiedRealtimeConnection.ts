
import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastConnected: Date | null;
  error: string | null;
  reconnectAttempts: number;
}

interface UseUnifiedRealtimeConnectionOptions {
  enabled?: boolean;
  maxReconnectAttempts?: number;
}

// Singleton pattern to ensure only one connection manager exists
class RealtimeConnectionManager {
  private static instance: RealtimeConnectionManager | null = null;
  private channel: RealtimeChannel | null = null;
  private subscribers: Set<(state: ConnectionState) => void> = new Set();
  private queryClient: any = null;
  private connectionState: ConnectionState = {
    status: 'disconnected',
    lastConnected: null,
    error: null,
    reconnectAttempts: 0
  };
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private lastInvalidation: Record<string, number> = {};
  private maxReconnectAttempts = 3;

  static getInstance(): RealtimeConnectionManager {
    if (!this.instance) {
      this.instance = new RealtimeConnectionManager();
    }
    return this.instance;
  }

  initialize(queryClient: any, maxReconnectAttempts: number = 3) {
    this.queryClient = queryClient;
    this.maxReconnectAttempts = maxReconnectAttempts;
  }

  subscribe(callback: (state: ConnectionState) => void): () => void {
    this.subscribers.add(callback);
    // Immediately notify with current state
    callback({ ...this.connectionState });
    
    return () => {
      this.subscribers.delete(callback);
      // Clean up if no more subscribers
      if (this.subscribers.size === 0) {
        this.cleanup();
      }
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback({ ...this.connectionState });
      } catch (error) {
        console.error('Error in realtime subscriber callback:', error);
      }
    });
  }

  private updateConnectionState(updates: Partial<ConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.notifySubscribers();
  }

  private throttledInvalidateQueries(table: string) {
    if (!this.queryClient) return;
    
    const now = Date.now();
    const key = `invalidate-${table}`;
    
    // Throttle to prevent excessive invalidations (3 seconds minimum)
    if (now - (this.lastInvalidation[key] || 0) >= 3000) {
      // Invalidate relevant queries based on table
      const queryKeys = [
        ['telegram-messages'],
        ['chat-highlights'],
        ['telegram-topics']
      ];
      
      queryKeys.forEach(queryKey => {
        this.queryClient.invalidateQueries({ queryKey });
      });
      
      this.lastInvalidation[key] = now;
    }
  }

  connect() {
    if (this.channel || this.connectionState.status === 'connecting') {
      return; // Already connecting or connected
    }

    this.updateConnectionState({ status: 'connecting', error: null });

    try {
      // Create a single unified channel with timeout configuration
      const channelName = `unified-realtime-${Date.now()}`;
      this.channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
          private: false
        }
      });

      // Listen to telegram_messages table changes
      this.channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'telegram_messages'
          },
          (payload) => {
            // Silently process real-time updates
            this.throttledInvalidateQueries('telegram_messages');
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'telegram_topics'
          },
          (payload) => {
            // Silently process real-time updates
            this.throttledInvalidateQueries('telegram_topics');
          }
        );

      this.channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.updateConnectionState({
            status: 'connected',
            lastConnected: new Date(),
            reconnectAttempts: 0,
            error: null
          });
          
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Silently handle errors without logging to console
          this.handleConnectionErrorSilently(`Connection failed: ${status}`);
        } else if (status === 'CLOSED') {
          this.updateConnectionState({ status: 'disconnected' });
        }
      });
    } catch (error) {
      this.updateConnectionState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown connection error'
      });
      this.scheduleReconnectSilently();
    }
  }

  private handleConnectionErrorSilently(error: string) {
    // Clean up existing channel immediately on timeout
    if (error.includes('TIMED_OUT') && this.channel) {
      try {
        supabase.removeChannel(this.channel);
        this.channel = null;
      } catch (cleanupError) {
        // Silently handle cleanup errors
      }
    }
    
    this.updateConnectionState({
      status: 'error',
      error,
      reconnectAttempts: this.connectionState.reconnectAttempts + 1
    });

    this.scheduleReconnectSilently();
  }

  private handleConnectionError(error: string) {
    console.error('❌ Unified connection error:', error);
    this.handleConnectionErrorSilently(error);
  }

  private scheduleReconnectSilently() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.connectionState.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    const delay = Math.min(5000 * Math.pow(2, this.connectionState.reconnectAttempts), 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      this.cleanup();
      this.connect();
    }, delay);
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.connectionState.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(5000 * Math.pow(2, this.connectionState.reconnectAttempts), 30000);
    console.log(`🔄 Scheduling reconnect in ${Math.round(delay/1000)}s`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.cleanup();
      this.connect();
    }, delay);
  }

  reconnect() {
    this.updateConnectionState({ reconnectAttempts: 0, error: null });
    this.cleanup();
    setTimeout(() => this.connect(), 1000);
  }

  private cleanup() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch (error) {
        // Silently handle cleanup errors
      }
      this.channel = null;
    }
  }

  destroy() {
    this.cleanup();
    this.subscribers.clear();
    RealtimeConnectionManager.instance = null;
  }
}

export function useUnifiedRealtimeConnection({
  enabled = true,
  maxReconnectAttempts = 3
}: UseUnifiedRealtimeConnectionOptions = {}) {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastConnected: null,
    error: null,
    reconnectAttempts: 0
  });
  
  const managerRef = useRef<RealtimeConnectionManager | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Get singleton instance
    const manager = RealtimeConnectionManager.getInstance();
    managerRef.current = manager;
    
    // Initialize with query client
    manager.initialize(queryClient, maxReconnectAttempts);
    
    // Subscribe to connection state changes
    unsubscribeRef.current = manager.subscribe(setConnectionState);
    
    // Start connection
    manager.connect();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, queryClient, maxReconnectAttempts]);

  const reconnect = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.reconnect();
    }
  }, []);

  return {
    connectionState,
    reconnect,
    isConnected: connectionState.status === 'connected',
    isConnecting: connectionState.status === 'connecting',
    hasError: connectionState.status === 'error'
  };
}
