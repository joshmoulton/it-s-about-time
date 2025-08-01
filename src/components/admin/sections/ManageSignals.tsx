import React, { useState } from 'react';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Send
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define the signal data type based on analyst_signals table
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

export function ManageSignals() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [callerFilter, setCallerFilter] = useState('all');

  // Fetch signals from local database
  const { data: signals, isLoading } = useQuery({
    queryKey: ['analyst-signals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyst_signals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching signals:', error);
        throw error;
      }
      
      return data as SignalData[];
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
      queryClient.invalidateQueries({ queryKey: ['analyst-signals'] });
      toast.success('Signal updated successfully');
    },
    onError: (error) => {
      console.error('Error updating signal:', error);
      toast.error('Failed to update signal');
    },
  });

  // Delete signal mutation
  const deleteSignalMutation = useMutation({
    mutationFn: async (signalId: string) => {
      const { error } = await supabase
        .from('analyst_signals')
        .delete()
        .eq('id', signalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyst-signals'] });
      toast.success('Signal deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting signal:', error);
      toast.error('Failed to delete signal');
    },
  });

  const filteredSignals = signals?.filter(signal => {
    const matchesSearch = signal.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signal.analyst_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || signal.status === statusFilter;
    const matchesCaller = callerFilter === 'all' || signal.analyst_name === callerFilter;
    
    return matchesSearch && matchesStatus && matchesCaller;
  });

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!signals) return { total: 0, active: 0, thisWeek: 0, callers: 0 };
    
    const total = signals.length;
    const active = signals.filter(signal => signal.status === 'published').length;
    const thisWeek = signals.filter(signal => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(signal.created_at) > weekAgo;
    }).length;
    const callers = new Set(signals.map(signal => signal.analyst_name)).size;

    return { total, active, thisWeek, callers };
  }, [signals]);

  const handleCopySignal = (signal: SignalData) => {
    const targets = Array.isArray(signal.targets) 
      ? signal.targets.join(', ') 
      : signal.targets || 'N/A';
      
    const signalText = `🚨 TRADING SIGNAL 🚨

💎 ${signal.ticker} ${signal.trade_direction.toUpperCase()}

🎯 Entry: ${signal.entry_price ? `$${signal.entry_price}` : 'Market'}
${signal.targets ? `🚀 Targets: ${targets}` : ''}
${signal.stop_loss_price ? `❌ Stop Loss: $${signal.stop_loss_price}` : ''}

📋 Analyst: ${signal.analyst_name}

⚠️ Trade at your own risk - Not financial advice!`;
    
    navigator.clipboard.writeText(signalText);
    toast.success('Signal copied to clipboard');
  };

  const getStatusColor = (signal: SignalData) => {
    switch (signal.status) {
      case 'published':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'archived':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
    }
  };

  const getStatusText = (signal: SignalData) => {
    switch (signal.status) {
      case 'published':
        return 'Published';
      case 'draft':
        return 'Draft';
      case 'archived':
        return 'Archived';
      default:
        return signal.status || 'Unknown';
    }
  };

  const handleUpdateStatus = (signalId: string, status: string) => {
    updateSignalStatusMutation.mutate({ signalId, status });
  };

  const handleDeleteSignal = (signalId: string) => {
    if (confirm('Are you sure you want to delete this signal?')) {
      deleteSignalMutation.mutate(signalId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading signals...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background flex flex-col">
      {/* Enhanced Header */}
      <div className="px-8 py-6 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">Manage Trading Signals</h1>
                <p className="text-muted-foreground">Monitor and manage all your trading signals</p>
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
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={callerFilter} onValueChange={setCallerFilter}>
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

          {/* Signals List */}
          <div className="space-y-4">
            {filteredSignals?.map((signal) => (
              <ModernCard key={signal.id} variant="elevated" className="hover:shadow-lg transition-all duration-200">
                <ModernCardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-semibold text-foreground">
                          {signal.ticker}
                        </h3>
                        <Badge className={getStatusColor(signal)}>
                          {getStatusText(signal)}
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

                      {signal.full_description && (
                        <div className="bg-muted/50 rounded-lg p-4 mb-4">
                          <p className="text-foreground text-sm line-clamp-3">
                            {signal.full_description}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Risk: {signal.risk_percentage || 2}%
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {signal.market || 'Crypto'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Created: {new Date(signal.created_at).toLocaleDateString()}
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
                           Copy Signal
                         </DropdownMenuItem>
                         
                         {signal.status === 'draft' && (
                           <DropdownMenuItem onClick={() => handleUpdateStatus(signal.id, 'published')}>
                             <Send className="h-4 w-4 mr-2" />
                             Publish Signal
                           </DropdownMenuItem>
                         )}
                         
                         {signal.status === 'published' && (
                           <DropdownMenuItem onClick={() => handleUpdateStatus(signal.id, 'archived')}>
                             <Archive className="h-4 w-4 mr-2" />
                             Archive Signal
                           </DropdownMenuItem>
                         )}
                         
                         <DropdownMenuItem onClick={() => handleDeleteSignal(signal.id)} className="text-red-500">
                           <Trash2 className="h-4 w-4 mr-2" />
                           Delete Signal
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </ModernCardContent>
              </ModernCard>
            ))}

            {/* Empty State */}
            {!isLoading && (!filteredSignals || filteredSignals.length === 0) && (
              <ModernCard variant="elevated">
                <ModernCardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No signals found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm || statusFilter !== 'all' || callerFilter !== 'all' 
                      ? 'Try adjusting your filters to find signals.' 
                      : 'Get started by creating your first trading signal.'}
                  </p>
                  <Button asChild className="bg-brand-primary hover:bg-brand-primary/90">
                    <Link to="/admin/trading-signals">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Signal
                    </Link>
                  </Button>
                </ModernCardContent>
              </ModernCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}