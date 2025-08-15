
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TradingAlert {
  id: string;
  symbol: string;
  trader: string;
  entry_price: number;
  current_price: number;
  profit_loss: number;
  profit_percentage: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  size_level?: string;
  entry_type?: string;
  reasoning?: string;
  targets?: number[];
  direction?: string;
}

// Fetch real trading alerts from the live_trading_signals table
const fetchTradingAlerts = async (): Promise<TradingAlert[]> => {
  try {
    const { data: signals, error } = await supabase
      .from('live_trading_signals')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch live trading signals: ${error.message}`);
    }
    
    // Convert live_trading_signals to TradingAlert format
    return (signals || []).map((signal: any) => ({
      id: signal.id,
      symbol: signal.ticker,
      trader: 'Live Signal', // Default trader name
      entry_price: signal.entry_price || signal.current_price || 0,
      current_price: signal.current_price || signal.entry_price || 0,
      profit_loss: 0, // Will be calculated by price engine
      profit_percentage: 0, // Will be calculated by price engine
      stop_loss_price: signal.stop_loss_price,
      take_profit_price: signal.targets && Array.isArray(signal.targets) && signal.targets.length > 0 
        ? signal.targets[0] 
        : undefined,
      size_level: signal.size_level,
      entry_type: signal.entry_type,
      reasoning: signal.reasoning,
      targets: signal.targets || [],
      direction: signal.direction,
    }));
  } catch (error) {
    console.error('Error fetching live trading signals:', error);
    return [];
  }
};

export function useRealTradingAlerts() {
  return useQuery({
    queryKey: ['real-trading-alerts'],
    queryFn: fetchTradingAlerts,
    refetchInterval: 30000, // Increased from 5 seconds to reduce load
    staleTime: 2000, // Consider data stale after 2 seconds
    retry: 2, // Retry failed requests twice
  });
}
