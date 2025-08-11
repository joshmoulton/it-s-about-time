import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DegenCall {
  id: string;
  coin: string; // ticker
  entry_price: string; // string for display, 'Market' if null
  direction?: 'long' | 'short' | 'neutral';
  outcome: 'hit' | 'miss' | 'pending';
  status?: string | null;
  created_at: string;
}

export function useDegenCallAlerts(limit = 10) {
  return useQuery<DegenCall[]>({
    queryKey: ['degenCallAlerts', limit],
    queryFn: async () => {
      // Fetch latest active, posted signals
      const { data, error } = await supabase
        .from('analyst_signals')
        .select('id, ticker, entry_price, trade_direction, entry_type, created_at, status, posted_to_telegram')
        .eq('posted_to_telegram', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('useDegenCallAlerts error:', error);
        return [];
      }

      const mapped: DegenCall[] = (data || []).map((row: any) => ({
        id: row.id,
        coin: (row.ticker || '').toUpperCase(),
        entry_price: row.entry_price != null ? String(row.entry_price) : 'Market',
        direction: row.trade_direction ? String(row.trade_direction).toLowerCase() : undefined,
        outcome: 'pending',
        status: row.status,
        created_at: row.created_at,
      }));

      console.debug('useDegenCallAlerts fetched', { count: mapped.length, limit });
      return mapped;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}