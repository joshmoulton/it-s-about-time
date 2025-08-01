
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

interface UseEnhancedRealtimeConnectionOptions {
  tables: string[];
  queryKeys: string[][];
  enabled?: boolean;
  maxReconnectAttempts?: number;
  baseReconnectDelay?: number;
}

export function useEnhancedRealtimeConnection({
  tables,
  queryKeys,
  enabled = true,
  maxReconnectAttempts = 3,
  baseReconnectDelay = 5000
}: UseEnhancedRealtimeConnectionOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInvalidation = useRef<Record<string, number>>({});
  const isSubscribedRef = useRef(false);
  const mountedRef = useRef(true);
  
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  });

  const invalidateQueries = useCallback((table: string) => {
    if (!mountedRef.current) return;
    
    const now = Date.now();
    const tableKey = `invalidate-${table}`;
    
    // Throttle invalidations to prevent excessive refetching
    if (now - (lastInvalidation.current[tableKey] || 0) >= 2000) {
      const relevantQueryKeys = queryKeys.filter(key => 
        key.some(part => typeof part === 'string' && 
          (part.includes(table) || part.includes('telegram-messages') || part.includes('chat-highlights'))
        )
      );
      
      relevantQueryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      lastInvalidation.current[tableKey] = now;
      console.log(`📨 Invalidated queries for table: ${table}`);
    }
  }, [queryClient, queryKeys]);

  const calculateReconnectDelay = useCallback((attempts: number) => {
    return Math.min(baseReconnectDelay * Math.pow(1.5, attempts), 30000);
  }, [baseReconnectDelay]);

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
    
    isSubscribedRef.current = false;
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current || isSubscribedRef.current) return;

    console.log('🔌 Initiating enhanced realtime connection...');
    setConnectionState(prev => ({ ...prev, status: 'connecting', error: null }));

    // Clean up any existing connection
    cleanup();

    try {
      // Create a single multiplexed channel with unique name
      const channelName = `enhanced-realtime-${Date.now()}`;
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
        
        console.log(`📡 Enhanced connection status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          setConnectionState({
            status: 'connected',
            lastConnected: new Date(),
            reconnectAttempts: 0,
            error: null
          });
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionState(prev => {
            const newAttempts = prev.reconnectAttempts + 1;
            
            if (newAttempts < maxReconnectAttempts) {
              const delay = calculateReconnectDelay(newAttempts);
              console.log(`🔄 Scheduling reconnect in ${Math.round(delay/1000)}s (attempt ${newAttempts})`);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current) {
                  cleanup();
                  connect();
                }
              }, delay);
              
              return {
                status: 'reconnecting',
                lastConnected: prev.lastConnected,
                reconnectAttempts: newAttempts,
                error: `Connection failed: ${status}`
              };
            } else {
              return {
                ...prev,
                status: 'error',
                error: `Max reconnection attempts reached: ${status}`
              };
            }
          });
        } else if (status === 'CLOSED') {
          setConnectionState(prev => ({ ...prev, status: 'disconnected' }));
          isSubscribedRef.current = false;
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
    }
  }, [enabled, tables, invalidateQueries, maxReconnectAttempts, calculateReconnectDelay, cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState({
      status: 'disconnected',
      lastConnected: null,
      reconnectAttempts: 0,
      error: null
    });
  }, [cleanup]);

  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnect triggered');
    setConnectionState(prev => ({ ...prev, reconnectAttempts: 0, error: null }));
    disconnect();
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 1000);
  }, [disconnect, connect]);

  // Initial connection
  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, 100);
      
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
    isConnecting: connectionState.status === 'connecting' || connectionState.status === 'reconnecting',
    hasError: connectionState.status === 'error'
  };
}
