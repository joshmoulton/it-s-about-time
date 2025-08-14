import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, TrendingUp, Clock, Settings2, RefreshCw, Globe, Zap, DollarSign } from 'lucide-react';
import { useDegenCallSubscription } from '@/hooks/useDegenCallSubscription';
import { useAnalystSubscriptions } from '@/hooks/useAnalystSubscriptions';
import { DegenCallSettingsModal } from './DegenCallSettingsModal';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useDegenCallAlerts } from '@/hooks/useDegenCallAlerts';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

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
    <div className="space-y-4 sm:space-y-6 h-full">
      {/* Mobile-optimized header with refresh button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        {/* Remove testing badge for production */}
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={refreshData} 
          className="text-orange-300 hover:text-white hover:bg-orange-800/30 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <DegenCallsList />
      </div>

      <DegenCallSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

function DegenCallsList() {
  const { data: calls = [], isLoading } = useDegenCallAlerts(10);
  
  // Remove real-time crypto price fetching - we only show call-time prices
  // const tickers = calls?.map(call => call.coin) || [];
  // const { data: cryptoPrices } = useCryptoPrices(tickers);

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

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const callTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - callTime.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const formatSizeLevel = (size?: string): string => {
    if (!size) return 'N/A';
    const sizeStr = size.toLowerCase();
    if (sizeStr === 'tiny') return 'Tiny';
    if (sizeStr === 'low') return 'Low';
    if (sizeStr === 'med') return 'Med';
    if (sizeStr === 'high') return 'High';
    if (sizeStr === 'huge') return 'Huge';
    return size; // Return original if not recognized
  };

  // Remove real-time price functions since we only show call-time price
  // const formatPrice = (price: number) => { ... };
  // const getPriceForTicker = (ticker: string) => { ... };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-4">
      {calls.map(call => (
        <div key={call.id} className="bg-orange-900/25 border border-orange-500/30 rounded-lg p-3 sm:p-4 hover:border-orange-400/40 hover:bg-orange-900/35 transition-all duration-200 shadow-sm space-y-2 sm:space-y-3">
          {/* Header with ticker, direction, and timestamp */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-md flex items-center justify-center">
                <Zap className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white text-sm sm:text-base font-bold">{call.coin}</span>
                {call.direction && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1.5 py-0.5 border ${
                      call.direction.toLowerCase() === 'long' 
                        ? 'border-green-400/50 text-green-200 bg-green-500/10' 
                        : 'border-red-400/50 text-red-200 bg-red-500/10'
                    }`}
                  >
                    {call.direction.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-orange-200/80">
                <Clock className="w-3 h-3 sm:w-2.5 sm:h-2.5" />
                <span className="hidden sm:inline">{formatTimeAgo(call.created_at)}</span>
                <span className="sm:hidden">{formatTimeAgo(call.created_at).replace(' ago', '')}</span>
              </div>
            </div>
          </div>

          {/* Caller name */}
          {call.analyst_name && (
            <div className="flex items-center gap-1.5 pb-2 border-b border-orange-500/20">
              <span className="text-xs text-orange-300">Called by:</span>
              <span className="text-xs sm:text-sm text-white font-medium">{call.analyst_name}</span>
            </div>
          )}

          {/* Call-time Price Section */}
          <div className="bg-black/20 rounded-md p-2 sm:p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-blue-400" />
                <span className="text-xs sm:text-sm text-orange-200/80">Call Price:</span>
              </div>
              <span className="text-white font-semibold text-sm sm:text-base">
                {call.entry_price && call.entry_price !== 'Market' 
                  ? `$${Number(call.entry_price).toLocaleString()}`
                  : 'Market'
                }
              </span>
            </div>
          </div>

          {/* Trading details */}
          <div className="space-y-1.5 sm:space-y-2">
            {/* Entry */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-orange-200/80">Entry:</span>
              </div>
              <span className="text-white font-medium text-xs sm:text-sm">
                {call.entry_price && call.entry_price !== 'Market' ? `$${Number(call.entry_price).toLocaleString()}` : 'Market'}
              </span>
            </div>

            {/* Stop Loss */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-orange-200/80">Stop Loss:</span>
              </div>
              <span className="text-white font-medium text-xs sm:text-sm">
                {call.stop_loss ? `$${Number(call.stop_loss).toLocaleString()}` : 'N/A'}
              </span>
            </div>

            {/* Target */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-2.5 h-2.5 text-green-400" />
                <span className="text-xs sm:text-sm text-orange-200/80">Target:</span>
              </div>
              <span className="text-white font-medium text-xs sm:text-sm">
                {call.targets && call.targets.length > 0 ? `$${Number(call.targets[0]).toLocaleString()}` : 'N/A'}
              </span>
            </div>

            {/* Size */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-orange-200/80">Size:</span>
              </div>
              <span className="text-white font-medium text-xs sm:text-sm">
                {formatSizeLevel(call.size)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}