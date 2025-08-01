
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Copy, 
  Edit, 
  Archive, 
  Trash2,
  TrendingUp,
  Calendar,
  User,
  Zap
} from 'lucide-react';
import { useSignalManagement } from '@/hooks/useSignalManagement';
import { useDegenCallManagement } from '@/hooks/useDegenCallManagement';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function SignalManagementDashboard() {
  const { signals, isLoading, stats, updateSignalStatus, deleteSignal } = useSignalManagement();
  const { sendDegenCall, isSendingDegenCall } = useDegenCallManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState('all');

  const filteredSignals = signals?.filter(signal => {
    const matchesSearch = signal.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signal.analyst_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || signal.status === statusFilter;
    const matchesMarket = marketFilter === 'all' || signal.market === marketFilter;
    
    return matchesSearch && matchesStatus && matchesMarket;
  });

  const handleCopySignal = (signal: any) => {
    if (signal.formatted_output) {
      navigator.clipboard.writeText(signal.formatted_output);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'closed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'archived': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getMarketColor = (market: string) => {
    switch (market) {
      case 'crypto': return 'bg-orange-500/20 text-orange-400';
      case 'stocks': return 'bg-green-500/20 text-green-400';
      case 'commodities': return 'bg-yellow-500/20 text-yellow-400';
      case 'forex': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading signals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Manage Signals</h2>
          <p className="text-sm text-muted-foreground">View and manage your trading signals</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by ticker or analyst..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-full md:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={marketFilter} onValueChange={setMarketFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-full md:w-32">
                <SelectValue placeholder="Market" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Markets</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="stocks">Stocks</SelectItem>
                <SelectItem value="commodities">Commodities</SelectItem>
                <SelectItem value="forex">Forex</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Signals List */}
      <div className="space-y-4">
        {filteredSignals?.map((signal) => (
          <Card key={signal.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      {signal.ticker}
                    </h3>
                    <Badge className={getMarketColor(signal.market)}>
                      {signal.market.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(signal.status)}>
                      {signal.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {signal.trade_direction.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">Analyst</p>
                      <p className="text-white font-medium">{signal.analyst_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Risk</p>
                      <p className="text-white font-medium">{signal.risk_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Entry Type</p>
                      <p className="text-white font-medium capitalize">{signal.entry_type}</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-600 rounded p-3 mb-4">
                    <p className="text-slate-300 text-sm line-clamp-3">
                      {signal.full_description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Created: {new Date(signal.created_at).toLocaleDateString()}</span>
                    {signal.posted_to_telegram && (
                      <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                        Posted to Telegram
                      </Badge>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-700 border-slate-600">
                    <DropdownMenuItem 
                      onClick={() => sendDegenCall(signal.id)}
                      disabled={isSendingDegenCall || signal.posted_to_telegram}
                      className="text-orange-400 hover:bg-orange-600/20"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Send Degen Call
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleCopySignal(signal)}
                      className="text-slate-300 hover:bg-slate-600"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Signal
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-slate-300 hover:bg-slate-600"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updateSignalStatus(signal.id, 'archived')}
                      className="text-slate-300 hover:bg-slate-600"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteSignal(signal.id)}
                      className="text-red-400 hover:bg-red-600/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredSignals?.length === 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">No signals found</h3>
              <p className="text-slate-500">
                {searchTerm || statusFilter !== 'all' || marketFilter !== 'all'
                  ? 'Try adjusting your filters to see more signals.'
                  : 'Create your first trading signal to get started.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
