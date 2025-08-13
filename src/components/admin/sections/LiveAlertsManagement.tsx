import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  TrendingUp,
  Zap,
  Plus,
  Activity,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SignalData {
  id: string;
  ticker: string;
  analyst_name: string;
  entry_price?: number;
  stop_loss_price?: number;
  targets?: any;
  trade_direction: string;
  status: string;
  created_at: string;
  risk_percentage?: number;
  full_description?: string;
  market: string;
}

interface DegenCallNotification {
  id: string;
  analyst_signal_id: string;
  message_content: string;
  status: string;
  recipient_count: number;
  sent_at: string;
  created_at: string;
  error_message?: string;
  telegram_message_id?: number;
}

export function LiveAlertsManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch active trading signals
  const { data: signals, isLoading: signalsLoading } = useQuery({
    queryKey: ['live-trading-signals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyst_signals')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching signals:', error);
        throw error;
      }
      
      return data as SignalData[];
    },
  });

  // Fetch degen call notifications
  const { data: degenCalls, isLoading: degenLoading } = useQuery({
    queryKey: ['degen-call-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('degen_call_notifications')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching degen calls:', error);
        throw error;
      }
      
      return data as DegenCallNotification[];
    },
  });

  const filteredSignals = signals?.filter(signal => 
    signal.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    signal.analyst_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full w-full bg-background flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">Live Alerts Dashboard</h1>
                <p className="text-muted-foreground">Manage active trading signals and degen call alerts</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link to="/admin/trading-signals">
                <Plus className="h-4 w-4 mr-2" />
                Create New Signal
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <Tabs defaultValue="live-alerts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="live-alerts" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Live Trading Alerts
              </TabsTrigger>
              <TabsTrigger value="degen-calls" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Degen Call Alerts
              </TabsTrigger>
            </TabsList>

            {/* Live Trading Alerts Tab */}
            <TabsContent value="live-alerts" className="space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="p-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by ticker or analyst..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Active Signals List */}
              <div className="space-y-4">
                {signalsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading active signals...</div>
                  </div>
                ) : (
                  <>
                    {filteredSignals?.map((signal) => (
                      <Card key={signal.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-xl font-semibold text-foreground">
                                  {signal.ticker}
                                </h3>
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                  <Activity className="h-3 w-3 mr-1" />
                                  LIVE
                                </Badge>
                                <Badge variant="outline">
                                  {signal.trade_direction.toUpperCase()}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <p className="text-muted-foreground text-sm font-medium">Analyst</p>
                                  <p className="text-foreground font-semibold">{signal.analyst_name}</p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <p className="text-muted-foreground text-sm font-medium">Entry Price</p>
                                  <p className="text-foreground font-semibold">
                                    {signal.entry_price ? `$${signal.entry_price}` : 'Market'}
                                  </p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <p className="text-muted-foreground text-sm font-medium">Targets</p>
                                  <p className="text-foreground font-semibold">
                                    {Array.isArray(signal.targets) ? signal.targets.join(', ') : signal.targets || 'N/A'}
                                  </p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <p className="text-muted-foreground text-sm font-medium">Stop Loss</p>
                                  <p className="text-foreground font-semibold">
                                    {signal.stop_loss_price ? `$${signal.stop_loss_price}` : 'N/A'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Risk: {signal.risk_percentage || 2}%
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {signal.market || 'Crypto'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Active since: {new Date(signal.created_at).toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Empty State */}
                    {!signalsLoading && (!filteredSignals || filteredSignals.length === 0) && (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">No active signals</h3>
                          <p className="text-muted-foreground mb-6">
                            {searchTerm 
                              ? 'Try adjusting your search to find signals.' 
                              : 'Get started by creating your first trading signal.'}
                          </p>
                          <Button asChild>
                            <Link to="/admin/trading-signals">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Signal
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Degen Call Alerts Tab */}
            <TabsContent value="degen-calls" className="space-y-6">
              <div className="space-y-4">
                {degenLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading degen call alerts...</div>
                  </div>
                ) : (
                  <>
                    {degenCalls?.map((call) => (
                      <Card key={call.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-lg font-semibold text-foreground">
                                  Degen Call Alert
                                </h3>
                                <Badge variant="outline">
                                  {call.recipient_count} recipients
                                </Badge>
                              </div>

                              <div className="bg-muted/30 rounded-lg p-4 mb-4">
                                <p className="text-foreground text-sm whitespace-pre-wrap line-clamp-4">
                                  {call.message_content}
                                </p>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Sent: {new Date(call.sent_at).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Empty State for Degen Calls */}
                    {!degenLoading && (!degenCalls || degenCalls.length === 0) && (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">No degen call alerts</h3>
                          <p className="text-muted-foreground mb-6">
                            Degen call alerts will appear here when they are sent to subscribers.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}