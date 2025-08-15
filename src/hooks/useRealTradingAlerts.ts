
import { useQuery } from '@tanstack/react-query';

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
}

// Fetch real trading alerts from the Supabase function
const fetchTradingAlerts = async (): Promise<TradingAlert[]> => {
  const response = await fetch('https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/active-trades-widget-api', {
    headers: {
      'Cache-Control': 'no-cache',
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch trading alerts: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Return empty array if no alerts, don't fallback to demo data
  return data.alerts || [];
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
