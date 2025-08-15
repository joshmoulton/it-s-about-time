import React, { useState } from 'react';
import { Activity, Search, Filter, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SharedAlertCard } from '@/components/shared/alerts/SharedAlertCard';
import { useLiveAlerts } from '@/hooks/useLiveAlerts';
import { 
  adaptLiveAlert,
  sortAlerts, 
  filterAlertsByStatus, 
  filterAlertsByPosition 
} from '@/lib/adapters/alertAdapters';

export function FullLiveAlertsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'awaiting'>('all');
  const [positionFilter, setPositionFilter] = useState<'all' | 'long' | 'short'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'profit'>('newest');

  const { data: alerts, isLoading, error, refetch } = useLiveAlerts();

  // Convert LiveAlerts to BaseAlerts for compatibility
  const adaptedAlerts = React.useMemo(() => {
    if (!alerts) return [];
    return alerts.map(adaptLiveAlert);
  }, [alerts]);

  // Filter and sort alerts
  const filteredAlerts = React.useMemo(() => {
    let filtered = adaptedAlerts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(alert => 
        alert.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.trader.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filterAlertsByStatus(filtered, statusFilter);
    }

    // Apply position filter
    if (positionFilter !== 'all') {
      filtered = filterAlertsByPosition(filtered, positionFilter);
    }

    // Sort alerts
    return sortAlerts(filtered, sortBy);
  }, [adaptedAlerts, searchTerm, statusFilter, positionFilter, sortBy]);

  // Separate alerts by status
  const activeAlerts = filterAlertsByStatus(filteredAlerts, 'active');
  const awaitingAlerts = filterAlertsByStatus(filteredAlerts, 'awaiting');

  // Calculate statistics
  const totalProfit = activeAlerts.reduce((sum, alert) => sum + (alert.profit_loss || 0), 0);
  const avgProfitPercentage = activeAlerts.length > 0 
    ? activeAlerts.reduce((sum, alert) => sum + (alert.profit_percentage || 0), 0) / activeAlerts.length 
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Live Trading Alerts
          </h1>
          <p className="text-muted-foreground">
            Real-time trading alerts and position tracking
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{adaptedAlerts.length}</p>
              </div>
              <Activity className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Positions</p>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              {totalProfit >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500 opacity-60" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500 opacity-60" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Performance</p>
                <p className={`text-2xl font-bold ${avgProfitPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {avgProfitPercentage >= 0 ? '+' : ''}{avgProfitPercentage.toFixed(1)}%
                </p>
              </div>
              {avgProfitPercentage >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500 opacity-60" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500 opacity-60" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search symbols or traders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="awaiting">Awaiting Entry</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={positionFilter} onValueChange={(value: any) => setPositionFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Position Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="long">Long Only</SelectItem>
                <SelectItem value="short">Short Only</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="profit">Best Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">Failed to load live trading alerts</p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
                Try Again
              </Button>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={["active", "awaiting"]} className="space-y-4">
              {/* Active Alerts */}
              <AccordionItem value="active" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Active Positions</span>
                    <Badge variant="secondary">{activeAlerts.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {activeAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active positions found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeAlerts.map((alert) => (
                        <SharedAlertCard 
                          key={alert.id} 
                          alert={alert} 
                          showLiveIndicator
                          statusColor="bg-green-500"
                        />
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Awaiting Alerts */}
              <AccordionItem value="awaiting" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Awaiting Entry</span>
                    <Badge variant="secondary">{awaitingAlerts.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {awaitingAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No positions awaiting entry</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {awaitingAlerts.map((alert) => (
                        <SharedAlertCard 
                          key={alert.id} 
                          alert={alert} 
                          showLiveIndicator
                          statusColor="bg-yellow-500"
                        />
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}