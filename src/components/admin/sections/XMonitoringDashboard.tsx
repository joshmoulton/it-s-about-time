import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Clock, Activity, TrendingUp, AlertTriangle, CheckCircle, Users, MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface XMonitoringStats {
  totalAccounts: number;
  activeAccounts: number;
  totalPosts: number;
  todaysPosts: number;
  avgSentiment: number;
  lastSync: string | null;
  errorCount: number;
  successRate: number;
}

interface RecentPost {
  id: string;
  account_handle: string;
  post_text: string;
  created_at: string;
  like_count: number;
  retweet_count: number;
  sentiment_score?: number;
  sentiment_label?: string;
}

interface XAccount {
  id: string;
  account_handle: string;
  account_url?: string;
  is_active: boolean;
  monitor_frequency_minutes: number;
  content_type: string;
  keyword_filters?: string[];
  last_sync_at?: string;
  last_post_id?: string;
  error_count: number;
  last_error_message?: string;
  created_at: string;
}

interface XAccountForm {
  account_handle: string;
  account_url: string;
  monitor_frequency_minutes: number;
  content_type: string;
  keyword_filters: string;
}

export const XMonitoringDashboard = () => {
  const [stats, setStats] = useState<XMonitoringStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [accounts, setAccounts] = useState<XAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<XAccountForm>({
    account_handle: '',
    account_url: '',
    monitor_frequency_minutes: 15,
    content_type: 'all_posts',
    keyword_filters: ''
  });

  const fetchStats = async () => {
    try {
      // Get account stats
      const { data: accounts } = await supabase
        .from('x_account_monitoring')
        .select('*');

      setAccounts(accounts || []);

      // Get posts stats
      const { data: posts } = await supabase
        .from('x_posts')
        .select('*');

      // Get today's posts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayPosts } = await supabase
        .from('x_posts')
        .select('*')
        .gte('created_at', today.toISOString());

      // Get average sentiment
      const { data: sentiments } = await supabase
        .from('x_sentiment_analysis')
        .select('sentiment_score')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const avgSentiment = sentiments && sentiments.length > 0
        ? sentiments.reduce((sum, s) => sum + s.sentiment_score, 0) / sentiments.length
        : 0;

      // Get recent posts with sentiment (filtered by account if selected)
      let recentPostsQuery = supabase
        .from('x_posts')
        .select(`
          *,
          x_sentiment_analysis (
            sentiment_score,
            sentiment_label
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (selectedAccount !== 'all') {
        recentPostsQuery = recentPostsQuery.eq('account_handle', selectedAccount);
      }

      const { data: recentPostsData } = await recentPostsQuery;

      const totalAccounts = accounts?.length || 0;
      const activeAccounts = accounts?.filter(a => a.is_active).length || 0;
      const errorCount = accounts?.reduce((sum, a) => sum + (a.error_count || 0), 0) || 0;
      const successRate = totalAccounts > 0 ? ((activeAccounts - errorCount) / totalAccounts) * 100 : 0;
      const lastSync = accounts?.find(a => a.last_sync_at)?.last_sync_at || null;

      setStats({
        totalAccounts,
        activeAccounts,
        totalPosts: posts?.length || 0,
        todaysPosts: todayPosts?.length || 0,
        avgSentiment,
        lastSync,
        errorCount,
        successRate
      });

      setRecentPosts(recentPostsData?.map(post => ({
        ...post,
        sentiment_score: post.x_sentiment_analysis?.[0]?.sentiment_score,
        sentiment_label: post.x_sentiment_analysis?.[0]?.sentiment_label
      })) || []);

    } catch (error) {
      console.error('Error fetching X monitoring stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testXAPI = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('x-data-collector', {
        body: { trigger: 'test' }
      });

      if (error) throw error;

      const { successful = 0, failed = 0, totalPostsCollected = 0 } = data || {};
      
      toast({
        title: 'X API Test Complete',
        description: `✅ ${successful} accounts processed, ${totalPostsCollected} posts collected, ${failed} failed`,
        variant: successful > 0 ? 'default' : 'destructive'
      });

      // Refresh stats after test
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'X API Test Failed',
        description: error.message || 'Failed to test X API connection',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-600';
    if (score < -0.3) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return 'Positive';
    if (score < -0.3) return 'Negative';
    return 'Neutral';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const handle = form.account_handle.replace('@', '');
      const keywordFilters = form.keyword_filters 
        ? form.keyword_filters.split(',').map(k => k.trim()).filter(k => k)
        : [];

      const { error } = await supabase
        .from('x_account_monitoring')
        .insert({
          account_handle: handle,
          account_url: form.account_url || `https://x.com/${handle}`,
          monitor_frequency_minutes: form.monitor_frequency_minutes,
          content_type: form.content_type,
          keyword_filters: keywordFilters.length > 0 ? keywordFilters : null
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'X account added successfully'
      });

      setForm({
        account_handle: '',
        account_url: '',
        monitor_frequency_minutes: 15,
        content_type: 'all_posts',
        keyword_filters: ''
      });
      setShowAddForm(false);
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add X account',
        variant: 'destructive'
      });
    }
  };

  const toggleAccount = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('x_account_monitoring')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update account status',
        variant: 'destructive'
      });
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('x_account_monitoring')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'X account deleted successfully'
      });
      fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete X account',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (account: XAccount) => {
    if (!account.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (account.error_count > 0) {
      return <Badge variant="destructive">Error</Badge>;
    }
    
    if (account.last_sync_at) {
      const lastSync = new Date(account.last_sync_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);
      
      if (diffMinutes < account.monitor_frequency_minutes * 2) {
        return <Badge variant="default">Active</Badge>;
      }
    }
    
    return <Badge variant="outline">Pending</Badge>;
  };

  const formatLastSync = (lastSyncAt?: string) => {
    if (!lastSyncAt) return 'Never';
    
    const lastSync = new Date(lastSyncAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffMinutes / 1440)}d ago`;
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 120000); // Refresh every 2 minutes instead of 30 seconds to reduce PostHog events
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchStats(); // Refetch when account filter changes
  }, [selectedAccount]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">X Monitoring Dashboard</h2>
        <Button onClick={testXAPI} disabled={isTesting}>
          {isTesting ? 'Testing...' : 'Test X API'}
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="accounts">Account Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAccounts}/{stats?.totalAccounts}</div>
            <p className="text-xs text-muted-foreground">monitoring accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Collected</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.todaysPosts} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSentimentColor(stats?.avgSentiment || 0)}`}>
              {getSentimentLabel(stats?.avgSentiment || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.avgSentiment?.toFixed(2) || '0.00'} score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {stats?.errorCount === 0 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate.toFixed(0)}%</div>
            <Progress value={stats?.successRate || 0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.errorCount} errors
            </p>
            {stats?.errorCount > 0 && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                <p className="font-medium text-red-800">Recent Error:</p>
                <p className="text-red-600">{accounts.find(a => a.last_error_message)?.last_error_message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Last Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span>
              {stats?.lastSync ? (
                <>Last synced {formatDistanceToNow(new Date(stats.lastSync))} ago</>
              ) : (
                'Never synced'
              )}
            </span>
            <Badge variant={stats?.lastSync ? "default" : "secondary"}>
              {stats?.lastSync ? 'Active' : 'Pending'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Posts
          </CardTitle>
          <div className="flex gap-2 mt-2">
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.filter(a => a.is_active).map((account) => (
                  <SelectItem key={account.id} value={account.account_handle}>
                    @{account.account_handle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No posts collected yet. Click "Test X API" to start collecting data.
            </p>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">@{post.account_handle}</span>
                    <div className="flex flex-col items-end text-sm text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
                      <span className="text-xs">{format(new Date(post.created_at), 'MMM dd, HH:mm')}</span>
                    </div>
                  </div>
                  <p className="text-sm line-clamp-2">{post.post_text}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>❤️ {post.like_count}</span>
                    <span>🔄 {post.retweet_count}</span>
                    {post.sentiment_score && (
                      <Badge variant="outline" className={getSentimentColor(post.sentiment_score)}>
                        {post.sentiment_label}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Account Configuration</h3>
              <p className="text-sm text-muted-foreground">Manage X accounts for monitoring</p>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>

          {showAddForm && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add X Account</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="account_handle">Account Handle</Label>
                    <Input
                      id="account_handle"
                      placeholder="@username or username"
                      value={form.account_handle}
                      onChange={(e) => setForm(prev => ({ ...prev, account_handle: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="account_url">Account URL (optional)</Label>
                    <Input
                      id="account_url"
                      placeholder="https://x.com/username"
                      value={form.account_url}
                      onChange={(e) => setForm(prev => ({ ...prev, account_url: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="frequency">Monitor Frequency</Label>
                    <Select
                      value={form.monitor_frequency_minutes.toString()}
                      onValueChange={(value) => setForm(prev => ({ ...prev, monitor_frequency_minutes: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Every 5 minutes</SelectItem>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Every hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="content_type">Content Type</Label>
                    <Select
                      value={form.content_type}
                      onValueChange={(value) => setForm(prev => ({ ...prev, content_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_posts">All Posts</SelectItem>
                        <SelectItem value="original_only">Original Posts Only</SelectItem>
                        <SelectItem value="replies_only">Replies Only</SelectItem>
                        <SelectItem value="retweets_only">Retweets Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="keyword_filters">Keyword Filters (optional)</Label>
                  <Input
                    id="keyword_filters"
                    placeholder="bitcoin, crypto, trading (comma separated)"
                    value={form.keyword_filters}
                    onChange={(e) => setForm(prev => ({ ...prev, keyword_filters: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Add Account</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="grid gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <X className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">@{account.account_handle}</h3>
                        {getStatusBadge(account)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {account.content_type.replace('_', ' ')} • Every {account.monitor_frequency_minutes}m
                        {account.keyword_filters && (
                          <span> • Filters: {account.keyword_filters.join(', ')}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last sync: {formatLastSync(account.last_sync_at)}
                        {account.error_count > 0 && (
                          <span className="text-red-400 ml-2">
                            {account.error_count} errors
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={account.is_active}
                      onCheckedChange={(checked) => toggleAccount(account.id, checked)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAccount(account.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {account.last_error_message && (
                  <div className="mt-3 p-2 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    {account.last_error_message}
                  </div>
                )}
              </Card>
            ))}

            {accounts.length === 0 && (
              <Card className="p-8 text-center">
                <X className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No X Accounts</h3>
                <p className="text-muted-foreground mb-4">Add Twitter/X accounts to start monitoring sentiment</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Account
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};