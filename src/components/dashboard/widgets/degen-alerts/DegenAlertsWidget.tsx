import React from 'react';
import { Zap, TrendingUp, AlertTriangle, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SharedAlertCard } from '@/components/shared/alerts/SharedAlertCard';
import { useDegenCallAlerts } from '@/hooks/useDegenCallAlerts';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { adaptDegenCallAlert, sortAlerts, filterAlertsByStatus } from '@/lib/adapters/alertAdapters';

export function DegenAlertsWidget() {
  const { currentUser, subscriber } = useEnhancedAuth();
  const userTier = subscriber?.subscription_tier || 'free';
  const { data: alerts, isLoading, error } = useDegenCallAlerts(10, subscriber);

  // Convert to BaseAlert format
  const adaptedAlerts = React.useMemo(() => {
    if (!alerts) return [];
    return alerts.map(adaptDegenCallAlert);
  }, [alerts]);

  // Filter alerts by status
  const activeAlerts = filterAlertsByStatus(adaptedAlerts, 'active');

  const hasAccess = userTier === 'paid' || userTier === 'premium';

  if (!hasAccess) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Degen Call Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Lock className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Premium Feature</p>
            <p className="text-xs text-muted-foreground mt-1">Upgrade to access degen call alerts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Degen Call Alerts
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
            <Zap className="h-5 w-5 text-primary" />
            Degen Call Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load degen calls</p>
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
            <Zap className="h-5 w-5 text-primary" />
            Degen Call Alerts
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {adaptedAlerts.length} Active
            </Badge>
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {userTier?.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Degen Calls */}
        {activeAlerts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <h4 className="font-medium text-sm">Active Degen Calls ({activeAlerts.length})</h4>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sortAlerts(activeAlerts).slice(0, 4).map((alert) => (
                <SharedAlertCard 
                  key={alert.id} 
                  alert={alert} 
                  compact 
                  showLiveIndicator
                  statusColor="bg-purple-500"
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {adaptedAlerts.length === 0 && (
          <div className="text-center py-8">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">No active degen calls</p>
            <p className="text-xs text-muted-foreground mt-1">New calls from analysts will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}