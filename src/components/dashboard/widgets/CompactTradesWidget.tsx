
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Lock, Sparkles, DollarSign, Activity, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface CompactTradesWidgetProps {
  subscriber: Subscriber;
}

export function CompactTradesWidget({ subscriber }: CompactTradesWidgetProps) {
  const navigate = useNavigate();
  
  const getTierLevel = (tier: string) => {
    const levels = { free: 0, paid: 1, premium: 2 };
    return levels[tier as keyof typeof levels] || 0;
  };
  
  const userTierLevel = getTierLevel(subscriber?.subscription_tier || 'free');
  
  if (userTierLevel < 1) {
    return (
      <Card className="h-full flex flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200" data-tour="trades-widget">
        <CardContent className="flex flex-col items-center justify-center py-8 h-full relative z-10">
          <div className="p-4 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-800/60 dark:to-teal-800/60 rounded-2xl mb-4 backdrop-blur-sm border border-white/20">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="font-bold text-lg mb-2 text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Trading Dashboard</h4>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-40">
            Access live trading tools and portfolio tracking
          </p>
          <Button size="sm" onClick={() => navigate('/pricing')} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl font-medium">
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade Required
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Demo trading data for paid users
  const tradingStats = {
    totalTrades: 12,
    winRate: 78.5,
    todayPnL: 1250.75,
    weeklyPnL: 4890.25
  };

  const recentTrades = [
    { symbol: 'AAPL', type: 'CALL', strike: '185', expiry: '01/17', pnl: '+$127.50', status: 'open' },
    { symbol: 'TSLA', type: 'PUT', strike: '220', expiry: '01/24', pnl: '+$185.00', status: 'open' },
    { symbol: 'SPY', type: 'CALL', strike: '480', expiry: '01/31', pnl: '+$87.00', status: 'open' },
    { symbol: 'NVDA', type: 'CALL', strike: '500', expiry: '02/07', pnl: '+$240.00', status: 'open' },
  ];

  return (
    <Card className="h-full flex flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200" data-tour="trades-widget">
      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="text-sm font-bold flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              Trading Dashboard
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 relative z-10 p-4">
        {/* Trading Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">Active Trades</span>
            </div>
            <div className="text-lg font-bold text-emerald-600">{tradingStats.totalTrades}</div>
          </div>
          
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">Win Rate</span>
            </div>
            <div className="text-lg font-bold text-blue-600">{tradingStats.winRate}%</div>
          </div>
        </div>

        {/* P&L Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground">Today P&L</span>
            </div>
            <div className="text-sm font-bold text-green-600">+${tradingStats.todayPnL.toLocaleString()}</div>
          </div>
          
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">Weekly P&L</span>
            </div>
            <div className="text-sm font-bold text-emerald-600">+${tradingStats.weeklyPnL.toLocaleString()}</div>
          </div>
        </div>

        {/* Recent Trades List */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Recent Positions</h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {recentTrades.map((trade, index) => (
              <div key={index} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="text-xs font-medium">{trade.symbol} ${trade.strike}{trade.type.charAt(0)}</div>
                    <div className="text-xs text-muted-foreground">{trade.expiry}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-green-600">{trade.pnl}</div>
                    <div className="text-xs text-muted-foreground capitalize">{trade.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
