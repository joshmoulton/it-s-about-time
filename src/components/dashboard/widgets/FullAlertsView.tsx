import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, AlertTriangle, RefreshCw, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useLiveAlerts } from '@/hooks/useLiveAlerts';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface FullAlertsViewProps {
  subscriber: Subscriber;
}

export function FullAlertsView({ subscriber }: FullAlertsViewProps) {
  const {
    data: liveAlerts,
    isLoading
  } = useLiveAlerts(20, subscriber); // Get more alerts for the full view
  
  const [selectedCaller, setSelectedCaller] = useState<string>('all');
  const [defaultAccordionValue, setDefaultAccordionValue] = useState<string[]>(['active', 'pending']);
  
  // Use the live alerts data - filter by status
  const activeAlerts = liveAlerts?.filter(alert => alert.status === 'active') || [];
  const pendingAlerts = liveAlerts?.filter(alert => alert.status === 'awaiting') || [];
  
  // Debug logging
  console.log('🔍 FullAlertsView Debug:', {
    totalAlerts: liveAlerts?.length || 0,
    activeAlertsCount: activeAlerts.length,
    pendingAlertsCount: pendingAlerts.length,
    isLoading
  });

  const refreshAlerts = () => {
    // The useLiveAlerts hook handles automatic refreshing via real-time subscriptions
    window.location.reload(); // Simple refresh for now
  };

  // Get unique callers for filtering
  const allCallers = [...new Set([...activeAlerts, ...pendingAlerts].map(alert => alert.trader).filter(Boolean))];

  // Filter alerts by caller
  const filteredActiveAlerts = selectedCaller === 'all' 
    ? activeAlerts 
    : activeAlerts.filter(alert => alert.trader === selectedCaller);
    
  const filteredPendingAlerts = selectedCaller === 'all' 
    ? pendingAlerts 
    : pendingAlerts.filter(alert => alert.trader === selectedCaller);

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

    const CompactAlertCard = ({ alert, type }: { alert: any, type: 'active' | 'pending' }) => {
    const currentPrice = alert.current_price || alert.entry_price;
    const entryPrice = typeof alert.entry_price === 'number' ? alert.entry_price : 0;
    const stopLoss = alert.stop_loss_price || 0;
    const target = alert.take_profit_price || (alert.targets && alert.targets[0]) || 0;
    
    // Calculate gain/loss for active positions
    const isLong = alert.position_type?.toLowerCase() === 'long';
    let gainLossPercentage = 0;
    let progressPercentage = 0;
    
    if (type === 'active' && currentPrice && entryPrice) {
      if (isLong) {
        gainLossPercentage = ((currentPrice - entryPrice) / entryPrice) * 100;
        // Calculate progress from entry to target
        if (target > entryPrice) {
          const totalDistance = target - entryPrice;
          const currentDistance = currentPrice - entryPrice;
          progressPercentage = Math.max(0, Math.min(100, (currentDistance / totalDistance) * 100));
        }
      } else {
        gainLossPercentage = ((entryPrice - currentPrice) / entryPrice) * 100;
        // Calculate progress from entry to target (for short positions)
        if (target < entryPrice) {
          const totalDistance = entryPrice - target;
          const currentDistance = entryPrice - currentPrice;
          progressPercentage = Math.max(0, Math.min(100, (currentDistance / totalDistance) * 100));
        }
      }
    }

    const getCoinGradient = (coin: string) => {
      switch (coin?.toUpperCase()) {
        case 'PEPE': return 'bg-gradient-to-br from-green-500 to-green-600';
        case 'SUI': return 'bg-gradient-to-br from-blue-500 to-blue-600';
        case 'SOL': return 'bg-gradient-to-br from-purple-500 to-purple-600';
        case 'FARTCOIN': return 'bg-gradient-to-br from-purple-500 to-purple-600';
        case 'LINK': return 'bg-gradient-to-br from-blue-500 to-blue-600';
        default: return 'bg-gradient-to-br from-slate-500 to-slate-600';
      }
    };

    return (
      <div 
        className="bg-gradient-to-br from-card/90 to-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 
                   hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-400/10 
                   transition-all duration-300 animate-fade-in group relative overflow-hidden"
      >
        {/* Subtle glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-xl opacity-0 
                        group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="relative">
          {/* Header with coin and badges */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${getCoinGradient(alert.symbol)} rounded-full flex items-center justify-center 
                              text-white font-bold text-sm shadow-md`}>
                {alert.symbol?.charAt(0) || 'C'}
              </div>
              <div>
                <div className="font-semibold text-foreground">{alert.symbol}</div>
                <div className="text-xs text-muted-foreground">{alert.trader}</div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <Badge 
                className={`px-2 py-1 text-xs shadow-sm ${
                  isLong 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500/20' 
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500/20'
                }`}
              >
                {alert.position_type}
              </Badge>
              
              {type === 'active' && gainLossPercentage !== 0 && (
                <Badge 
                  className={`px-2 py-1 text-xs shadow-sm ${
                    gainLossPercentage >= 0 
                      ? 'bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 text-white border-emerald-500/20' 
                      : 'bg-gradient-to-r from-red-500/90 to-red-600/90 text-white border-red-500/20'
                  }`}
                >
                  {gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%
                </Badge>
              )}
            </div>
          </div>

          {/* Progress bar for active alerts */}
          {type === 'active' && progressPercentage > 0 && (
            <div className="mb-3">
              <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                <span>Progress to Target</span>
                <span>{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Current Price */}
          <div className="mb-4">
            <div className="text-xl font-bold text-foreground">
              {formatPrice(currentPrice)}
            </div>
          </div>

          {/* Price levels */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-red-400 font-medium mb-1">SL</div>
              <div className="text-foreground font-bold">{stopLoss ? formatPrice(stopLoss) : 'N/A'}</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-medium mb-1">Entry</div>
              <div className="text-foreground font-bold">{formatPrice(entryPrice)}</div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 font-medium mb-1">TP</div>
              <div className="text-foreground font-bold">{target ? formatPrice(target) : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Live Trading Alerts</h1>
            <p className="text-muted-foreground">Real-time trading positions and pending entries</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Filter Controls */}
          {allCallers.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
               <Select value={selectedCaller} onValueChange={setSelectedCaller}>
                 <SelectTrigger className="w-48 bg-card border-border text-foreground">
                   <SelectValue placeholder="Filter by caller" />
                 </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Callers ({activeAlerts.length + pendingAlerts.length})</SelectItem>
                  {allCallers.map((caller) => (
                    <SelectItem key={caller} value={caller}>
                      {caller} ({[...activeAlerts, ...pendingAlerts].filter(alert => alert.trader === caller).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Status and Refresh */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshAlerts} 
              disabled={isLoading}
              className="flex items-center gap-2 bg-card border-border text-foreground hover:bg-muted/50 hover:text-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading alerts...</p>
        </div>
      ) : (
        <Accordion 
          type="multiple" 
          value={defaultAccordionValue} 
          onValueChange={setDefaultAccordionValue}
          className="space-y-4"
        >
          {/* Active Positions Section */}
          <AccordionItem value="active" className="border border-border rounded-lg">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 rounded-t-lg text-foreground">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span className="text-lg font-semibold text-foreground">Active Positions</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {filteredActiveAlerts.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {filteredActiveAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {selectedCaller === 'all' ? 'No active positions' : `No active positions from ${selectedCaller}`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {filteredActiveAlerts.map((alert) => (
                     <CompactAlertCard key={alert.id} alert={alert} type="active" />
                   ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Pending Alerts Section */}
          <AccordionItem value="pending" className="border border-border rounded-lg">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 rounded-t-lg text-foreground">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-semibold text-foreground">Awaiting Confirmation</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                  {filteredPendingAlerts.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {filteredPendingAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {selectedCaller === 'all' ? 'No pending alerts' : `No pending alerts from ${selectedCaller}`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {filteredPendingAlerts.map((alert) => (
                     <CompactAlertCard key={alert.id} alert={alert} type="pending" />
                   ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      </div>
    </div>
  );
}