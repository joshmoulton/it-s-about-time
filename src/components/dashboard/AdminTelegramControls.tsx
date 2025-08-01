
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, RefreshCw, BarChart3, Users, Link, Loader2, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useTelegramIntegration } from '@/hooks/useTelegramIntegration';
import { useAdminFeedControls } from '@/hooks/useTelegramMessages';
import { useTelegramWebhookSetup } from '@/hooks/useTelegramWebhookSetup';
import { supabase } from '@/integrations/supabase/client';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface AdminTelegramControlsProps {
  subscriber: Subscriber;
}

export function AdminTelegramControls({ subscriber }: AdminTelegramControlsProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [syncResult, setSyncResult] = useState<any>(null);
  const [forceSyncing, setForceSyncing] = useState(false);
  const { data: feedControls, isLoading: feedControlsLoading } = useAdminFeedControls();
  const { 
    stats, 
    statsLoading, 
    syncMessages, 
    setWebhook, 
    isSyncing, 
    isSettingWebhook 
  } = useTelegramIntegration();

  const {
    setupWebhook,
    testBot,
    isSettingWebhook: isSettingSupabaseWebhook,
    webhookStatus
  } = useTelegramWebhookSetup();

  const handleSetWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (webhookUrl.trim()) {
      setWebhook(webhookUrl.trim());
    }
  };

  const handleSetupWebhook = async () => {
    try {
      await setupWebhook();
      // Test the bot after setting webhook
      setTimeout(async () => {
        try {
          const result = await testBot();
          setSyncResult(result);
        } catch (error) {
          console.error('Bot test failed:', error);
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to setup webhook:', error);
    }
  };

  const handleForceSync = async () => {
    setForceSyncing(true);
    setSyncResult(null);

    try {
      console.log('🚀 Triggering force sync from @newsletteralertbot...');
      
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'enhanced_sync',
          force_refresh: true,
          batch_size: 50,
          include_cleanup: true
        }
      });

      if (error) {
        console.error('❌ Force sync error:', error);
        setSyncResult({ error: error.message || 'Force sync failed' });
      } else {
        console.log('✅ Force sync result:', data);
        setSyncResult(data);
        // Trigger a refetch of stats after successful sync
        window.location.reload();
      }
    } catch (err: any) {
      console.error('❌ Force sync exception:', err);
      setSyncResult({ error: err.message || 'Unknown error' });
    } finally {
      setForceSyncing(false);
    }
  };

  if (feedControlsLoading || statsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 bg-slate-950 text-white min-h-screen p-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5 text-blue-400" />
            Telegram Bot Controls
          </CardTitle>
          <CardDescription className="text-slate-400">
            Bot communicates directly with Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={handleForceSync} 
                disabled={isSyncing || forceSyncing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {forceSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {forceSyncing ? 'Python Bot Syncing...' : 'Python Bot Sync'}
              </Button>
              
              <Button variant="outline" className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </div>

            {syncResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                syncResult.error 
                  ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300' 
                  : 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
              }`}>
                {syncResult.error ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <div className="text-sm">
                  {syncResult.error ? (
                    <div>Sync failed: {syncResult.error}</div>
                  ) : (
                    <div>
                      <div>✅ Force sync completed!</div>
                      <div>Messages synced: {syncResult.synced || 0}</div>
                      <div>Messages cleaned: {syncResult.cleaned || 0}</div>
                      {syncResult.message && <div>Status: {syncResult.message}</div>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-purple-400" />
            Python Bot Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {stats ? stats.totalMessages.toLocaleString() : '--'}
              </div>
              <div className="text-sm text-slate-400">Total Messages</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats ? stats.messagesThisWeek.toLocaleString() : '--'}
              </div>
              <div className="text-sm text-slate-400">This Week</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats ? stats.activeUsers.toLocaleString() : '--'}
              </div>
              <div className="text-sm text-slate-400">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">Live</div>
              <div className="text-sm text-slate-400">Python Bot Active</div>
            </div>
          </div>

          {stats && stats.topContributors && stats.topContributors.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3 text-white">Top Contributors</h4>
              <div className="space-y-2">
                {stats.topContributors.slice(0, 5).map((contributor, index) => (
                  <div key={contributor.username} className="flex items-center justify-between p-2 bg-slate-700/50 border border-slate-600 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-300">#{index + 1}</span>
                      <span className="text-white">@{contributor.username}</span>
                    </div>
                    <Badge className="bg-slate-600 text-slate-300 border-slate-500">{contributor.messageCount} messages</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Feed Control Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedControls?.map((control) => (
              <div key={control.id} className="border border-slate-600 rounded-lg p-4 bg-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize text-white">
                    {control.section_name.replace('_', ' ')}
                  </h4>
                  <Badge className={control.is_active ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-slate-600 text-slate-300 border-slate-500"}>
                    {control.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-sm text-slate-400 space-y-1">
                  <p>Max messages: {control.max_messages}</p>
                  <p>Auto-refresh: {control.auto_refresh_seconds}s</p>
                  {control.keyword_filters && control.keyword_filters.length > 0 && (
                    <p>Filters: {control.keyword_filters.join(', ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
