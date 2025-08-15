import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LiveAlert {
  id: string;
  symbol: string; // ticker
  trader: string; // analyst_name
  entry_price: number | string;
  current_price?: number;
  profit_loss?: number;
  profit_percentage?: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  position_type: 'long' | 'short';
  status: 'active' | 'awaiting';
  created_at: string;
  targets?: number[];
  hit_targets?: number[];
  risk_percentage?: number;
  current_profit_pct?: number;
  max_profit_pct?: number;
  stopped_out?: boolean;
  invalidation_type?: string;
}

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

export function useLiveAlerts(limit = 10, subscriber?: Subscriber) {
  const queryClient = useQueryClient();
  
  // Only fetch data if user has premium access
  const shouldFetchData = subscriber?.subscription_tier === 'premium' || subscriber?.subscription_tier === 'paid';

  // Set up real-time subscription for instant updates
  useEffect(() => {
    if (!shouldFetchData) return;
    
    console.log('Setting up real-time subscription for live trading...');
    
    const channel = supabase
      .channel('rt:live_trading')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'price_ticks'
        },
        (payload) => {
          console.log('Price tick received:', payload);
          // Invalidate queries to update current prices
          queryClient.invalidateQueries({ queryKey: ['liveAlerts'] });
          queryClient.invalidateQueries({ queryKey: ['cryptoPrices'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signal_events'
        },
        (payload) => {
          console.log('Signal event received:', payload);
          const event = payload.new as any;
          
          // Show toast notifications for important events
          if (event.event === 'target_hit') {
            toast.success(`🎯 Target ${event.level || ''} Hit!`, {
              description: `Signal updated with new target hit`,
            });
          } else if (event.event === 'stop_hit') {
            toast.error(`🛑 Stop Loss Hit!`, {
              description: `Signal has been stopped out`,
            });
          } else if (event.event === 'invalidation') {
            toast.warning(`❌ Signal Invalidated!`, {
              description: `Signal has been invalidated`,
            });
          }
          
          // Invalidate and refetch the query immediately
          queryClient.invalidateQueries({ queryKey: ['liveAlerts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'signals_overview'
        },
        (payload) => {
          console.log('Signal overview updated:', payload);
          // Invalidate and refetch the query immediately
          queryClient.invalidateQueries({ queryKey: ['liveAlerts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signals_overview'
        },
        (payload) => {
          console.log('New signal added:', payload);
          // Invalidate and refetch the query immediately
          queryClient.invalidateQueries({ queryKey: ['liveAlerts'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, shouldFetchData]);

  return useQuery<LiveAlert[]>({
    queryKey: ['liveAlerts', limit, subscriber?.email],
    queryFn: async () => {
      console.log('🔍 Fetching live alerts for user:', subscriber?.email, 'tier:', subscriber?.subscription_tier);
      
      if (!shouldFetchData) {
        console.log('❌ User does not have access to live alerts');
        return [];
      }

      // Fetch latest active signals from signals_overview for enhanced data
      const { data, error } = await supabase
        .from('signals_overview')
        .select(`
          id, ticker, direction, entry_type, entry_price, current_price, 
          stop_loss_price, targets, hit_targets, status, created_at,
          current_profit_pct, max_profit_pct, stopped_out, invalidation_type,
          risk_score, confidence_score, analyst_id
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ useLiveAlerts error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          hint: error.hint,
          details: error.details,
          code: error.code
        });
        return [];
      }

      const mapped: LiveAlert[] = (data || []).map((row: any) => {
        const direction = row.direction?.toLowerCase() === 'short' ? 'short' : 'long';
        
        return {
          id: row.id,
          symbol: (row.ticker || '').toUpperCase(),
          trader: 'Live Signal', // Will be enhanced with analyst lookup later
          entry_price: row.entry_price != null ? Number(row.entry_price) : 'Market',
          current_price: row.current_price != null ? Number(row.current_price) : undefined,
          stop_loss_price: row.stop_loss_price != null ? Number(row.stop_loss_price) : undefined,
          take_profit_price: row.targets && row.targets.length > 0 ? Number(row.targets[0]) : undefined,
          position_type: direction,
          status: row.status || 'active',
          created_at: row.created_at,
          targets: row.targets ? (Array.isArray(row.targets) ? row.targets.map(Number) : [Number(row.targets)]) : undefined,
          hit_targets: row.hit_targets ? (Array.isArray(row.hit_targets) ? row.hit_targets.map(Number) : [Number(row.hit_targets)]) : undefined,
          risk_percentage: row.risk_score || undefined,
          current_profit_pct: row.current_profit_pct != null ? Number(row.current_profit_pct) : undefined,
          max_profit_pct: row.max_profit_pct != null ? Number(row.max_profit_pct) : undefined,
          stopped_out: row.stopped_out || false,
          invalidation_type: row.invalidation_type || undefined,
        };
      });

      console.log('✅ useLiveAlerts fetched', { count: mapped.length, limit, data: mapped });
      return mapped;
    },
    enabled: shouldFetchData, // Only run query if user has access
    staleTime: 30_000, // Cache for 30 seconds
    refetchInterval: shouldFetchData ? 60_000 : false, // Refetch every minute
    refetchOnWindowFocus: false, // Prevent excessive refetching
    refetchOnMount: false, // Use cache if available
  });
}