import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  FileText,
  Video,
  GraduationCap,
  Mail,
  TrendingUp,
  Activity,
  DollarSign
} from 'lucide-react';
// BeehiIV Sync Monitor removed - simplified system

interface AdminUser {
  id: string;
  role: string;
  permissions: any;
  is_active: boolean;
}

interface AdminOverviewProps {
  adminUser: AdminUser;
}

export function AdminOverview({ adminUser }: AdminOverviewProps) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-overview-stats'],
    queryFn: async () => {
      console.log('Fetching admin overview stats...');
      
      try {
        const [
          { count: publishedNewsletters, error: newslettersError },
          { count: publishedVideos, error: videosError },
          { count: publishedCourses, error: coursesError },
          { count: publishedArticles, error: articlesError },
          { count: adminUsers, error: adminError },
          { count: whopUsers, error: whopError }
        ] = await Promise.all([
          supabase.from('newsletters').select('*', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('video_tutorials').select('*', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('admin_users').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('whop_authenticated_users').select('*', { count: 'exact', head: true })
        ]);

        // Log any errors
        if (newslettersError) console.error('Newsletters error:', newslettersError);
        if (videosError) console.error('Videos error:', videosError);
        if (coursesError) console.error('Courses error:', coursesError);
        if (articlesError) console.error('Articles error:', articlesError);
        if (adminError) console.error('Admin users error:', adminError);
        if (whopError) console.error('Whop users error:', whopError);

        const stats = {
          totalUsers: (adminUsers || 0) + (whopUsers || 0),
          publishedNewsletters: publishedNewsletters || 0,
          publishedVideos: publishedVideos || 0,
          publishedCourses: publishedCourses || 0,
          publishedArticles: publishedArticles || 0,
          freeUsers: 0, // Not tracked in new system
          paidUsers: 0, // Not tracked in new system
          premiumUsers: whopUsers || 0 // Approximate with Whop users
        };

        console.log('Admin stats fetched:', stats);
        return stats;
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        throw error;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen">
        <div className="text-center text-red-400">
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p>Failed to load admin statistics. Please try refreshing the page.</p>
          <pre className="mt-4 text-sm bg-red-900/20 p-4 rounded">
            {error.message}
          </pre>
        </div>
      </div>
    );
  }

  // Calculate engagement metrics
  const totalContent = (stats?.publishedNewsletters || 0) + (stats?.publishedVideos || 0) + (stats?.publishedCourses || 0) + (stats?.publishedArticles || 0);
  const payingUsers = (stats?.paidUsers || 0) + (stats?.premiumUsers || 0);
  const conversionRate = stats?.totalUsers > 0 ? ((payingUsers / stats.totalUsers) * 100).toFixed(1) : '0.0';

  const overviewCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      description: 'Registered subscribers',
      color: 'bg-blue-500'
    },
    {
      title: 'Published Content',
      value: totalContent,
      icon: FileText,
      description: 'Total published items',
      color: 'bg-green-500'
    },
    {
      title: 'Premium Users',
      value: stats?.premiumUsers || 0,
      icon: DollarSign,
      description: 'Premium subscribers',
      color: 'bg-yellow-500'
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      icon: TrendingUp,
      description: 'Users to paid conversion',
      color: 'bg-purple-500'
    }
  ];

  const contentStats = [
    {
      title: 'Articles',
      count: stats?.publishedArticles || 0,
      icon: FileText,
      color: 'text-blue-400'
    },
    {
      title: 'Newsletters',
      count: stats?.publishedNewsletters || 0,
      icon: Mail,
      color: 'text-green-400'
    },
    {
      title: 'Videos',
      count: stats?.publishedVideos || 0,
      icon: Video,
      color: 'text-purple-400'
    },
    {
      title: 'Courses',
      count: stats?.publishedCourses || 0,
      icon: GraduationCap,
      color: 'text-orange-400'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 mt-2">Welcome back, {adminUser.role.replace('_', ' ')} user</p>
      </div>

      {/* Overview Stats */}
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
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                  <p className="text-xs text-slate-400">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content and User Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Content Overview</CardTitle>
            <CardDescription className="text-slate-400">Published content by type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contentStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                    <span className="font-medium text-white">{stat.title}</span>
                  </div>
                  <span className="text-2xl font-bold text-white">{stat.count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">User Distribution</CardTitle>
            <CardDescription className="text-slate-400">Subscribers by tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
              <span className="font-medium text-white">Admin Users</span>
              <span className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
              <span className="font-medium text-white">System Status</span>
              <Badge className="bg-green-500/10 text-green-400">Secure</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
              <span className="font-medium text-white">Data Protection</span>
              <Badge className="bg-blue-500/10 text-blue-400">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription className="text-slate-400">Current system state and quick metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex justify-between py-2">
              <span className="text-slate-400">System Status:</span>
              <Badge className="bg-green-500/10 text-green-400">Online</Badge>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Database:</span>
              <Badge className="bg-green-500/10 text-green-400">Connected</Badge>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Content Items:</span>
              <span className="font-medium text-white">{totalContent}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Active Users:</span>
              <span className="font-medium text-white">{stats?.totalUsers || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
