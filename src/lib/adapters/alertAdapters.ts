import { BaseAlert } from '@/components/shared/alerts/SharedAlertCard';
import type { DegenCall } from '@/hooks/useDegenCallAlerts';

// Interface for Live Alerts from live_trading_signals table  
export interface LiveAlert {
  id: string;
  symbol: string;
  trader: string;
  entry_price: number;
  current_price: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  position_type?: 'long' | 'short';
  status: 'active' | 'awaiting' | 'closed';
  profit_loss?: number;
  profit_percentage?: number;
  created_at: string;
  size_level?: string;
  entry_type?: string;
  reasoning?: string;
  targets?: number[];
}

// Interface for Live Trading Alerts from active-trades-widget (DEPRECATED - use LiveAlert)
export interface LiveTradingAlert {
  id: string;
  symbol: string;
  trader: string;
  entry_price: number;
  current_price: number;
  profit_loss: number;
  profit_percentage: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  entry_activated?: boolean;
}

// Interface for Crypto Alerts from crypto_alerts table
export interface CryptoAlert {
  id: string;
  symbol: string;
  trader_name: string;
  entry_price: number;
  current_price?: number;
  target_price: number;
  stop_loss_price?: number;
  position_type: 'long' | 'short';
  status: 'active' | 'awaiting' | 'closed';
  profit_loss?: number;
  profit_percentage?: number;
  entry_activated: boolean;
}

// Adapter function to convert useLiveAlerts LiveAlert to BaseAlert
export const adaptLiveAlert = (alert: import('@/hooks/useLiveAlerts').LiveAlert): BaseAlert => {
  // Handle entry_price conversion
  const entryPrice = typeof alert.entry_price === 'string' 
    ? parseFloat(alert.entry_price) || 0 
    : alert.entry_price || 0;

  return {
    id: alert.id,
    symbol: alert.symbol,
    trader: alert.trader,
    entry_price: entryPrice,
    current_price: alert.current_price || 0,
    stop_loss_price: alert.stop_loss_price,
    take_profit_price: alert.take_profit_price,
    position_type: alert.position_type || 'long',
    status: alert.status,
    profit_loss: alert.profit_loss,
    profit_percentage: alert.profit_percentage,
  };
};

// Adapter functions to convert different alert types to BaseAlert
export const adaptLiveTradingAlert = (alert: LiveTradingAlert): BaseAlert => {
  return {
    id: alert.id,
    symbol: alert.symbol,
    trader: alert.trader,
    entry_price: alert.entry_price,
    current_price: alert.current_price,
    stop_loss_price: alert.stop_loss_price,
    take_profit_price: alert.take_profit_price,
    position_type: 'long', // Live trading alerts don't specify position type, default to long
    status: alert.entry_activated ? 'active' : 'awaiting',
    profit_loss: alert.profit_loss,
    profit_percentage: alert.profit_percentage,
  };
};

export const adaptDegenCallAlert = (alert: DegenCall): BaseAlert => {
  // Convert direction to position_type
  let position_type: 'long' | 'short' = 'long';
  if (alert.direction === 'short') {
    position_type = 'short';
  }

  // Convert string entry_price to number
  const entryPrice = typeof alert.entry_price === 'string' 
    ? parseFloat(alert.entry_price) || 0 
    : alert.entry_price || 0;

  // Convert string stop_loss to number
  const stopLoss = alert.stop_loss 
    ? parseFloat(alert.stop_loss) || undefined 
    : undefined;

  return {
    id: alert.id,
    symbol: alert.coin,
    trader: alert.analyst_name || 'Unknown',
    entry_price: entryPrice,
    stop_loss_price: stopLoss,
    take_profit_price: alert.targets?.[0], // Use first target as take profit
    position_type,
    status: 'active', // DegenCall doesn't have status, default to active
  };
};

export const adaptCryptoAlert = (alert: CryptoAlert): BaseAlert => {
  return {
    id: alert.id,
    symbol: alert.symbol,
    trader: alert.trader_name,
    entry_price: alert.entry_price,
    current_price: alert.current_price,
    stop_loss_price: alert.stop_loss_price,
    take_profit_price: alert.target_price,
    position_type: alert.position_type,
    status: alert.status,
    profit_loss: alert.profit_loss,
    profit_percentage: alert.profit_percentage,
  };
};

// Utility function to sort alerts by creation time or priority
export const sortAlerts = (alerts: BaseAlert[], sortBy: 'newest' | 'oldest' | 'profit' = 'newest'): BaseAlert[] => {
  return [...alerts].sort((a, b) => {
    switch (sortBy) {
      case 'profit':
        return (b.profit_percentage || 0) - (a.profit_percentage || 0);
      case 'oldest':
        return a.id.localeCompare(b.id); // Simple ID-based sorting
      case 'newest':
      default:
        return b.id.localeCompare(a.id); // Simple ID-based sorting
    }
  });
};

// Filter alerts by status
export const filterAlertsByStatus = (alerts: BaseAlert[], status?: 'active' | 'awaiting' | 'closed'): BaseAlert[] => {
  if (!status) return alerts;
  return alerts.filter(alert => alert.status === status);
};

// Filter alerts by position type  
export const filterAlertsByPosition = (alerts: BaseAlert[], positionType?: 'long' | 'short'): BaseAlert[] => {
  if (!positionType) return alerts;
  return alerts.filter(alert => alert.position_type === positionType);
};