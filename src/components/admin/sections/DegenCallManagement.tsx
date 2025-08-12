import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, Bell, TrendingUp, CheckCircle, XCircle, AlertTriangle, Ban, Clock } from 'lucide-react';
import { useDegenCallManagement } from '@/hooks/useDegenCallManagement';
import { useSignalManagement } from '@/hooks/useSignalManagement';
import { formatDistanceToNow } from 'date-fns';

export function DegenCallManagement() {
  const {
    subscriptions,
    notifications,
    subscriptionsLoading,
    notificationsLoading,
    isTogglingSubscription,
    toggleSubscription,
    totalSubscribers,
    activeSubscribers,
    totalNotifications
  } = useDegenCallManagement();

  const {
    signals,
    isLoading: signalsLoading,
    updateSignalStatus
  } = useSignalManagement();

  const renderSubscriptionStatus = (isActive: boolean) => (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );

  const renderNotificationStatus = (status: string) => {
    const statusConfig = {
      sent: { icon: CheckCircle, color: "text-green-600", label: "Sent" },
      partial_failure: { icon: AlertTriangle, color: "text-yellow-600", label: "Partial" },
      failed: { icon: XCircle, color: "text-red-600", label: "Failed" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.failed;
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.color}`} />
        <span className={config.color}>{config.label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Degen Call Management</h2>
          <p className="text-muted-foreground">
            Manage trading signal notifications for Telegram subscribers
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscribers}</div>
            <p className="text-xs text-muted-foreground">
              {activeSubscribers} active subscribers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscribers}</div>
            <p className="text-xs text-muted-foreground">
              {totalSubscribers > 0 ? Math.round((activeSubscribers / totalSubscribers) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotifications}</div>
            <p className="text-xs text-muted-foreground">
              Total degen calls sent
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="signals">Active Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Degen Call Subscriptions</CardTitle>
              <CardDescription>
                Manage users subscribed to degen trading call notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No degen call subscriptions found
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{subscription.user_email}</span>
                          {renderSubscriptionStatus(subscription.is_active)}
                          <Badge variant="outline">{subscription.subscription_tier}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{subscription.telegram_username || 'N/A'} • 
                          ID: {subscription.telegram_user_id || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created {formatDistanceToNow(new Date(subscription.created_at))} ago
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={subscription.is_active}
                          onCheckedChange={(checked) =>
                            toggleSubscription({
                              id: subscription.id,
                              isActive: checked
                            })
                          }
                          disabled={isTogglingSubscription}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                Recent degen call notifications sent to subscribers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No degen call notifications found
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {renderNotificationStatus(notification.status)}
                          <span className="text-sm text-muted-foreground">
                            Sent to {notification.recipient_count} users
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.sent_at))} ago
                        </div>
                      </div>
                      
                      <div className="bg-muted p-3 rounded text-sm">
                        <div className="font-mono text-xs whitespace-pre-wrap line-clamp-3">
                          {notification.message_content.substring(0, 200)}
                          {notification.message_content.length > 200 && '...'}
                        </div>
                      </div>

                      {notification.error_message && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          <strong>Errors:</strong> {notification.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Degen Signals</CardTitle>
              <CardDescription>
                Manage active trading signals and manually close them if needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !signals || signals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active signals found
                </div>
              ) : (
                <div className="space-y-4">
                  {signals
                    .filter(signal => signal.status === 'active')
                    .map((signal) => (
                    <div
                      key={signal.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">{signal.ticker}</span>
                          <Badge variant={signal.status === 'active' ? 'default' : 'secondary'}>
                            {signal.status}
                          </Badge>
                          <Badge variant="outline">{signal.market}</Badge>
                          <Badge variant="outline">{signal.trade_direction}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          By {signal.analyst_name} • 
                          {signal.entry_price ? ` Entry: $${signal.entry_price}` : ' Market Entry'} •
                          Risk: {signal.risk_percentage}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created {formatDistanceToNow(new Date(signal.created_at))} ago
                          {signal.posted_to_telegram && (
                            <span className="ml-2 text-green-600">• Posted to Telegram</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {signal.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateSignalStatus(signal.id, 'closed')}
                            className="flex items-center gap-1"
                          >
                            <Ban className="h-3 w-3" />
                            Close Signal
                          </Button>
                        )}
                        {signal.status === 'closed' && (
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Clock className="h-3 w-3" />
                            Closed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}