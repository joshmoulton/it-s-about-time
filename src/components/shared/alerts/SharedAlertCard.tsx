import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface BaseAlert {
  id: string;
  symbol: string;
  trader: string;
  entry_price: number;
  current_price?: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  position_type: 'long' | 'short';
  status?: 'active' | 'awaiting' | 'closed';
  profit_loss?: number;
  profit_percentage?: number;
}

interface SharedAlertCardProps {
  alert: BaseAlert;
  compact?: boolean;
  showLiveIndicator?: boolean;
  statusColor?: string;
}

export function SharedAlertCard({ 
  alert, 
  compact = false, 
  showLiveIndicator = false,
  statusColor = 'bg-green-500'
}: SharedAlertCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const getProfitColor = (profitPercentage?: number) => {
    if (!profitPercentage) return 'text-slate-400';
    return profitPercentage >= 0 ? 'text-green-400' : 'text-red-400';
  };

  if (compact) {
    return (
      <div className="p-3 rounded-lg border bg-card border-border transition-all duration-300 hover:border-border/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-sm">{alert.symbol}</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {alert.position_type.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {showLiveIndicator && (
              <div className={`w-2 h-2 ${statusColor} rounded-full animate-pulse`}></div>
            )}
            <span className="text-xs text-muted-foreground">{alert.trader}</span>
          </div>
        </div>
        
        {/* Price Information */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {alert.stop_loss_price && (
            <div className="text-center">
              <div className="text-destructive font-medium text-xs">SL</div>
              <div className="text-destructive font-bold">{formatPrice(alert.stop_loss_price)}</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-primary font-medium text-xs">Entry</div>
            <div className="text-primary font-bold">{formatPrice(alert.entry_price)}</div>
          </div>
          {alert.take_profit_price && (
            <div className="text-center">
              <div className="text-green-400 font-medium text-xs">TP</div>
              <div className="text-green-400 font-bold">{formatPrice(alert.take_profit_price)}</div>
            </div>
          )}
        </div>

        {/* Current Price and P&L */}
        {alert.current_price && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="text-muted-foreground">Current: </span>
                <span className="text-foreground font-medium">{formatPrice(alert.current_price)}</span>
              </div>
              {alert.profit_percentage !== undefined && (
                <div className={`font-bold ${getProfitColor(alert.profit_percentage)}`}>
                  {alert.profit_percentage >= 0 ? '+' : ''}{alert.profit_percentage.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-lg p-4 border-2 bg-card border-border transition-all duration-300 hover:border-border/80">
      {/* Header with Symbol and Trader */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-lg font-bold text-primary mb-1">{alert.symbol}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{alert.trader}</span>
            <div className="flex gap-1">
              <Badge variant={alert.position_type === 'long' ? 'default' : 'destructive'} className="text-xs">
                {alert.position_type.toUpperCase()}
              </Badge>
              {alert.status && (
                <Badge variant="secondary" className="text-xs">
                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {showLiveIndicator && (
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 ${statusColor} rounded-full animate-pulse`}></div>
            <span className="text-xs text-green-400">Live</span>
          </div>
        )}
      </div>
      
      {/* Price Details */}
      <div className="flex justify-between items-center text-sm mb-3">
        {alert.stop_loss_price && (
          <div className="text-center">
            <div className="text-muted-foreground text-xs">Stop Loss</div>
            <div className="text-destructive font-medium">
              {formatPrice(alert.stop_loss_price)}
            </div>
          </div>
        )}
        <div className="text-center">
          <div className="text-muted-foreground text-xs">Entry</div>
          <div className="text-primary font-medium">
            {formatPrice(alert.entry_price)}
          </div>
        </div>
        {alert.take_profit_price && (
          <div className="text-center">
            <div className="text-muted-foreground text-xs">Take Profit</div>
            <div className="text-green-400 font-medium">
              {formatPrice(alert.take_profit_price)}
            </div>
          </div>
        )}
      </div>

      {/* Current Price and P&L */}
      {alert.current_price && (
        <div className="pt-3 border-t border-border">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-muted-foreground text-sm">Current Price: </span>
              <span className="text-foreground font-medium">{formatPrice(alert.current_price)}</span>
            </div>
            {alert.profit_percentage !== undefined && (
              <div className={`font-bold text-lg ${getProfitColor(alert.profit_percentage)}`}>
                {alert.profit_percentage >= 0 ? '+' : ''}{alert.profit_percentage.toFixed(2)}%
              </div>
            )}
          </div>
          {alert.profit_loss !== undefined && (
            <div className="text-right mt-1">
              <span className={`text-sm ${getProfitColor(alert.profit_loss)}`}>
                {alert.profit_loss >= 0 ? '+' : ''}{formatPrice(Math.abs(alert.profit_loss))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}