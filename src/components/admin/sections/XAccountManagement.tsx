import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

export function XAccountManagement() {
  const [accounts, setAccounts] = useState<XAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [form, setForm] = useState<XAccountForm>({
    account_handle: '',
    account_url: '',
    monitor_frequency_minutes: 15,
    content_type: 'all_posts',
    keyword_filters: ''
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('x_account_monitoring')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching X accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch X accounts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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
      fetchAccounts();
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
      fetchAccounts();
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
      fetchAccounts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete X account',
        variant: 'destructive'
      });
    }
  };

  const triggerDataCollection = async () => {
    setIsCollecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('x-data-collector', {
        body: { trigger: 'manual' }
      });

      if (error) throw error;

      const { successful = 0, failed = 0, totalPostsCollected = 0, results = [] } = data || {};
      
      if (failed > 0) {
        const errors = results.filter((r: any) => !r.success).map((r: any) => r.error).join(', ');
        toast({
          title: 'Collection Completed with Errors',
          description: `${successful} successful, ${failed} failed. Posts collected: ${totalPostsCollected}. Errors: ${errors}`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Success',
          description: `Data collection completed! ${successful} accounts processed, ${totalPostsCollected} posts collected.`
        });
      }
      
      // Refresh the accounts to show updated status
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start data collection',
        variant: 'destructive'
      });
    } finally {
      setIsCollecting(false);
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

  if (loading) {
    return <div className="p-6">Loading X account monitoring...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">X Account Monitoring</h1>
          <p className="text-slate-400">Monitor Twitter/X accounts for sentiment analysis</p>
        </div>
        
        <div className="flex gap-4">
          <Button
            onClick={triggerDataCollection}
            disabled={isCollecting}
            variant="outline"
          >
            {isCollecting ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
            {isCollecting ? 'Collecting...' : 'Collect Now'}
          </Button>
          
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card className="p-6 bg-slate-800 border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Add X Account</h3>
          
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
          <Card key={account.id} className="p-4 bg-slate-800 border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <X className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">@{account.account_handle}</h3>
                    {getStatusBadge(account)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {account.content_type.replace('_', ' ')} • Every {account.monitor_frequency_minutes}m
                    {account.keyword_filters && (
                      <span> • Filters: {account.keyword_filters.join(', ')}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
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
                <AlertCircle className="h-4 w-4 inline mr-2" />
                {account.last_error_message}
              </div>
            )}
          </Card>
        ))}

        {accounts.length === 0 && (
          <Card className="p-8 bg-slate-800 border-slate-700 text-center">
            <X className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No X Accounts</h3>
            <p className="text-slate-400 mb-4">Add Twitter/X accounts to start monitoring sentiment</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Account
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}