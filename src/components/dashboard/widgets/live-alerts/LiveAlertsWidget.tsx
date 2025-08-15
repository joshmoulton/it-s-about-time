import React from 'react';
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SharedAlertCard } from '@/components/shared/alerts/SharedAlertCard';
import { useRealTradingAlerts } from '@/hooks/useRealTradingAlerts';
import { adaptLiveTradingAlert, sortAlerts, filterAlertsByStatus } from '@/lib/adapters/alertAdapters';

export function LiveAlertsWidget() {
  const { data: alerts, isLoading, error } = useRealTradingAlerts();

  // Convert to BaseAlert format
  const adaptedAlerts = React.useMemo(() => {
    if (!alerts) return [];
    return alerts.map(adaptLiveTradingAlert);
  }, [alerts]);

  // Separate active and awaiting alerts
  const activeAlerts = filterAlertsByStatus(adaptedAlerts, 'active');
  const awaitingAlerts = filterAlertsByStatus(adaptedAlerts, 'awaiting');

  const totalProfit = activeAlerts.reduce((sum, alert) => sum + (alert.profit_loss || 0), 0);
  const totalProfitPercentage = activeAlerts.length > 0 
    ? activeAlerts.reduce((sum, alert) => sum + (alert.profit_percentage || 0), 0) / activeAlerts.length 
    : 0;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Trading Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Trading Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load alerts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Trading Alerts
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {adaptedAlerts.length} Total
            </Badge>
            {totalProfitPercentage !== 0 && (
              <Badge 
                variant={totalProfitPercentage >= 0 ? 'default' : 'destructive'} 
                className="text-xs flex items-center gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                {totalProfitPercentage >= 0 ? '+' : ''}{totalProfitPercentage.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Alerts Section */}
        {activeAlerts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h4 className="font-medium text-sm">Active Positions ({activeAlerts.length})</h4>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sortAlerts(activeAlerts).slice(0, 3).map((alert) => (
                <SharedAlertCard 
                  key={alert.id} 
                  alert={alert} 
                  compact 
                  showLiveIndicator
                  statusColor="bg-green-500"
                />
              ))}
            </div>
          </div>
        )}

        {/* Awaiting Alerts Section */}
        {awaitingAlerts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <h4 className="font-medium text-sm">Awaiting Entry ({awaitingAlerts.length})</h4>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {sortAlerts(awaitingAlerts).slice(0, 2).map((alert) => (
                <SharedAlertCard 
                  key={alert.id} 
                  alert={alert} 
                  compact 
                  showLiveIndicator
                  statusColor="bg-yellow-500"
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {adaptedAlerts.length === 0 && (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">No live trading alerts at the moment</p>
            <p className="text-xs text-muted-foreground mt-1">New alerts will appear here automatically</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}