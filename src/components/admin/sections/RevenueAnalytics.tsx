
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Users, Target } from 'lucide-react';

export function RevenueAnalytics() {
  const revenueMetrics = {
    totalRevenue: 247850,
    monthlyGrowth: 23.5,
    averageOrderValue: 89.50,
    conversionRate: 3.2,
    lifetimeValue: 340,
    activeSubscriptions: 2847
  };

  return (
    <div className="p-8 space-y-6 bg-slate-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Revenue Analytics</h1>
          <p className="text-slate-400">Enterprise-level financial insights and forecasting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Total Revenue</p>
                <p className="text-3xl font-bold text-green-400">
                  ${revenueMetrics.totalRevenue.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+{revenueMetrics.monthlyGrowth}% this month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Conversion Rate</p>
                <p className="text-3xl font-bold text-blue-400">{revenueMetrics.conversionRate}%</p>
                <Badge variant="default" className="mt-1 bg-blue-500/20 text-blue-400">
                  Above Industry Average
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-slate-400">Active Subscriptions</p>
                <p className="text-3xl font-bold text-purple-400">
                  {revenueMetrics.activeSubscriptions.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  LTV: ${revenueMetrics.lifetimeValue}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Revenue Forecast</CardTitle>
          <CardDescription>Projected growth for CNBC traffic surge</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-slate-400">Enterprise revenue analytics dashboard coming soon...</p>
            <p className="text-sm text-slate-500 mt-2">Integration with Stripe, payment processors, and forecasting models</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
