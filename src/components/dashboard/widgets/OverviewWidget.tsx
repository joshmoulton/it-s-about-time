
import React from 'react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Mail, MessageCircle, BookOpen, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface OverviewWidgetProps {
  subscriber: Subscriber;
}

export function OverviewWidget({ subscriber }: OverviewWidgetProps) {
  // Fetch actual content data
  const { data: contentData } = useQuery({
    queryKey: ['dashboard-content-overview'],
    queryFn: async () => {
      console.log('Fetching dashboard content overview...');
      
      const [
        { count: publishedNewsletters },
        { count: publishedArticles },
        { count: publishedVideos },
        adminUsersResult,
        whopUsersResult
      ] = await Promise.all([
        supabase.from('newsletters').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('video_tutorials').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('admin_users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('whop_authenticated_users').select('*', { count: 'exact', head: true })
      ]);

      const totalUsers = (adminUsersResult.count || 0) + (whopUsersResult.count || 0);

      return {
        newsletters: publishedNewsletters || 0,
        articles: publishedArticles || 0,
        videos: publishedVideos || 0,
        totalUsers: totalUsers || 0
      };
    }
  });

  const getTierLevel = (tier: string) => {
    const levels = { free: 0, paid: 1, premium: 2 };
    return levels[tier as keyof typeof levels] || 0;
  };

  const userTierLevel = getTierLevel(subscriber?.subscription_tier || 'free');

  const features = [
    {
      title: 'Chat Highlights',
      description: 'Community insights and key discussions',
      icon: MessageCircle,
      tier: 'free',
      available: true,
    },
    {
      title: 'Newsletter Access',
      description: 'Weekly market analysis and updates',
      icon: Mail,
      tier: 'free',
      available: true,
    },
    {
      title: 'The Edge Content',
      description: 'Premium educational resources',
      icon: BookOpen,
      tier: 'paid',
      available: userTierLevel >= 1,
    },
    {
      title: 'Active Alerts',
      description: 'Real-time market notifications',
      icon: AlertTriangle,
      tier: 'paid',
      available: userTierLevel >= 1,
    },
    {
      title: 'Trade Tracking',
      description: 'Portfolio monitoring and analysis',
      icon: TrendingUp,
      tier: 'paid',
      available: userTierLevel >= 1,
    },
    {
      title: 'Sentiment Analysis',
      description: 'Advanced market sentiment tracking',
      icon: BarChart3,
      tier: 'premium',
      available: userTierLevel >= 2,
    },
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'paid': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  // Calculate days since joining
  const daysSinceJoining = Math.floor(
    (new Date().getTime() - new Date(subscriber?.created_at || '').getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground mt-2">
          Here's what's available with your{' '}
          <Badge className={getTierColor(subscriber?.subscription_tier || 'free')}>
            {subscriber?.subscription_tier === 'premium' && <Crown className="h-3 w-3 mr-1" />}
            <span className="capitalize">{subscriber?.subscription_tier}</span>
          </Badge>{' '}
          subscription.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className={!feature.available ? 'opacity-60' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <feature.icon className="h-5 w-5" />
                {feature.title}
                {!feature.available && (
                  <Crown className="h-4 w-4 text-yellow-500 ml-auto" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
              {!feature.available && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Requires {feature.tier} subscription
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>Your account overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{Math.max(1, daysSinceJoining)}</div>
              <div className="text-sm text-muted-foreground">Days Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{contentData?.newsletters || 0}</div>
              <div className="text-sm text-muted-foreground">Newsletters Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Chat Highlights</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {userTierLevel >= 1 ? '0' : '--'}
              </div>
              <div className="text-sm text-muted-foreground">Active Alerts</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
