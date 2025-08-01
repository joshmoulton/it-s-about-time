import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Video, 
  Mail, 
  GraduationCap, 
  Shield, 
  Plus,
  Activity,
  MessageSquare,
  Settings,
  Zap
} from 'lucide-react';

interface OptimizedAdminOverviewProps {
  adminUser: any;
}

export function OptimizedAdminOverview({ adminUser }: OptimizedAdminOverviewProps) {
  // Get basic real data
  const { data: basicStats, isLoading } = useQuery({
    queryKey: ['admin-basic-stats'],
    queryFn: async () => {
      const [
        { count: articles },
        { count: newsletters },
        { count: videos },
        { count: courses },
        { count: totalUsers }
      ] = await Promise.all([
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('newsletters').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('video_tutorials').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('admin_users').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ]);

      return {
        articles: articles || 0,
        newsletters: newsletters || 0,
        videos: videos || 0,
        courses: courses || 0,
        totalUsers: totalUsers || 0
      };
    }
  });

  const quickActions = [
    {
      label: 'Create Article',
      icon: FileText,
      href: '/admin/articles',
      color: 'bg-blue-500'
    },
    {
      label: 'Add Newsletter',
      icon: Mail,
      href: '/admin/newsletters',
      color: 'bg-green-500'
    },
    {
      label: 'Upload Video',
      icon: Video,
      href: '/admin/videos',
      color: 'bg-purple-500'
    },
    {
      label: 'New Course',
      icon: GraduationCap,
      href: '/admin/courses',
      color: 'bg-orange-500'
    },
    {
      label: 'Trading Signals',
      icon: TrendingUp,
      href: '/admin/trading-signals',
      color: 'bg-cyan-500'
    },
    {
      label: 'Telegram',
      icon: MessageSquare,
      href: '/admin/telegram',
      color: 'bg-indigo-500'
    },
    {
      label: 'Manage Users',
      icon: Users,
      href: '/admin/users',
      color: 'bg-pink-500'
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500'
    }
  ];

  if (isLoading) {
    return (
      <div className="h-full w-full bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-slate-800 rounded-lg w-96"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-900 p-6 space-y-6">
      {/* Simple Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400">Welcome back, {adminUser?.role || 'Admin'}</p>
      </div>

      {/* Quick Actions */}
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Plus className="h-5 w-5 text-cyan-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  asChild
                  variant="outline"
                  className="h-auto p-4 bg-slate-700/30 hover:bg-slate-600/40 border-slate-600/50 text-white"
                >
                  <Link to={action.href} className="flex flex-col items-center space-y-2">
                    <div className={`p-3 rounded-lg ${action.color} bg-opacity-20`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Basic Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-700 bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Articles</p>
                <p className="text-2xl font-bold text-white">{basicStats?.articles || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-700 bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Newsletters</p>
                <p className="text-2xl font-bold text-white">{basicStats?.newsletters || 0}</p>
              </div>
              <Mail className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-700 bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Videos</p>
                <p className="text-2xl font-bold text-white">{basicStats?.videos || 0}</p>
              </div>
              <Video className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-700 bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Courses</p>
                <p className="text-2xl font-bold text-white">{basicStats?.courses || 0}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simple System Status */}
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-green-400" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Database</span>
              <Badge className="bg-green-500/10 text-green-400 border-green-400/20">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">API Status</span>
              <Badge className="bg-green-500/10 text-green-400 border-green-400/20">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Content Items</span>
              <span className="text-white font-medium">
                {(basicStats?.articles || 0) + (basicStats?.newsletters || 0) + (basicStats?.videos || 0) + (basicStats?.courses || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Active Users</span>
              <span className="text-white font-medium">{basicStats?.totalUsers || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}