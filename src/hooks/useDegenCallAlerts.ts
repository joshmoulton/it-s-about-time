import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DegenCall {
  id: string;
  coin: string; // ticker
  entry_price: string; // string for display, 'Market' if null
  direction?: 'long' | 'short' | 'neutral';
  outcome: 'hit' | 'miss' | 'pending';
  status?: string | null;
  created_at: string;
  stop_loss?: string;
  targets?: number[];
  risk_percentage?: number;
  size?: string; // New size field (tiny, low, med, high, huge)
  risk_management?: string; // Keep for backwards compatibility
  analyst_name?: string;
}

export function useDegenCallAlerts(limit = 10) {
  const queryClient = useQueryClient();

  // Set up real-time subscription for instant updates
  useEffect(() => {
    console.log('Setting up real-time subscription for degen calls...');
    
    const channel = supabase
      .channel('analyst_signals_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analyst_signals',
          filter: 'posted_to_telegram=eq.true'
        },
        (payload) => {
          console.log('New degen call detected:', payload);
          // Invalidate and refetch the query immediately
          queryClient.invalidateQueries({ queryKey: ['degenCallAlerts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analyst_signals',
          filter: 'posted_to_telegram=eq.true'
        },
        (payload) => {
          console.log('Degen call updated:', payload);
          // Invalidate and refetch the query immediately
          queryClient.invalidateQueries({ queryKey: ['degenCallAlerts'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery<DegenCall[]>({
    queryKey: ['degenCallAlerts', limit],
    queryFn: async () => {
      console.log('Fetching degen calls from database...');
      // Fetch latest active signals - include entry_conditions for size info
      const { data, error } = await supabase
        .from('analyst_signals')
        .select('id, ticker, entry_price, trade_direction, entry_type, created_at, status, posted_to_telegram, stop_loss_price, targets, risk_percentage, risk_management, analyst_name, entry_conditions')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('useDegenCallAlerts error:', error);
        return [];
      }

      const mapped: DegenCall[] = (data || []).map((row: any) => {
        let dir: 'long' | 'short' | 'neutral' | undefined = undefined;
        const td = (row.trade_direction ? String(row.trade_direction).toLowerCase() : '').trim();
        if (td === 'long') dir = 'long';
        else if (td === 'short') dir = 'short';
        else if (td) dir = 'neutral';

        return {
          id: row.id,
          coin: (row.ticker || '').toUpperCase(),
          entry_price: row.entry_price != null ? String(row.entry_price) : 'Market',
          direction: dir,
          outcome: 'pending',
          status: row.status,
          created_at: row.created_at,
          stop_loss: row.stop_loss_price != null ? String(row.stop_loss_price) : undefined,
          targets: row.targets ? (Array.isArray(row.targets) ? row.targets : [row.targets]) : undefined,
          risk_percentage: row.risk_percentage || undefined,
          size: row.entry_conditions || undefined, // Size is stored in entry_conditions
          risk_management: row.risk_management || undefined,
          analyst_name: row.analyst_name || undefined,
        };
      });

      console.log('useDegenCallAlerts fetched', { count: mapped.length, limit, data: mapped });
      return mapped;
    },
    staleTime: 5_000, // Reduced stale time for faster updates
    refetchInterval: 15_000, // More frequent polling as backup
  });
}