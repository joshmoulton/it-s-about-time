import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, ExternalLink, TrendingUp, DollarSign, Clock, Target } from 'lucide-react';
import { useLiveAlerts } from '@/hooks/useLiveAlerts';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface LiveAlertsWidgetProps {
  subscriber: Subscriber;
  hideHeader?: boolean;
}

export function LiveAlertsWidget({
  subscriber,
  hideHeader = false
}: LiveAlertsWidgetProps) {
  const navigate = useNavigate();
  const {
    data: liveAlerts,
    isLoading
  } = useLiveAlerts(1, subscriber); // Last 1 alert for consistent height with other widgets

  // Get current crypto prices for market price display
  const tickers = liveAlerts?.map(alert => alert.symbol) || [];
  const { data: cryptoPrices } = useCryptoPrices(tickers);

  const handleViewAllAlerts = () => {
    navigate('/dashboard?section=live-alerts');
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (price == null || price === 'Market') return price === 'Market' ? 'Market' : 'N/A';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'N/A';
    
    // Format with appropriate precision and remove trailing zeros
    let formatted: string;
    if (numPrice >= 1) {
      // For prices >= $1, use up to 8 decimals but remove trailing zeros
      formatted = numPrice.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8
      });
    } else if (numPrice >= 0.01) {
      // For prices >= $0.01, use up to 6 decimals
      formatted = numPrice.toFixed(6).replace(/\.?0+$/, '');
    } else {
      // For very small prices, use up to 8 decimals
      formatted = numPrice.toFixed(8).replace(/\.?0+$/, '');
    }
    
    return `$${formatted}`;
  };

  // Get current market price for ticker
  const getPriceForTicker = (ticker: string) => {
    return cryptoPrices?.find(p => p.ticker === ticker.toUpperCase());
  };

  return (
    <ModernCard className="h-full min-h-[300px] flex flex-col bg-gradient-to-br from-green-900/20 via-emerald-900/10 to-slate-800/50 border-green-500/20 hover:border-green-400/30 transition-all duration-200" interactive data-tour="live-alerts-widget">
      {!hideHeader && (
        <ModernCardHeader className="pb-2 pt-3 flex-shrink-0 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <ModernCardTitle className="text-sm text-white">🧙‍♂️ Live Trading Alerts</ModernCardTitle>
              </div>
            </div>
            {/* Spacer to match other widgets */}
            <div className="h-10 w-16"></div>
          </div>
        </ModernCardHeader>
      )}

      <ModernCardContent className={`flex-1 flex flex-col ${hideHeader ? 'pt-0' : 'pt-0'} px-4 pb-4`}>
        <div className="flex-1 flex flex-col gap-3">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500" />
            </div>
          ) : liveAlerts && liveAlerts.length > 0 ? (
            <div className="space-y-3">
              {liveAlerts.map(alert => (
                <div key={alert.id} className="bg-green-900/25 border border-green-500/30 rounded-md px-2.5 py-2 hover:border-green-400/40 hover:bg-green-900/35 transition-all duration-200 shadow-sm space-y-2">
                  {/* Header with symbol, direction, and timestamp */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-md flex items-center justify-center">
                        <Activity className="w-2.5 h-2.5 text-white" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white text-sm font-bold">{alert.symbol}</span>
                        <Badge variant="outline" className={`text-xs px-1.5 py-0.5 border ${
                          alert.position_type === 'long' 
                            ? 'border-green-400/50 text-green-200 bg-green-500/10' 
                            : 'border-red-400/50 text-red-200 bg-red-500/10'
                        }`}>
                          {alert.position_type.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-green-200/80">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatTimeAgo(alert.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trader name */}
                  {alert.trader && (
                    <div className="flex items-center gap-1.5 pb-1.5 border-b border-green-500/20">
                      <span className="text-xs text-green-300">Called by:</span>
                      <span className="text-xs text-white font-medium">{alert.trader}</span>
                    </div>
                  )}

                   {/* Current Market Price & P&L Section */}
                  <div className="bg-black/20 rounded-md p-1.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-green-200/80">Current Price:</span>
                      </div>
                      <span className="text-white font-semibold text-sm">
                        {alert.current_price ? formatPrice(alert.current_price) : (
                          (() => {
                            const currentPrice = getPriceForTicker(alert.symbol);
                            return currentPrice ? formatPrice(currentPrice.price_usd) : 'Loading...';
                          })()
                        )}
                      </span>
                    </div>
                    
                    {/* Show P&L if available */}
                    {alert.current_profit_pct != null && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className={`w-3 h-3 ${alert.current_profit_pct >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                          <span className="text-xs text-green-200/80">P&L:</span>
                        </div>
                        <span className={`font-semibold text-sm ${alert.current_profit_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {alert.current_profit_pct >= 0 ? '+' : ''}{alert.current_profit_pct.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Trading details */}
                  <div className="space-y-1">
                    {/* Entry */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-200/80">Entry:</span>
                      </div>
                      <span className="text-white font-medium text-xs">
                        {formatPrice(alert.entry_price)}
                      </span>
                    </div>

                    {/* Stop Loss */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-xs text-green-200/80">Stop Loss:</span>
                      </div>
                      <span className="text-white font-medium text-xs">
                        {formatPrice(alert.stop_loss_price)}
                      </span>
                    </div>

                    {/* Targets with hit indicators */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-2.5 h-2.5 text-green-400" />
                        <span className="text-xs text-green-200/80">Targets:</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {alert.targets && alert.targets.length > 0 ? (
                          alert.targets.slice(0, 3).map((target, index) => {
                            const isHit = alert.hit_targets?.includes(target);
                            return (
                              <span 
                                key={index} 
                                className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                  isHit 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-600 text-gray-200'
                                }`}
                              >
                                {formatPrice(target)}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-white font-medium text-xs">
                            {formatPrice(alert.take_profit_price)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status indicators */}
                    {(alert.stopped_out || alert.invalidation_type) && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${alert.stopped_out ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                          <span className="text-xs text-green-200/80">Status:</span>
                        </div>
                        <span className={`font-medium text-xs ${alert.stopped_out ? 'text-red-400' : 'text-yellow-400'}`}>
                          {alert.stopped_out ? 'Stopped Out' : alert.invalidation_type ? 'Invalidated' : 'Active'}
                        </span>
                      </div>
                    )}
                    
                    {/* Risk */}
                    {alert.risk_percentage && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs text-green-200/80">Risk:</span>
                        </div>
                        <span className="text-white font-medium text-xs">
                          {alert.risk_percentage}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-1">
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl h-12 text-sm font-medium shadow-sm transition-all duration-200" 
                  onClick={handleViewAllAlerts}
                >
                  <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                  View All Live Alerts
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-green-200/80">
              No active live alerts
            </div>
          )}
        </div>
      </ModernCardContent>
    </ModernCard>
  );
}