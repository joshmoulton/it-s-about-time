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
  stop_loss?: string;
  targets?: number[];
  risk_percentage?: number;
  analyst_name?: string;
}

export function useDegenCallAlerts(limit = 10) {
  return useQuery<DegenCall[]>({
    queryKey: ['degenCallAlerts', limit],
    queryFn: async () => {
      // Fetch latest active, posted signals with all needed fields
      const { data, error } = await supabase
        .from('analyst_signals')
        .select('id, ticker, entry_price, trade_direction, entry_type, created_at, status, posted_to_telegram, stop_loss_price, targets, risk_percentage, analyst_name')
        .eq('posted_to_telegram', true)
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
          analyst_name: row.analyst_name || undefined,
        };
      });

      console.debug('useDegenCallAlerts fetched', { count: mapped.length, limit });
      return mapped;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}