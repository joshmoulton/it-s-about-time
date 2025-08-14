import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, AlertTriangle, RefreshCw, Filter, ExternalLink, Clock } from 'lucide-react';
import { useLiveAlerts } from '@/hooks/useLiveAlerts';
import { FreemiumWidgetWrapper } from '@/components/freemium/FreemiumWidgetWrapper';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface ModernAlertsWidgetProps {
  subscriber: Subscriber;
  hideHeader?: boolean;
  summaryMode?: boolean;
}

export function ModernAlertsWidget({
  subscriber,
  hideHeader = false,
  summaryMode = false
}: ModernAlertsWidgetProps) {
  const navigate = useNavigate();
  const {
    data: liveAlerts,
    isLoading
  } = useLiveAlerts(5, subscriber); // Get 5 alerts for the widget
  
  const [selectedCaller, setSelectedCaller] = useState<string>('all');
  const activeAlerts = liveAlerts?.filter(alert => alert.status === 'active') || [];
  const pendingAlerts = liveAlerts?.filter(alert => alert.status === 'awaiting') || [];
  
  const refreshAlerts = () => {
    // The useLiveAlerts hook handles automatic refreshing via real-time subscriptions
    window.location.reload(); // Simple refresh for now
  };

  // Get unique callers for filtering
  const allCallers = [...new Set([...activeAlerts, ...pendingAlerts].map(alert => alert.trader).filter(Boolean))];

  // Filter alerts by caller and apply summary mode limits
  let filteredActiveAlerts = selectedCaller === 'all' ? activeAlerts : activeAlerts.filter(alert => alert.trader === selectedCaller);
  let filteredPendingAlerts = selectedCaller === 'all' ? pendingAlerts : pendingAlerts.filter(alert => alert.trader === selectedCaller);

  // Apply summary mode limits (2 items each)
  if (summaryMode) {
    filteredActiveAlerts = filteredActiveAlerts.slice(0, 2);
    filteredPendingAlerts = filteredPendingAlerts.slice(0, 2);
  }

  const formatPrice = (price: number): string => {
    if (price < 0.000001) {
      // For extremely small prices, use scientific notation
      return price.toExponential(2);
    } else if (price < 0.01) {
      // For very small prices, limit to 6 significant digits max
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      }).format(price);
      return formatted;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const CompactAlertCard = ({
    alert,
    type
  }: {
    alert: any;
    type: 'active' | 'pending';
  }) => {
    // Calculate current progress and P&L (mock data for now)
    const currentPrice = alert.current_price || alert.entry_price; // Would be real current price from API
    const entryPrice = typeof alert.entry_price === 'number' ? alert.entry_price : 0;
    const stopLoss = alert.stop_loss_price || 0;
    const target = alert.take_profit_price || (alert.targets && alert.targets[0]) || 0;

    // Calculate percentage from entry
    const percentageFromEntry = currentPrice && entryPrice ? (currentPrice - entryPrice) / entryPrice * 100 : 0;

    // Calculate progress bar position (0-100%)
    const totalRange = Math.abs(target - stopLoss);
    const currentRange = Math.abs(currentPrice - stopLoss);
    const progressPercentage = totalRange > 0 ? currentRange / totalRange * 100 : 50;
    const isProfit = percentageFromEntry > 0;
    return <div 
      className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-3 transition-all duration-200 hover:border-slate-600/70 h-[160px] sm:h-[170px] hover:bg-slate-800/60" 
    >
        {/* Header with badges in top right */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${alert.symbol === 'PEPE' ? 'bg-green-600' : alert.symbol === 'SUI' ? 'bg-blue-600' : alert.symbol === 'FARTCOIN' ? 'bg-purple-600' : alert.symbol === 'LINK' ? 'bg-blue-500' : alert.symbol === 'SOL' ? 'bg-purple-500' : 'bg-slate-600'}`}>
              {alert.symbol?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="font-bold text-sm text-white">{alert.symbol}</div>
              <div className="text-xs text-slate-400">{alert.trader}</div>
            </div>
          </div>
          
          {/* Badges moved to top right */}
          <div className="flex flex-col items-end space-y-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${alert.position_type === 'long' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
              {alert.position_type}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${type === 'active' ? 'bg-blue-900/50 text-blue-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
              {type === 'active' ? 'Active' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Current Price */}
        <div className="mb-4">
          <div className="text-xl font-bold text-white">
            {formatPrice(currentPrice)}
          </div>
        </div>

        {/* Price levels */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs">
          <div>
            <div className="text-red-400 font-medium mb-1">SL</div>
            <div className="text-white font-bold text-[10px] sm:text-xs leading-tight">{stopLoss ? formatPrice(stopLoss) : 'N/A'}</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 font-medium mb-1">Entry</div>
            <div className="text-white font-bold text-[10px] sm:text-xs leading-tight">{formatPrice(entryPrice)}</div>
          </div>
          <div className="text-right">
            <div className="text-emerald-400 font-medium mb-1">TP</div>
            <div className="text-white font-bold text-[10px] sm:text-xs leading-tight">{target ? formatPrice(target) : 'N/A'}</div>
          </div>
        </div>
      </div>;
  };

  const AlertRow = ({
    alert,
    type
  }: {
    alert: any;
    type: 'active' | 'pending';
  }) => {
    // Calculate current progress and P&L (mock data for now)
    const currentPrice = alert.entryPrice; // Would be real current price from API
    const entryPrice = alert.entryPrice || 0;
    const stopLoss = alert.stopLoss || 0;
    const target = alert.target || 0;

    // Calculate percentage from entry
    const percentageFromEntry = currentPrice && entryPrice ? (currentPrice - entryPrice) / entryPrice * 100 : 0;
    const isProfit = percentageFromEntry > 0;
    return <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700/30 rounded-lg hover:bg-slate-800/60 transition-all duration-200">
        <div className="flex items-center space-x-4 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${alert.symbol === 'PEPE' ? 'bg-green-600' : alert.symbol === 'SUI' ? 'bg-blue-600' : alert.symbol === 'FARTCOIN' ? 'bg-purple-600' : alert.symbol === 'LINK' ? 'bg-blue-500' : alert.symbol === 'SOL' ? 'bg-purple-500' : 'bg-slate-600'}`}>
            {alert.symbol?.charAt(0) || 'C'}
          </div>
          <div className="flex-1">
            <div className="font-bold text-base text-white">{alert.symbol}</div>
            <div className="text-sm text-slate-400 flex items-center space-x-2">
              <span>{alert.trader}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${alert.position_type === 'long' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                {alert.position_type}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs ${type === 'active' ? 'bg-blue-900/50 text-blue-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                {type === 'active' ? 'Active' : 'Pending'}
              </span>
            </div>
          </div>
          
          {/* Current Price */}
          <div className="text-right">
            <div className="text-xl font-bold text-white">
              {formatPrice(currentPrice)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 min-w-[240px]">
          <div className="text-center">
            <div className="text-red-400 text-xs font-medium mb-1">SL</div>
            <div className="text-white text-sm font-bold">{formatPrice(stopLoss)}</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 text-xs font-medium mb-1">Entry</div>
            <div className="text-white text-sm font-bold">{formatPrice(entryPrice)}</div>
          </div>
          <div className="text-center">
            <div className="text-emerald-400 text-xs font-medium mb-1">TP</div>
            <div className="text-white text-sm font-bold">{formatPrice(target)}</div>
          </div>
        </div>
      </div>;
  };

  const AlertsContent = () => (
    <ModernCard className="h-full min-h-[300px] flex flex-col bg-gradient-to-br from-green-900/20 via-emerald-900/10 to-slate-800/50 border-green-500/20 hover:border-green-400/30 transition-all duration-200" interactive data-tour="alerts-widget">
      {!hideHeader && (
        <ModernCardHeader className="pb-2 pt-3 flex-shrink-0 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <ModernCardTitle className="text-sm text-white">Live Alerts</ModernCardTitle>
            </div>
          </div>
        </ModernCardHeader>
      )}
      
      <ModernCardContent className={`flex-1 flex flex-col ${hideHeader ? 'pt-0' : 'pt-0'} px-4 pb-4`}>
        {/* Coming Soon Overlay */}
        <div className="flex-1 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 via-emerald-800/20 to-transparent rounded-lg flex items-center justify-center backdrop-blur-sm">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Coming Soon</h3>
              <p className="text-green-200/80 max-w-sm">
                Enhanced live alerts with advanced filtering and real-time updates are coming soon.
              </p>
            </div>
          </div>
        </div>

        {/* 
        COMMENTED OUT - Original alerts content for future use
        */}
      </ModernCardContent>
    </ModernCard>
  );

  return (
    <FreemiumWidgetWrapper
      featureName="live trading alerts"
      showTeaserStats={true}
      teaserStats={{
        activeAlerts: 11,
        activeTrades: 5,
        awaitingEntry: 6
      }}
    >
      <AlertsContent />
    </FreemiumWidgetWrapper>
  );
}
