import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActiveAlert {
  id: string;
  symbol: string;
  trader: string;
  position_type: 'long' | 'short';
  entry_price: number;
  current_price?: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  status: 'active' | 'awaiting' | 'closed';
  created_at: string;
  targets?: number[];
}

interface Subscriber {
  subscription_tier: 'free' | 'paid' | 'premium';
  email: string;
}

export const useActiveAlertsRest = (limit: number = 10, subscriber?: Subscriber) => {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        
        // Only fetch if user has paid/premium access
        if (!subscriber || subscriber.subscription_tier === 'free') {
          setAlerts([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('analyst_signals')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('Error fetching active alerts:', error);
          setError(error.message);
        } else {
          // Transform the data to match the expected format
          const transformedAlerts: ActiveAlert[] = (data || []).map(signal => {
            // Convert trade_direction to position_type
            let position_type: 'long' | 'short' = 'long';
            if (signal.trade_direction === 'short' || signal.trade_direction === 'bear' || signal.trade_direction === 'put') {
              position_type = 'short';
            } else if (signal.trade_direction === 'long' || signal.trade_direction === 'bull' || signal.trade_direction === 'call') {
              position_type = 'long';
            }

            // Convert targets to number array
            let targets: number[] = [];
            if (Array.isArray(signal.targets)) {
              targets = signal.targets.map(t => typeof t === 'number' ? t : parseFloat(String(t))).filter(t => !isNaN(t));
            }

            return {
              id: signal.id,
              symbol: signal.ticker,
              trader: signal.analyst_name,
              position_type,
              entry_price: signal.entry_price || 0,
              current_price: signal.entry_price, // Would be updated with real-time data
              stop_loss_price: signal.stop_loss_price,
              take_profit_price: targets[0] || null,
              status: signal.status === 'active' ? 'active' : 'awaiting',
              created_at: signal.created_at,
              targets
            };
          });
          
          setAlerts(transformedAlerts);
        }
      } catch (err) {
        console.error('Error in useActiveAlertsRest:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, [limit, subscriber?.subscription_tier, subscriber?.email]);

  return {
    data: alerts,
    isLoading,
    error,
    refetch: () => {
      // Re-run the effect
      setIsLoading(true);
    }
  };
};