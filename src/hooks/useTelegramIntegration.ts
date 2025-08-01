
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TelegramStats {
  totalMessages: number;
  messagesThisWeek: number;
  activeUsers: number;
  topContributors: Array<{
    username: string;
    messageCount: number;
  }>;
}

export function useTelegramIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const externalBotActive = true; // Python bot is now active

  // Fetch Telegram statistics - MANUAL ONLY since external bot is active
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['telegram-stats'],
    queryFn: async (): Promise<TelegramStats> => {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { action: 'get_stats' }
      });

      if (error) throw error;
      return data;
    },
    staleTime: Infinity,
    refetchInterval: false, // Disabled - external bot is active
    refetchOnWindowFocus: false,
    enabled: false, // Must be manually triggered
  });

  // Auto-sync messages in background - DISABLED since Python bot is active
  const { data: autoSyncData } = useQuery({
    queryKey: ['telegram-auto-sync'],
    queryFn: async () => {
      if (externalBotActive) {
        console.log('⚠️ Auto-sync disabled: External Python bot is active');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { action: 'enhanced_sync', forceRefresh: false }
      });

      if (error) {
        return null;
      }
      
      return data;
    },
    enabled: false, // Disable automatic sync
    staleTime: Infinity,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Sync messages mutation - manual only
  const syncMessagesMutation = useMutation({
    mutationFn: async () => {
      if (externalBotActive) {
        console.warn('⚠️ Manual sync triggered while external Python bot is active');
      }

      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { action: 'fetch_messages', manual_override: true }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Manual Messages Sync",
        description: `Successfully processed ${data.processed_count} new messages (External bot active)`,
      });
      queryClient.invalidateQueries({ queryKey: ['telegram-messages'] });
      queryClient.invalidateQueries({ queryKey: ['chat-highlights'] });
      queryClient.invalidateQueries({ queryKey: ['telegram-stats'] });
    },
    onError: (error) => {
      console.error('Manual sync error:', error);
      toast({
        title: "Manual Sync Failed",
        description: "Failed to sync messages from Telegram",
        variant: "destructive",
      });
    }
  });

  // Set webhook mutation
  const setWebhookMutation = useMutation({
    mutationFn: async (webhookUrl: string) => {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'set_webhook',
          webhook_url: webhookUrl,
          manual_override: true
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Webhook Updated",
        description: "Telegram webhook has been configured successfully",
      });
    },
    onError: (error) => {
      console.error('Webhook error:', error);
      toast({
        title: "Webhook Failed",
        description: "Failed to configure Telegram webhook",
        variant: "destructive",
      });
    }
  });

  // Sync topic names mutation - manual only
  const syncTopicNamesMutation = useMutation({
    mutationFn: async () => {
      if (externalBotActive) {
        console.warn('⚠️ Manual topic sync triggered while external Python bot is active');
      }

      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { action: 'sync_topic_names', manual_override: true }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Manual Topic Names Sync",
        description: `Updated ${data.updated} topic names with ${data.errors} errors (External bot active)`,
      });
      queryClient.invalidateQueries({ queryKey: ['telegram-topics'] });
      queryClient.invalidateQueries({ queryKey: ['telegram-messages'] });
    },
    onError: (error) => {
      console.error('Manual topic sync error:', error);
      toast({
        title: "Manual Topic Sync Failed",
        description: "Failed to sync topic names from Telegram",
        variant: "destructive",
      });
    }
  });

  return {
    stats,
    statsLoading,
    syncMessages: () => syncMessagesMutation.mutate(),
    syncTopicNames: () => syncTopicNamesMutation.mutate(),
    setWebhook: (url: string) => setWebhookMutation.mutate(url),
    isSyncing: syncMessagesMutation.isPending,
    isSyncingTopics: syncTopicNamesMutation.isPending,
    isSettingWebhook: setWebhookMutation.isPending,
    externalBotActive
  };
}
