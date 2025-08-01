import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, BellOff, Globe, UserCheck, Settings2, X, Users } from 'lucide-react';
import { useDegenCallSubscription } from '@/hooks/useDegenCallSubscription';
import { useAnalystSubscriptions } from '@/hooks/useAnalystSubscriptions';

interface DegenCallSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DegenCallSettingsModal({ isOpen, onClose }: DegenCallSettingsModalProps) {
  const {
    subscription,
    isSubscribed,
    subscriptionLoading,
    toggleSubscription,
    isToggling
  } = useDegenCallSubscription();

  const {
    analystsWithSubscriptionStatus,
    toggleAnalystSubscription,
    analystsLoading,
    subscriptionsLoading,
    isToggling: isAnalystToggling
  } = useAnalystSubscriptions();

  const [telegramUsername, setTelegramUsername] = useState(subscription?.telegram_username || '');

  const handleToggleSubscription = async () => {
    if (!isSubscribed && telegramUsername) {
      await toggleSubscription({
        telegramUsername: telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`
      });
    } else {
      await toggleSubscription();
    }
  };

  const subscribedAnalysts = analystsWithSubscriptionStatus.filter(a => a.isSubscribed);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Degen Call Alert Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Status Overview */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Current Subscription Status</h3>
            
            {/* Global Subscription */}
            <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">All Analysts</h4>
                  <p className="text-xs text-muted-foreground">
                    {isSubscribed ? 'Receiving all degen call alerts' : 'Not subscribed to global alerts'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={isSubscribed ? "default" : "secondary"}>
                  {isSubscribed ? 'Active' : 'Inactive'}
                </Badge>
                {isSubscribed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleSubscription}
                    disabled={isToggling}
                    className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Unsubscribe
                  </Button>
                ) : (
                  <Button
                    onClick={handleToggleSubscription}
                    disabled={subscriptionLoading || isToggling}
                    size="sm"
                  >
                    <Bell className="w-4 h-4 mr-1" />
                    Subscribe
                  </Button>
                )}
              </div>
            </div>

            {/* Individual Analyst Subscriptions Summary */}
            {subscribedAnalysts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Individual Analyst Subscriptions:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subscribedAnalysts.map((analyst) => (
                    <div 
                      key={analyst.info.id} 
                      className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/30 rounded border"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {analyst.info.display_name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm">{analyst.info.display_name}</span>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Analyst Management */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCheck className="w-4 h-4" />
                <span>Choose specific analysts to receive alerts from:</span>
              </div>
              
              {analystsLoading || subscriptionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {analystsWithSubscriptionStatus.map((analyst) => (
                    <div 
                      key={analyst.info.id} 
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {analyst.info.display_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{analyst.info.display_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {analyst.info.description || 'Professional trading analyst'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={analyst.isSubscribed ? "default" : "secondary"}
                        >
                          {analyst.isSubscribed ? 'Subscribed' : 'Not subscribed'}
                        </Badge>
                        <Switch
                          checked={analyst.isSubscribed}
                          onCheckedChange={() => toggleAnalystSubscription(analyst.info.name, {
                            telegramUsername: telegramUsername || undefined
                          })}
                          disabled={isAnalystToggling}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {analystsWithSubscriptionStatus.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No analysts available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}