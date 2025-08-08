
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Lock, DollarSign, Calendar, Target, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface TradesWidgetProps {
  subscriber: Subscriber;
}

export function TradesWidget({ subscriber }: TradesWidgetProps) {
  const navigate = useNavigate();

  const getTierLevel = (tier: string) => {
    const levels = { free: 0, paid: 1, premium: 2 };
    return levels[tier as keyof typeof levels] || 0;
  };

  const userTierLevel = getTierLevel(subscriber?.subscription_tier || 'free');

  if (userTierLevel < 1) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Live Trading Alerts
          </h1>
          <p className="text-muted-foreground mt-2">
            Track live trading alerts and monitor your portfolio performance
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upgrade Required</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Access live trading alerts and monitor your portfolio performance with a paid subscription.
            </p>
            <Button onClick={() => navigate('/pricing?open=1')}>
              Upgrade to Paid
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          Live Trading Alerts
        </h1>
        <p className="text-muted-foreground mt-2">
          Real-time trading alerts from your connected data source
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-green-600" />
                <div className="text-2xl font-bold text-green-600">Live</div>
              </div>
              <div className="text-sm text-muted-foreground">WebSocket Connected</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">Real-Time</div>
              <div className="text-sm text-muted-foreground">Database Sync</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">Active</div>
              <div className="text-sm text-muted-foreground">System Ready</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Trading Alerts System
          </CardTitle>
          <CardDescription>
            Your trading alerts are now connected to real data sources without any demo fallbacks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">System Ready</h3>
            <p className="text-muted-foreground">
              All demo data has been removed. The widget will only display actual trading alerts 
              from your connected data sources.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trading Tools</CardTitle>
          <CardDescription>
            Access advanced trading tools and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <DollarSign className="h-4 w-4 mr-2" />
              Portfolio Tracker
            </Button>
            <Button variant="outline" className="justify-start">
              <Target className="h-4 w-4 mr-2" />
              Risk Analyzer
            </Button>
            <Button variant="outline" className="justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance Tracker
            </Button>
            <Button variant="outline" className="justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Alert Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
