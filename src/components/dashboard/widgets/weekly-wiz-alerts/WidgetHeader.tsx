
import React from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, RefreshCw, Clock } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';

interface WidgetHeaderProps {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastUpdate: Date | null;
  onReconnect: () => void;
}

export function WidgetHeader({ isConnected, isConnecting, error, lastUpdate, onReconnect }: WidgetHeaderProps) {
  const statusIndicator = StatusIndicator({ isConnected, isConnecting, error });

  return (
    <div className="text-lg font-bold flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl text-white shadow-lg">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            Weekly Wiz Live Alerts
            <div className="flex items-center gap-1 text-xs">
              {statusIndicator.icon}
              <span className={`text-xs ${statusIndicator.color}`}>
                {statusIndicator.text}
              </span>
            </div>
          </div>
          {lastUpdate && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Clock className="h-3 w-3" />
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onReconnect}
          disabled={isConnecting}
          className="h-8 px-2 flex-shrink-0"
        >
          <RefreshCw className={`h-3 w-3 ${isConnecting ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
