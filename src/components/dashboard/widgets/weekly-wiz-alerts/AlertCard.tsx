
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface Alert {
  id: string;
  symbol: string;
  trader: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  position_type: 'long' | 'short';
}

interface AlertCardProps {
  alert: Alert;
  compact?: boolean;
}

export function AlertCard({ alert, compact = false }: AlertCardProps) {
  if (compact) {
    return (
      <div className="p-3 rounded-lg border bg-slate-800/90 border-slate-600/30 transition-all duration-300 hover:border-slate-500/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{alert.symbol}</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 border-slate-600">
              {alert.position_type.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">{alert.trader}</span>
          </div>
        </div>
        
        {/* Price Information */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-red-400 font-medium text-xs">SL</div>
            <div className="text-red-400 font-bold">${alert.stop_loss_price.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-cyan-400 font-medium text-xs">Entry</div>
            <div className="text-cyan-400 font-bold">${alert.entry_price.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-medium text-xs">TP</div>
            <div className="text-green-400 font-bold">${alert.take_profit_price.toFixed(2)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg p-4 border-2 bg-slate-800/90 border-slate-600/30 transition-all duration-300 hover:border-slate-500/50">
      {/* Header with Symbol and Trader */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-lg font-bold text-cyan-400 mb-1">{alert.symbol}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{alert.trader}</span>
            <div className="flex gap-1">
              <span className={`px-2 py-0.5 text-white text-xs rounded ${
                alert.position_type === 'long' ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {alert.position_type.toUpperCase()}
              </span>
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400">Trading</span>
        </div>
      </div>
      
      {/* Price Details */}
      <div className="flex justify-between items-center text-sm">
        <div className="text-center">
          <div className="text-gray-400 text-xs">SL</div>
          <div className="text-red-400 font-medium">
            ${alert.stop_loss_price.toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-400 text-xs">Entry</div>
          <div className="text-cyan-400 font-medium">
            ${alert.entry_price.toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-400 text-xs">TP</div>
          <div className="text-green-400 font-medium">
            ${alert.take_profit_price.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
