
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, TrendingUp, BarChart3 } from 'lucide-react';
import { useOptimizedAdminStats } from '@/hooks/useOptimizedAdminStats';

export function AnalyticsOverview() {
  const { data: stats } = useOptimizedAdminStats();

  const overviewCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      description: `${stats?.usersByTier?.free || 0} free, ${stats?.usersByTier?.paid || 0} paid, ${stats?.usersByTier?.premium || 0} premium`,
      icon: Users,
      color: 'bg-cyan-500'
    },
    {
      title: 'Published Content',
      value: Object.values(stats?.publishedContent || {}).reduce((sum, count) => sum + count, 0),
      description: `${stats?.publishedContent?.newsletters || 0} newsletters, ${stats?.publishedContent?.videos || 0} videos, ${stats?.publishedContent?.courses || 0} courses`,
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'Premium Conversion',
      value: stats?.usersByTier?.premium && stats?.totalUsers ? 
        `${((stats.usersByTier.premium / stats.totalUsers) * 100).toFixed(1)}%` : '0.0%',
      description: `${stats?.usersByTier?.premium || 0} premium of ${stats?.totalUsers || 0} total`,
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      title: 'Content Distribution',
      value: stats?.publishedContent?.articles || 0,
      description: 'Articles published',
      icon: BarChart3,
      color: 'bg-orange-500'
    }
  ];

  const totalUsers = stats?.totalUsers || 0;
  const payingUsers = (stats?.usersByTier?.paid || 0) + (stats?.usersByTier?.premium || 0);
  const payingPercentage = totalUsers > 0 ? ((payingUsers / totalUsers) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {overviewCards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <Card key={index} className="relative overflow-hidden border border-slate-700 bg-slate-800/50">
            <div className={`absolute top-0 left-0 w-1 h-full ${card.color}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${card.color} bg-opacity-20`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
              {index === 2 && totalUsers > 0 && (
                <Badge variant="outline" className="text-green-400 border-green-400">
                  {payingPercentage}% paying
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-slate-400">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
