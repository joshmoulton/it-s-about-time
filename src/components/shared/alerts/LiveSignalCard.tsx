import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Shield, Clock, DollarSign } from 'lucide-react';

interface LiveSignalCardProps {
  signal: {
    id: string;
    ticker: string;
    direction: string;
    entry_type: string;
    entry_price: number;
    current_price: number;
    stop_loss_price?: number;
    targets: number[];
    size_level?: string;
    reasoning?: string;
    status: string;
    created_at: string;
  };
  compact?: boolean;
}

export function LiveSignalCard({ signal, compact = false }: LiveSignalCardProps) {
  const isLong = signal.direction === 'long';
  const pnl = signal.current_price && signal.entry_price 
    ? isLong 
      ? ((signal.current_price - signal.entry_price) / signal.entry_price) * 100
      : ((signal.entry_price - signal.current_price) / signal.entry_price) * 100
    : 0;

  const getSizeColor = (size?: string) => {
    switch (size) {
      case 'tiny': return 'bg-gray-500';
      case 'low': return 'bg-blue-500';
      case 'med': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'huge': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEntryTypeColor = (type?: string) => {
    switch (type) {
      case 'market': return 'bg-green-500';
      case 'limit': return 'bg-blue-500';
      case 'conditional': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className={`${compact ? 'p-3' : 'p-4'} border-l-4 ${isLong ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <CardContent className="p-0 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-lg">{signal.ticker}</h4>
            <Badge variant={isLong ? 'default' : 'destructive'} className="text-xs">
              {isLong ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {signal.direction.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {signal.size_level && (
              <Badge 
                className={`text-xs text-white ${getSizeColor(signal.size_level)}`}
              >
                {signal.size_level.toUpperCase()}
              </Badge>
            )}
            <Badge 
              className={`text-xs text-white ${getEntryTypeColor(signal.entry_type)}`}
            >
              {signal.entry_type.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Price Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Entry Price
            </div>
            <div className="font-medium">${signal.entry_price?.toFixed(4) || 'N/A'}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              Current Price
            </div>
            <div className="font-medium">${signal.current_price?.toFixed(4) || 'N/A'}</div>
          </div>
        </div>

        {/* P&L */}
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="text-muted-foreground">P&L</div>
            <div className={`font-semibold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
            </div>
          </div>
          {signal.stop_loss_price && (
            <div className="text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Shield className="h-3 w-3" />
                Stop Loss
              </div>
              <div className="font-medium">${signal.stop_loss_price.toFixed(4)}</div>
            </div>
          )}
        </div>

        {/* Targets */}
        {signal.targets && signal.targets.length > 0 && (
          <div className="text-sm">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              Targets
            </div>
            <div className="flex gap-1 flex-wrap">
              {signal.targets.map((target, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  T{index + 1}: ${target.toFixed(4)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning */}
        {signal.reasoning && !compact && (
          <div className="text-sm">
            <div className="text-muted-foreground mb-1">Reasoning</div>
            <div className="text-xs bg-muted p-2 rounded text-muted-foreground">
              {signal.reasoning}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>Status: {signal.status}</div>
          <div>{new Date(signal.created_at).toLocaleDateString()}</div>
        </div>
      </CardContent>
    </Card>
  );
}