import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, MessageCircle, Send, Bot, Info, CheckCircle } from 'lucide-react';
import { useDegenCallSubscription } from '@/hooks/useDegenCallSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Subscriber } from '@/types/auth';

interface TelegramNotificationsProps {
  subscriber: Subscriber;
}

export function TelegramNotifications({ subscriber }: TelegramNotificationsProps) {
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

    try {
      const { error } = await supabase
        .from('degen_call_subscriptions')
        .upsert({
          user_email: subscriber.email,
          telegram_user_id: chatId ? parseInt(chatId) : null,
          telegram_username: telegramUsername ? (telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`) : null,
          is_active: isSubscribed,
          subscription_tier: subscriber.subscription_tier
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
          user_email: subscriber.email
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Telegram Notifications
        </CardTitle>
        <CardDescription>
          Get your Chat ID to enable future live alerts and degen call notifications via our Telegram bot. For direct analyst message subscriptions, interact with the bot directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasStartedConversation && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Important: Start a conversation first!</strong>
              <br />
              Before setting up your Chat ID, you must first message{' '}
              <Button 
                variant="link" 
                className="h-auto p-0 text-blue-600"
                onClick={() => window.open('https://t.me/weeklywizdomaibot', '_blank')}
              >
                @weeklywizdomaibot
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
              {' '}on Telegram and send any message (like "hello"). This is required for the bot to be able to send you notifications.
            </AlertDescription>
          </Alert>
        )}

        <div className="border-t pt-4 mb-4">
          <h4 className="font-medium mb-3">How to get your Chat ID (after messaging the bot):</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>First, make sure you've messaged @weeklywizdomaibot</li>
            <li>Then message @getmyid_bot and send /start</li>
            <li>Copy the Chat ID and paste it below</li>
          </ol>
          <Button 
            variant="link" 
            className="h-auto p-0 mt-2"
            onClick={() => window.open('https://t.me/getmyid_bot', '_blank')}
          >
            <Bot className="h-4 w-4 mr-1" />
            Open @getmyid_bot
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chatId">Chat ID</Label>
            <Input
              id="chatId"
              placeholder="2076801640"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              type="number"
            />
            <p className="text-xs text-muted-foreground">
              Your unique Telegram Chat ID (obtained after messaging the bot)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegramUsername">Telegram Username (Alternative)</Label>
            <Input
              id="telegramUsername"
              placeholder="@yourusername"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your Telegram username (less reliable than Chat ID)
            </p>
          </div>

          <Button onClick={handleSaveSettings} variant="outline" className="w-full">
            Save Telegram Settings
          </Button>
        </div>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable-notifications" className="text-base font-medium">
                Enable Telegram Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable Chat ID registration for future live alerts and widgets
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
                className="border-green-300 hover:bg-green-100"
              >
                <Send className="h-4 w-4 mr-2" />
                {isTestingMessage ? 'Sending...' : 'Send Test Message'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}