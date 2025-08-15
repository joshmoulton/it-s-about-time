
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

// Fetch real trading alerts from the analyst_signals table
const fetchTradingAlerts = async (): Promise<TradingAlert[]> => {
  try {
    const response = await fetch('https://wrvvlmevpvcenauglcyz.supabase.co/rest/v1/analyst_signals?status=eq.active&select=*', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTM5NTAsImV4cCI6MjA2NTQyOTk1MH0.iR1E5RqVrH7OsDdIqDvMWsc5d2jK9Qg9Ck-2lpi3E2g',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTM5NTAsImV4cCI6MjA2NTQyOTk1MH0.iR1E5RqVrH7OsDdIqDvMWsc5d2jK9Qg9Ck-2lpi3E2g',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch trading alerts: ${response.status}`);
    }
    
    const signals = await response.json();
    
    // Convert analyst_signals to TradingAlert format
    return signals.map((signal: any) => ({
      id: signal.id,
      symbol: signal.ticker,
      trader: signal.analyst_name,
      entry_price: signal.entry_price || 0,
      current_price: signal.entry_price || 0, // Will be updated by signal engine
      profit_loss: 0, // Will be calculated
      profit_percentage: 0, // Will be calculated  
      stop_loss_price: signal.stop_loss_price,
      take_profit_price: signal.targets && Array.isArray(signal.targets) && signal.targets.length > 0 
        ? parseFloat(signal.targets[0]) 
        : undefined,
    })) || [];
  } catch (error) {
    console.error('Error fetching analyst signals:', error);
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
