import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useTelegramWebhookSetup() {
  const [isSettingWebhook, setIsSettingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<{ success: boolean; message: string } | null>(null);

  const setupWebhook = async () => {
    setIsSettingWebhook(true);
    setWebhookStatus(null);

    try {
      const webhookUrl = `https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/telegram-bot`;
      
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: {
          action: 'set_webhook',
          webhook_url: webhookUrl
        }
      });

      if (error) {
        throw error;
      }

      setWebhookStatus({
        success: true,
        message: data.message || 'Webhook configured successfully'
      });

      return data;
    } catch (error: any) {
      console.error('Error setting webhook:', error);
      setWebhookStatus({
        success: false,
        message: error.message || 'Failed to set webhook'
      });
      throw error;
    } finally {
      setIsSettingWebhook(false);
    }
  };

  const testBot = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: {
          action: 'enhanced_sync',
          force_refresh: true,
          batch_size: 10,
          include_cleanup: true
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error testing bot:', error);
      throw error;
    }
  };

  return {
    setupWebhook,
    testBot,
    isSettingWebhook,
    webhookStatus
  };
}