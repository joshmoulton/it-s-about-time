import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  risk_percentage?: number;
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
    console.log('Setting up real-time subscription for live alerts...');
    
    const channel = supabase
      .channel('live_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analyst_signals'
        },
        (payload) => {
          console.log('New live alert detected:', payload);
          // Invalidate and refetch the query immediately
          queryClient.invalidateQueries({ queryKey: ['liveAlerts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analyst_signals'
        },
        (payload) => {
          console.log('Live alert updated:', payload);
          // Invalidate and refetch the query immediately
          queryClient.invalidateQueries({ queryKey: ['liveAlerts'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery<LiveAlert[]>({
    queryKey: ['liveAlerts', limit, subscriber?.email],
    queryFn: async () => {
      console.log('🔍 Fetching live alerts for user:', subscriber?.email, 'tier:', subscriber?.subscription_tier);
      
      if (!shouldFetchData) {
        console.log('❌ User does not have access to live alerts');
        return [];
      }

      // Fetch latest active signals for live alerts
      const { data, error } = await supabase
        .from('analyst_signals')
        .select('id, ticker, entry_price, trade_direction, created_at, status, stop_loss_price, targets, risk_percentage, analyst_name')
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
        const direction = row.trade_direction?.toLowerCase() === 'short' ? 'short' : 'long';
        
        return {
          id: row.id,
          symbol: (row.ticker || '').toUpperCase(),
          trader: row.analyst_name || 'Unknown',
          entry_price: row.entry_price != null ? Number(row.entry_price) : 'Market',
          stop_loss_price: row.stop_loss_price != null ? Number(row.stop_loss_price) : undefined,
          take_profit_price: row.targets && row.targets.length > 0 ? Number(row.targets[0]) : undefined,
          position_type: direction,
          status: 'active',
          created_at: row.created_at,
          targets: row.targets ? (Array.isArray(row.targets) ? row.targets.map(Number) : [Number(row.targets)]) : undefined,
          risk_percentage: row.risk_percentage || undefined,
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