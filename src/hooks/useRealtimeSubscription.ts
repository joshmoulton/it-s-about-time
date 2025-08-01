
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionOptions {
  table: string;
  queryKey: string[];
  filter?: string;
  enabled?: boolean;
  throttleMs?: number; // Add throttling option for high-frequency updates
}

export function useRealtimeSubscription({
  table,
  queryKey,
  filter,
  enabled = true,
  throttleMs = 1000, // Default 1 second throttle
}: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribed = useRef(false);
  const lastInvalidation = useRef(0);

  useEffect(() => {
    if (!enabled || isSubscribed.current) return;

    // Create a unique channel name to avoid conflicts
    const channelName = `${table}-changes-${Date.now()}-${Math.random()}`;
    
    console.log(`🔔 Creating enhanced realtime subscription for ${table}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          console.log(`Realtime update for ${table}:`, payload);
          
          // Throttle invalidations to prevent excessive updates
          const now = Date.now();
          if (now - lastInvalidation.current >= throttleMs) {
            // Invalidate and refetch queries
            queryClient.invalidateQueries({ queryKey });
            lastInvalidation.current = now;
          }
          
          // Handle specific events
          if (payload.eventType === 'INSERT') {
            console.log(`New ${table} record:`, payload.new);
          } else if (payload.eventType === 'UPDATE') {
            console.log(`Updated ${table} record:`, payload.new);
          } else if (payload.eventType === 'DELETE') {
            console.log(`Deleted ${table} record:`, payload.old);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Enhanced subscription status for ${table}:`, status);
        if (status === 'SUBSCRIBED') {
          isSubscribed.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Channel error for ${table}:`, status);
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (channelRef.current) {
              console.log(`🔄 Attempting to reconnect ${table} subscription`);
              channelRef.current.subscribe();
            }
          }, 5000);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(`🔇 Cleaning up enhanced subscription for ${table}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribed.current = false;
      }
    };
  }, [table, queryKey, filter, enabled, queryClient, throttleMs]);

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        console.log(`🧹 Final cleanup for ${table} subscription`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribed.current = false;
      }
    };
  }, []);

  return channelRef.current;
}
