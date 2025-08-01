
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCard } from './AlertCard';

interface Alert {
  id: string;
  symbol: string;
  trader: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  position_type: 'long' | 'short';
  status?: 'active' | 'awaiting';
}

interface AlertsSectionContainerProps {
  title: string;
  alerts: Alert[];
  icon: React.ReactNode;
  statusColor: string;
  emptyMessage: string;
}

export function AlertsSectionContainer({
  title,
  alerts,
  icon,
  statusColor,
  emptyMessage
}: AlertsSectionContainerProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-sm text-white">{title}</h3>
        </div>
        <Badge className={`${statusColor} text-white text-xs`}>
          {alerts.length}
        </Badge>
      </div>
      
      <div className="flex-1 space-y-2 min-h-0">
        {alerts.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">
            {emptyMessage}
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} compact />
          ))
        )}
      </div>
    </div>
  );
}
