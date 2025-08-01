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
      {/* Coming Soon Banner */}
      <Card className="bg-gradient-to-br from-orange-900/20 via-red-900/10 to-slate-800/50 border-orange-500/20">
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none text-lg px-6 py-3">
              Coming Soon
            </Badge>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Degen Call Alerts</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Premium degen call alerts with high-risk, high-reward opportunities are coming soon. 
            Get ready for lightning-fast notifications on potential moonshot plays.
          </p>
          <div className="flex items-center justify-center gap-2 text-orange-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Stay tuned for updates</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}