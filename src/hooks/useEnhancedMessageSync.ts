
import { useCallback, useRef, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncOptions {
  includeCleanup?: boolean;
  forceRefresh?: boolean;
  batchSize?: number;
  includeTopicDiscovery?: boolean;
}

interface SyncResult {
  synced: number;
  cleaned: number;
  errors: number;
}

export function useEnhancedMessageSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const lastSyncRef = useRef<Date | null>(null);
  const syncInProgressRef = useRef(false);
  const backgroundIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const externalBotActive = true; // Python bot is now active

  const syncMessages = useMutation({
    mutationFn: async (options: SyncOptions = {}): Promise<SyncResult> => {
      if (syncInProgressRef.current) {
        throw new Error('Sync already in progress');
      }

      if (externalBotActive) {
        console.warn('⚠️ Manual enhanced sync triggered while external Python bot is active');
      }

      syncInProgressRef.current = true;
      console.log('🔄 Starting enhanced message sync (manual override)...');
      
      try {
        // First sync topic names to ensure consistency
        const topicResponse = await supabase.functions.invoke('telegram-bot', {
          body: { action: 'sync_topic_names', manual_override: true }
        });

        if (topicResponse.error) {
          console.error('Topic sync error:', topicResponse.error);
        } else {
          console.log('✅ Topic names synchronized');
        }

        // Then sync and cleanup messages
        const messageResponse = await supabase.functions.invoke('telegram-bot', {
          body: { 
            action: 'fetch_messages',
            include_cleanup: options.includeCleanup ?? true,
            batch_size: options.batchSize ?? 50,
            manual_override: true // Flag for manual admin use
          }
        });

        if (messageResponse.error) {
          throw messageResponse.error;
        }

        const result = messageResponse.data || { synced: 0, cleaned: 0, errors: 0 };
        lastSyncRef.current = new Date();
        
        return result;
      } finally {
        syncInProgressRef.current = false;
      }
    },
    onSuccess: (result: SyncResult) => {
      if (!mountedRef.current) return;
      
      console.log(`✅ Enhanced sync completed: ${result.synced} synced, ${result.cleaned} cleaned, ${result.errors} errors`);
      
      // Invalidate all relevant queries with throttling
      const queries = [
        ['telegram-messages'],
        ['enhanced-telegram-messages'],
        ['chat-highlights'],
        ['telegram-topics'],
        ['telegram-stats']
      ];
      
      queries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      // Show success message only if there were significant changes
      if (result.synced > 0 || result.cleaned > 0) {
        toast({
          title: "Manual Sync Completed",
          description: `${result.synced} new messages, ${result.cleaned} cleaned up (External bot active)`,
        });
      }
    },
    onError: (error) => {
      if (!mountedRef.current) return;
      
      console.error('❌ Enhanced sync failed:', error);
      toast({
        title: "Manual Sync Failed",
        description: error.message || "Failed to sync messages from Telegram",
        variant: "destructive",
      });
    }
  });

  // Background sync function - DISABLED since external bot is active
  const backgroundSync = useCallback(async () => {
    if (externalBotActive) {
      console.log('⚠️ Background sync skipped: External Python bot is active');
      return;
    }

    if (syncInProgressRef.current || !mountedRef.current) return;
    
    const now = new Date();
    const timeSinceLastSync = lastSyncRef.current 
      ? now.getTime() - lastSyncRef.current.getTime() 
      : Infinity;
    
    // Only sync if it's been more than 60 seconds since last sync
    if (timeSinceLastSync > 60 * 1000) {
      console.log('🔄 Triggering background sync...');
      syncMessages.mutate({ includeCleanup: false, batchSize: 25 });
    }
  }, [syncMessages]);

  // Auto-sync interval - DISABLED since external bot is active
  useEffect(() => {
    mountedRef.current = true;
    
    if (!externalBotActive) {
      backgroundIntervalRef.current = setInterval(backgroundSync, 60 * 1000);
    } else {
      console.log('⚠️ Auto-sync disabled: External Python bot is active');
    }
    
    return () => {
      mountedRef.current = false;
      if (backgroundIntervalRef.current) {
        clearInterval(backgroundIntervalRef.current);
        backgroundIntervalRef.current = null;
      }
    };
  }, [backgroundSync]);

  return {
    syncMessages: (options?: SyncOptions) => syncMessages.mutate(options),
    isSyncing: syncMessages.isPending,
    lastSync: lastSyncRef.current,
    backgroundSync,
    externalBotActive
  };
}
