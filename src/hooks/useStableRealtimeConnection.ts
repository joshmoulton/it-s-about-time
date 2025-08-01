
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

interface UseStableRealtimeConnectionOptions {
  tables: string[];
  queryKeys: string[][];
  enabled?: boolean;
}

export function useStableRealtimeConnection({
  tables,
  queryKeys,
  enabled = true
}: UseStableRealtimeConnectionOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const lastInvalidationRef = useRef<Record<string, number>>({});
  
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastConnected: null,
    error: null,
    reconnectAttempts: 0
  });

  // Throttled query invalidation to prevent excessive refetching (minimum 3 seconds between invalidations)
  const invalidateQueries = useCallback((table: string) => {
    if (!mountedRef.current) return;
    
    const now = Date.now();
    const throttleKey = `throttle-${table}`;
    
    if (now - (lastInvalidationRef.current[throttleKey] || 0) >= 3000) {
      console.log(`🔄 Invalidating queries for ${table}`);
      
      // Only invalidate specific relevant queries
      queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey, exact: false });
      });
      
      lastInvalidationRef.current[throttleKey] = now;
    }
  }, [queryClient, queryKeys]);

  // Stable cleanup function
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('🧹 Cleaning up realtime connection');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
      channelRef.current = null;
    }
  }, []);

  // Stable connect function with improved error handling
  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current || channelRef.current) return;

    console.log('🔌 Establishing stable realtime connection...');
    
    setConnectionState(prev => ({ 
      ...prev, 
      status: 'connecting', 
      error: null 
    }));

    try {
      // Use a simpler channel name
      const channel = supabase.channel(`chat-${Date.now()}`);

      // Subscribe to table changes with throttled invalidation
      tables.forEach(table => {
        console.log(`📡 Subscribing to ${table}`);
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            if (mountedRef.current) {
              console.log(`📩 ${payload.eventType} for ${table}`);
              invalidateQueries(table);
            }
          }
        );
      });

      channel.subscribe((status) => {
        if (!mountedRef.current) return;
        
        console.log(`📡 Connection status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          setConnectionState({
            status: 'connected',
            lastConnected: new Date(),
            error: null,
            reconnectAttempts: 0
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionState(prev => ({
            ...prev,
            status: 'error',
            error: `Connection failed: ${status}`,
            reconnectAttempts: prev.reconnectAttempts + 1
          }));
        } else if (status === 'CLOSED') {
          setConnectionState(prev => ({ 
            ...prev, 
            status: 'disconnected' 
          }));
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ Error creating realtime connection:', error);
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Connection error',
        reconnectAttempts: prev.reconnectAttempts + 1
      }));
    }
  }, [enabled, tables, invalidateQueries]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnect triggered');
    cleanup();
    setConnectionState(prev => ({
      status: 'disconnected',
      lastConnected: prev.lastConnected,
      error: null,
      reconnectAttempts: prev.reconnectAttempts + 1
    }));
    
    // Small delay before reconnecting
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 1000);
  }, [cleanup, connect]);

  // Connection management effect
  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled) {
      connect();
    }
    
    return cleanup;
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
    isConnected: connectionState.status === 'connected',
    isConnecting: connectionState.status === 'connecting',
    hasError: connectionState.status === 'error'
  };
}
