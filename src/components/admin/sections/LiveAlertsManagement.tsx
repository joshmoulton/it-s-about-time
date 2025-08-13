import React, { useState } from 'react';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  MoreVertical, 
  Copy, 
  Edit, 
  Archive, 
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Target,
  Activity,
  BarChart3,
  Plus,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Settings
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  analyst_photo_url?: string;
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
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [analystFilter, setAnalystFilter] = useState('all');

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

  // Update signal status mutation
  const updateSignalStatusMutation = useMutation({
    mutationFn: async ({ signalId, status }: { signalId: string; status: string }) => {
      const { error } = await supabase
        .from('analyst_signals')
        .update({ status })
        .eq('id', signalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-trading-signals'] });
      toast.success('Signal updated successfully');
    },
    onError: (error) => {
      console.error('Error updating signal:', error);
      toast.error('Failed to update signal');
    },
  });

  const filteredSignals = signals?.filter(signal => {
    const matchesSearch = signal.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signal.analyst_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || signal.status === statusFilter;
    const matchesAnalyst = analystFilter === 'all' || signal.analyst_name === analystFilter;
    
    return matchesSearch && matchesStatus && matchesAnalyst;
  });

  const handleCopySignal = (signal: SignalData) => {
    const targets = Array.isArray(signal.targets) 
      ? signal.targets.join(', ') 
      : signal.targets || 'N/A';
      
    const signalText = `🚨 LIVE ALERT 🚨

💎 ${signal.ticker} ${signal.trade_direction.toUpperCase()}

🎯 Entry: ${signal.entry_price ? `$${signal.entry_price}` : 'Market'}
${signal.targets ? `🚀 Targets: ${targets}` : ''}
${signal.stop_loss_price ? `❌ Stop Loss: $${signal.stop_loss_price}` : ''}

📋 Analyst: ${signal.analyst_name}

⚠️ Trade at your own risk - Not financial advice!`;
    
    navigator.clipboard.writeText(signalText);
    toast.success('Signal copied to clipboard');
  };

  const handleUpdateStatus = (signalId: string, status: string) => {
    updateSignalStatusMutation.mutate({ signalId, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'closed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'stopped':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getDegenStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="h-full w-full bg-background flex flex-col">
      {/* Enhanced Header */}
      <div className="px-8 py-6 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
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
            <Button asChild className="bg-brand-primary hover:bg-brand-primary/90">
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
              {/* Filters */}
              <ModernCard variant="elevated">
                <ModernCardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by ticker or analyst..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="stopped">Stopped Out</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={analystFilter} onValueChange={setAnalystFilter}>
                      <SelectTrigger className="w-full md:w-40">
                        <SelectValue placeholder="Analyst" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Analysts</SelectItem>
                        {signals && [...new Set(signals.map(s => s.analyst_name))].map(analyst => (
                          <SelectItem key={analyst} value={analyst}>{analyst}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </ModernCardContent>
              </ModernCard>

              {/* Active Signals List */}
              <div className="space-y-4">
                {signalsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading active signals...</div>
                  </div>
                ) : (
                  <>
                    {filteredSignals?.map((signal) => (
                      <ModernCard key={signal.id} variant="elevated" className="hover:shadow-lg transition-all duration-200">
                        <ModernCardContent className="p-6">
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
                                  <p className="text-foreground font-semibold">{signal.entry_price ? `$${signal.entry_price}` : 'Market'}</p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <p className="text-muted-foreground text-sm font-medium">Targets</p>
                                  <p className="text-foreground font-semibold">
                                    {Array.isArray(signal.targets) ? signal.targets.join(', ') : signal.targets || 'N/A'}
                                  </p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <p className="text-muted-foreground text-sm font-medium">Stop Loss</p>
                                  <p className="text-foreground font-semibold">{signal.stop_loss_price ? `$${signal.stop_loss_price}` : 'N/A'}</p>
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

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleCopySignal(signal)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Alert
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleUpdateStatus(signal.id, 'closed')}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Close Signal
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleUpdateStatus(signal.id, 'stopped')} className="text-red-500">
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Stop Out
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </ModernCardContent>
                      </ModernCard>
                    ))}

                    {/* Empty State */}
                    {!signalsLoading && (!filteredSignals || filteredSignals.length === 0) && (
                      <ModernCard variant="elevated">
                        <ModernCardContent className="p-12 text-center">
                          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">No active signals</h3>
                          <p className="text-muted-foreground mb-6">
                            {searchTerm || statusFilter !== 'all' || analystFilter !== 'all' 
                              ? 'Try adjusting your filters to find signals.' 
                              : 'Get started by creating your first trading signal.'}
                          </p>
                          <Button asChild className="bg-brand-primary hover:bg-brand-primary/90">
                            <Link to="/admin/trading-signals">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Signal
                            </Link>
                          </Button>
                        </ModernCardContent>
                      </ModernCard>
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
                      <ModernCard key={call.id} variant="elevated" className="hover:shadow-lg transition-all duration-200">
                        <ModernCardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-lg font-semibold text-foreground">
                                  Degen Call Alert
                                </h3>
                                <Badge className={getDegenStatusColor(call.status)}>
                                  {call.status.toUpperCase()}
                                </Badge>
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
                                {call.telegram_message_id && (
                                  <div className="flex items-center gap-1">
                                    <Send className="h-3 w-3" />
                                    Message ID: {call.telegram_message_id}
                                  </div>
                                )}
                              </div>

                              {call.error_message && (
                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                  <p className="text-red-500 text-sm">
                                    Error: {call.error_message}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </ModernCardContent>
                      </ModernCard>
                    ))}

                    {/* Empty State for Degen Calls */}
                    {!degenLoading && (!degenCalls || degenCalls.length === 0) && (
                      <ModernCard variant="elevated">
                        <ModernCardContent className="p-12 text-center">
                          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">No degen call alerts</h3>
                          <p className="text-muted-foreground mb-6">
                            Degen call alerts will appear here when they are sent to subscribers.
                          </p>
                          <Button asChild variant="outline">
                            <Link to="/admin/degen-calls">
                              <Settings className="h-4 w-4 mr-2" />
                              Manage Degen Calls
                            </Link>
                          </Button>
                        </ModernCardContent>
                      </ModernCard>
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