
import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: string | null;
}

interface UseOptimizedRealtimeConnectionOptions {
  tables: string[];
  queryKeys: string[][];
  enabled?: boolean;
  maxReconnectAttempts?: number;
  baseReconnectDelay?: number;
}

export function useOptimizedRealtimeConnection({
  tables,
  queryKeys,
  enabled = true,
  maxReconnectAttempts = 3,
  baseReconnectDelay = 3000
}: UseOptimizedRealtimeConnectionOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const connectionAttemptRef = useRef(0);
  const lastInvalidationRef = useRef<Record<string, number>>({});
  
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  });

  // Throttled query invalidation to prevent excessive refetching
  const invalidateQueries = useCallback((table: string) => {
    if (!mountedRef.current) return;
    
    const now = Date.now();
    const tableKey = `invalidate-${table}`;
    
    // Throttle invalidations to prevent excessive refetching (5 seconds minimum)
    if (now - (lastInvalidationRef.current[tableKey] || 0) >= 5000) {
      console.log(`📨 Invalidating queries for table: ${table}`);
      
      const relevantQueryKeys = queryKeys.filter(key => 
        key.some(part => typeof part === 'string' && part.includes(table))
      );
      
      relevantQueryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      lastInvalidationRef.current[tableKey] = now;
    }
  }, [queryClient, queryKeys]);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (channelRef.current) {
      console.log('🔌 Cleaning up realtime connection');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current || connectionAttemptRef.current >= maxReconnectAttempts) {
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        error: 'Max reconnection attempts exceeded'
      }));
      return;
    }

    const delay = Math.min(baseReconnectDelay * Math.pow(2, connectionAttemptRef.current), 30000);
    console.log(`🔄 Scheduling reconnect in ${Math.round(delay/1000)}s (attempt ${connectionAttemptRef.current + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, delay);
  }, [maxReconnectAttempts, baseReconnectDelay]);

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;

    console.log('🔌 Initiating optimized realtime connection...');
    connectionAttemptRef.current++;
    
    setConnectionState(prev => ({ 
      ...prev, 
      status: 'connecting', 
      error: null,
      reconnectAttempts: connectionAttemptRef.current
    }));

    // Clean up any existing connection
    cleanup();

    try {
      // Create a single multiplexed channel
      const channelName = `optimized-realtime-${Date.now()}`;
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: '' }
        }
      });

      // Subscribe to all specified tables
      tables.forEach(table => {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          (payload) => {
            if (!mountedRef.current) return;
            console.log(`📡 Real-time update for ${table}:`, payload.eventType);
            invalidateQueries(table);
          }
        );
      });

      channel.subscribe((status) => {
        if (!mountedRef.current) return;
        
        console.log(`📡 Connection status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          connectionAttemptRef.current = 0; // Reset attempts on success
          setConnectionState({
            status: 'connected',
            lastConnected: new Date(),
            reconnectAttempts: 0,
            error: null
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionState(prev => ({
            ...prev,
            status: 'reconnecting',
            error: `Connection failed: ${status}`
          }));
          scheduleReconnect();
        } else if (status === 'CLOSED') {
          setConnectionState(prev => ({ ...prev, status: 'disconnected' }));
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ Error creating realtime connection:', error);
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown connection error'
      }));
      scheduleReconnect();
    }
  }, [enabled, tables, invalidateQueries, cleanup, scheduleReconnect]);

  const disconnect = useCallback(() => {
    cleanup();
    connectionAttemptRef.current = 0;
    setConnectionState({
      status: 'disconnected',
      lastConnected: null,
      reconnectAttempts: 0,
      error: null
    });
  }, [cleanup]);

  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnect triggered');
    connectionAttemptRef.current = 0;
    disconnect();
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 1000);
  }, [disconnect, connect]);

  // Initial connection with delay to prevent immediate connection floods
  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, 500); // Slight delay to prevent connection floods
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [enabled, connect, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    connectionState,
    reconnect,
    disconnect,
    isConnected: connectionState.status === 'connected',
    isConnecting: ['connecting', 'reconnecting'].includes(connectionState.status),
    hasError: connectionState.status === 'error'
  };
}
