import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  RefreshCw, 
  BarChart3, 
  Users, 
  Link, 
  Loader2, 
  MessageSquare,
  Shield,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { useTelegramIntegration } from '@/hooks/useTelegramIntegration';
import { useAdminFeedControls } from '@/hooks/useTelegramMessages';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TelegramSyncTrigger } from '@/components/admin/TelegramSyncTrigger';


interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface EnhancedAdminTelegramControlsProps {
  subscriber: Subscriber;
}

export function EnhancedAdminTelegramControls({ subscriber }: EnhancedAdminTelegramControlsProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const queryClient = useQueryClient();
  const { data: feedControls, isLoading: feedControlsLoading } = useAdminFeedControls();
  const { 
    stats, 
    statsLoading, 
    syncMessages, 
    setWebhook, 
    isSyncing, 
    isSettingWebhook 
  } = useTelegramIntegration();

  // User permissions are now managed client-side or via Whop
  // No need for server-side permission tracking

  // Get sent messages audit
  const { data: sentMessages, isLoading: sentMessagesLoading } = useQuery({
    queryKey: ['admin-sent-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sent_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const handleSetWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (webhookUrl.trim()) {
      setWebhook(webhookUrl.trim());
    }
  };

  // User permissions simplified - managed via Whop tiers
  const handleToggleUserPermission = async (userId: string, canSend: boolean) => {
    try {
      // Note: User permissions are now managed via Whop subscription tiers
      // This function is kept for backwards compatibility but doesn't persist to DB
      console.log(`User ${userId} permission change: ${!canSend} (managed via Whop)`);
    } catch (error) {
      console.error('Error updating user permissions:', error);
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
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commands">Commands</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Community Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {stats ? stats.totalMessages.toLocaleString() : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Messages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stats ? stats.messagesThisWeek.toLocaleString() : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">This Week</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stats ? stats.activeUsers.toLocaleString() : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {sentMessages ? sentMessages.filter(m => m.status === 'sent').length : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Sent from Dashboard</div>
                </div>
              </div>

              {stats && stats.topContributors && stats.topContributors.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Top Contributors</h4>
                  <div className="space-y-2">
                    {stats.topContributors.slice(0, 5).map((contributor, index) => (
                      <div key={contributor.username} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          <span>@{contributor.username}</span>
                        </div>
                        <Badge variant="outline">{contributor.messageCount} messages</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commands" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Command Detection System
              </CardTitle>
              <CardDescription>
                Monitor !degen commands and analyst call detection sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Command monitoring system temporarily unavailable
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Telegram Integration Settings
              </CardTitle>
              <CardDescription>
                Configure your Telegram bot integration and webhook settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSetWebhook} className="space-y-4">
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="webhook-url"
                      type="url"
                      placeholder="https://your-domain.com/webhook/telegram"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <Button 
                      type="submit" 
                      disabled={isSettingWebhook || !webhookUrl.trim()}
                    >
                      {isSettingWebhook ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Link className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </form>
              
              <div className="flex gap-2">
                <Button 
                  onClick={syncMessages} 
                  disabled={isSyncing}
                  className="flex items-center gap-2"
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isSyncing ? 'Syncing...' : 'Sync Messages'}
                </Button>
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          <TelegramSyncTrigger />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Permissions
              </CardTitle>
              <CardDescription>
                Manage who can send messages to the Telegram community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Simplified Access Control</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  User permissions are automatically managed based on their Whop subscription tier. 
                  No manual permission management required.
                </p>
                <div className="mt-4 space-y-2">
                  <Badge variant="outline">Free: Read-only access</Badge>
                  <Badge variant="outline">Paid: Limited posting</Badge>
                  <Badge variant="default">Premium: Full access</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Sent Messages
              </CardTitle>
              <CardDescription>
                Audit trail of messages sent from the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sentMessagesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : sentMessages && sentMessages.length > 0 ? (
                <div className="space-y-4">
                  {sentMessages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{message.sender_email}</span>
                            <Badge variant={message.status === 'sent' ? 'default' : 'destructive'}>
                              {message.status}
                            </Badge>
                            {message.topic_name && (
                              <Badge variant="secondary">
                                {message.topic_name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {message.message_text}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleString()}
                            {message.telegram_message_id && (
                              <span className="ml-2">
                                • Telegram ID: {message.telegram_message_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {message.error_message && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm text-red-700 dark:text-red-300">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          {message.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No sent messages found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
