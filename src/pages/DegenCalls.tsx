import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown, Target, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const DegenCalls = () => {
  const navigate = useNavigate();

  const { data: degenCalls, isLoading } = useQuery({
    queryKey: ['degenCalls', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyst_signals')
        .select('*')
        .eq('posted_to_telegram', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Map the data to match our expected structure
      return data?.map((signal: any) => ({
        id: signal.id,
        coin: signal.ticker,
        entry_price: signal.entry_price,
        direction: signal.trade_direction,
        created_at: signal.created_at,
        status: signal.status,
        stop_loss: signal.stop_loss_price,
        targets: signal.targets,
        risk_percentage: signal.risk_percentage,
        analyst_name: signal.analyst_name,
        outcome: signal.outcome
      })) || [];
    },
    refetchInterval: 30000,
  });

  const getStatusBadge = (status: string, outcome?: string) => {
    if (outcome === 'win') {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/40">Win</Badge>;
    }
    if (outcome === 'loss') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/40">Loss</Badge>;
    }
    if (status === 'active') {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">Active</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'long' ? (
      <TrendingUp className="h-4 w-4 text-green-400" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-400" />
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Degen Calls</h1>
            <p className="text-muted-foreground">Complete history of trading signals from our analysts</p>
          </div>
        </div>

        {/* Stats Overview */}
        {degenCalls && degenCalls.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-foreground">{degenCalls.length}</div>
                <div className="text-sm text-muted-foreground">Total Calls</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-400">
                  {degenCalls.filter(call => call.outcome === 'win').length}
                </div>
                <div className="text-sm text-muted-foreground">Wins</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-400">
                  {degenCalls.filter(call => call.outcome === 'loss').length}
                </div>
                <div className="text-sm text-muted-foreground">Losses</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-400">
                  {degenCalls.filter(call => call.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Calls List */}
        <div className="grid gap-4">
          {degenCalls?.map((call) => (
            <Card key={call.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold text-foreground">{call.coin}</div>
                    {getDirectionIcon(call.direction)}
                    <div className="text-sm text-muted-foreground capitalize">{call.direction}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(call.status, call.outcome)}
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Entry Price</div>
                      <div className="font-medium">${call.entry_price}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Stop Loss</div>
                      <div className="font-medium">${call.stop_loss}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Targets</div>
                    <div className="font-medium">
                      {call.targets?.map((target: number, index: number) => (
                        <span key={index}>
                          ${target}
                          {index < call.targets.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Risk</div>
                    <div className="font-medium">{call.risk_percentage}%</div>
                  </div>
                </div>
                
                {call.analyst_name && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Analyst: <span className="text-foreground font-medium">{call.analyst_name}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {(!degenCalls || degenCalls.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">No degen calls found</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DegenCalls;