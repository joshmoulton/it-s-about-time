import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageCircle, ExternalLink, Bot, Info, CheckCircle, Send } from 'lucide-react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { useDegenCallSubscription } from '@/hooks/useDegenCallSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function TelegramSettingsSection() {
  const { currentUser } = useEnhancedAuth();
  const [chatId, setChatId] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [isTestingMessage, setIsTestingMessage] = useState(false);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  
  const {
    subscription,
    isSubscribed,
    toggleSubscription,
    isToggling
  } = useDegenCallSubscription();

  // Load existing data
  useEffect(() => {
    if (subscription) {
      setChatId(subscription.telegram_user_id?.toString() || '');
      setTelegramUsername(subscription.telegram_username || '');
      setHasStartedConversation(!!subscription.telegram_user_id);
    }
  }, [subscription]);

  const handleEnableNotifications = async (enabled: boolean) => {
    console.log('Handling notification enable/disable:', enabled);
    
    if (enabled && !chatId && !telegramUsername) {
      toast.error('Please enter your Chat ID or Telegram username first');
      return;
    }

    const telegramData = {
      telegramUserId: chatId ? parseInt(chatId) : undefined,
      telegramUsername: telegramUsername ? (telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`) : undefined
    };

    try {
      await toggleSubscription(telegramData);
      console.log('Notification toggle completed successfully');
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!chatId && !telegramUsername) {
      toast.error('Please enter either your Chat ID or Telegram username');
      return;
    }

    if (!currentUser?.email) {
      toast.error('User email not found');
      return;
    }

    try {
      const { error } = await supabase
        .from('degen_call_subscriptions')
        .upsert({
          user_email: currentUser.email,
          telegram_user_id: chatId ? parseInt(chatId) : null,
          telegram_username: telegramUsername ? (telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`) : null,
          is_active: isSubscribed,
          subscription_tier: currentUser.subscription_tier
        }, {
          onConflict: 'user_email'
        });

      if (error) throw error;

      toast.success('Telegram settings saved successfully!');
      setHasStartedConversation(!!chatId);
    } catch (error) {
      console.error('Error saving telegram settings:', error);
      toast.error('Failed to save settings. Please try again.');
    }
  };

  const handleSendTestMessage = async () => {
    if (!isSubscribed) {
      toast.error('Please enable Telegram notifications first');
      return;
    }

    if (!chatId) {
      toast.error('Chat ID is required to send test messages');
      return;
    }

    setIsTestingMessage(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: {
          action: 'send_test_message',
          chat_id: parseInt(chatId),
          user_email: currentUser?.email
        }
      });

      if (error) throw error;

      toast.success('Test message sent! Check your Telegram.');
    } catch (error) {
      console.error('Error sending test message:', error);
      toast.error('Failed to send test message. Please check your Chat ID.');
    } finally {
      setIsTestingMessage(false);
    }
  };

  const hasAccess = currentUser?.subscription_tier === 'paid' || currentUser?.subscription_tier === 'premium';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-white">Telegram Notifications</h2>
        <p className="text-muted-foreground">
          Receive degen call alerts and updates via Telegram bot
        </p>
      </div>

      {!hasAccess ? (
        <div className="text-center p-6 border-2 border-dashed border-muted rounded-lg">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
          <p className="text-muted-foreground mb-4">
            Telegram integration is available for paid and premium subscribers
          </p>
          <Button asChild>
            <a href="https://whop.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </a>
          </Button>
        </div>
      ) : (
        <>
          {!hasStartedConversation && (
            <Alert className="border-brand-navy/20 bg-brand-navy/5 dark:bg-brand-navy/10 dark:border-brand-navy/30">
              <Info className="h-4 w-4 text-brand-navy dark:text-brand-navy-light" />
              <AlertDescription className="text-brand-navy/80 dark:text-brand-navy-light/80">
                <strong>Important: Start a conversation first!</strong>
                <br />
                Before setting up your Chat ID, you must first message{' '}
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-brand-navy dark:text-brand-navy-light underline"
                  onClick={() => window.open('https://t.me/newsletteralertbot', '_blank')}
                >
                  @newsletteralertbot
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
                {' '}on Telegram and send any message (like "hello"). This is required for the bot to be able to send you notifications.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-3 text-white">How to get your Chat ID (after messaging the bot):</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside mb-4">
              <li>First, make sure you've messaged @newsletteralertbot</li>
              <li>Then message @getmyid_bot and send /start</li>
              <li>Copy the Chat ID and paste it below</li>
            </ol>
            <Button 
              variant="outline" 
              size="sm"
              className="text-white"
              onClick={() => window.open('https://t.me/getmyid_bot', '_blank')}
            >
              <Bot className="h-4 w-4 mr-2" />
              Open @getmyid_bot
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chatId" className="text-base font-medium text-white">Chat ID</Label>
              <Input
                id="chatId"
                placeholder="2076801640"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                type="number"
                className="h-11 text-foreground"
              />
              <p className="text-sm text-muted-foreground">
                Your unique Telegram Chat ID (obtained after messaging the bot)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegramUsername" className="text-base font-medium text-white">Telegram Username (Alternative)</Label>
              <Input
                id="telegramUsername"
                placeholder="@iamjoshmoulton"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                className="h-11 text-foreground"
              />
              <p className="text-sm text-muted-foreground">
                Your Telegram username (less reliable than Chat ID)
              </p>
            </div>

            <Button onClick={handleSaveSettings} className="w-full h-11">
              Save Telegram Settings
            </Button>
          </div>

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enable-notifications" className="text-base font-medium text-white">
                  Enable Telegram Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts via Telegram bot
                </p>
              </div>
              <Switch
                id="enable-notifications"
                checked={isSubscribed}
                onCheckedChange={handleEnableNotifications}
                disabled={isToggling}
              />
            </div>

            {isSubscribed && hasStartedConversation && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Notifications Enabled</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-300 mb-3">
                  You're all set to receive degen call alerts via Telegram!
                </p>
                <Button 
                  onClick={handleSendTestMessage} 
                  disabled={isTestingMessage}
                  variant="outline"
                  size="sm"
                  className="border-green-300 hover:bg-green-100 dark:border-green-700 dark:hover:bg-green-900/30"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isTestingMessage ? 'Sending...' : 'Send Test Message'}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}