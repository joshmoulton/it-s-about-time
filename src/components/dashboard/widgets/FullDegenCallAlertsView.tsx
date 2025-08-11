import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, TrendingUp, Clock, Settings2, RefreshCw, Globe } from 'lucide-react';
import { useDegenCallSubscription } from '@/hooks/useDegenCallSubscription';
import { useAnalystSubscriptions } from '@/hooks/useAnalystSubscriptions';
import { DegenCallSettingsModal } from './DegenCallSettingsModal';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useDegenCallAlerts } from '@/hooks/useDegenCallAlerts';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface FullDegenCallAlertsViewProps {
  subscriber: Subscriber;
}

export function FullDegenCallAlertsView({ subscriber }: FullDegenCallAlertsViewProps) {
  const {
    subscription,
    recentNotifications,
    isSubscribed,
    notificationsLoading
  } = useDegenCallSubscription();

  const {
    analystsWithSubscriptionStatus,
    analystsLoading,
    subscriptionsLoading
  } = useAnalystSubscriptions();

  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);

  // Force refresh subscription data when component mounts
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['degen-call-subscription'] });
    queryClient.invalidateQueries({ queryKey: ['analyst-subscriptions'] });
  }, [queryClient]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-500';
      case 'partial_failure':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const refreshData = () => {
    // Invalidate all subscription-related queries for a complete refresh
    queryClient.invalidateQueries({ queryKey: ['degen-call-subscription'] });
    queryClient.invalidateQueries({ queryKey: ['analyst-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['recent-degen-notifications'] });
  };

  const subscribedAnalysts = analystsWithSubscriptionStatus.filter(a => a.isSubscribed);
  const totalSubscriptions = (isSubscribed ? 1 : 0) + subscribedAnalysts.length;

  // Debug logging to help troubleshoot subscription status
  console.log('🔍 Subscription Debug:', {
    isSubscribed,
    subscribedAnalysts: subscribedAnalysts.map(a => ({ name: a.info.display_name, isSubscribed: a.isSubscribed })),
    totalSubscriptions,
    analystsLoading: analystsLoading,
    subscriptionsLoading: subscriptionsLoading
  });

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-orange-900/20 via-red-900/10 to-slate-800/50 border-orange-500/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Recent Degen Calls</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={refreshData}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
              <Settings2 className="w-4 h-4 mr-1" /> Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DegenCallsList />
        </CardContent>
      </Card>

      <DegenCallSettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}

function DegenCallsList() {
  const { data: calls = [], isLoading } = useDegenCallAlerts(10);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-orange-200/80">Loading degen calls...</div>
    );
  }

  if (!calls.length) {
    console.debug('FullDegenCallAlertsView: no calls to show');
    return (
      <div className="py-8 text-center text-orange-200/80">No recent degen calls</div>
    );
  }

  return (
    <div className="space-y-3">
      {calls.map(call => (
        <div key={call.id} className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-4 hover:border-orange-400/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{call.coin}</span>
                  {call.direction && (
                    <Badge variant="outline" className="text-xs border-orange-400/30 text-orange-200">
                      {call.direction.toUpperCase()}
                    </Badge>
                  )}
                  {call.status && (
                    <Badge className="text-xs bg-orange-500/20 text-orange-200 border-orange-500/30">
                      {call.status}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-orange-200/80">
                  Entry {call.entry_price} • {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}