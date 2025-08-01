
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncResult {
  synced: number;
  cleaned: number;
  errors: number;
  message?: string;
}

interface SyncState {
  isRunning: boolean;
  lastSyncTime: Date | null;
  consecutiveErrors: number;
  backoffDelay: number;
}

export function useConsolidatedTelegramSync() {
  const { toast } = useToast();

  // Main sync mutation
  const syncMutation = useMutation({
    mutationFn: async (options: {
      forceRefresh?: boolean;
      includeCleanup?: boolean;
      batchSize?: number;
    } = {}): Promise<SyncResult> => {
      console.log('🔄 Starting manual sync from frontend...');
      console.warn('⚠️ Manual sync triggered while external Python bot is active');
      
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'enhanced_sync',
          force_refresh: options.forceRefresh || false,
          include_cleanup: options.includeCleanup || false,
          batch_size: options.batchSize || 25,
          manual_override: true // Flag for manual admin use
        }
      });

      if (error) {
        throw new Error(error.message || 'Sync failed');
      }

      return data;
    },
    onSuccess: (result: SyncResult) => {
      console.log('✅ Manual sync completed:', result);
      
      if (result.synced > 0 || result.cleaned > 0) {
        toast({
          title: "Manual Sync Completed",
          description: `${result.synced} new messages, ${result.cleaned} cleaned up (External bot active)`,
        });
      } else if (result.message) {
        toast({
          title: "Manual Sync Status",
          description: result.message + " (External bot active)",
          variant: result.errors > 0 ? "destructive" : "default",
        });
      }
    },
    onError: (error: Error) => {
      console.error('❌ Manual sync failed:', error);
      toast({
        title: "Manual Sync Failed",
        description: error.message || "Failed to sync messages from Telegram",
        variant: "destructive",
      });
    }
  });

  // Get sync status query - DISABLED automatic polling since Python bot is active
  const syncStatusQuery = useQuery({
    queryKey: ['telegram-sync-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { action: 'sync_status' }
      });

      if (error) throw error;
      return data;
    },
    enabled: false, // Disable automatic polling
    refetchInterval: false, // No automatic refetch
  });

  // Reset sync errors
  const resetSyncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { action: 'sync_reset', manual_override: true }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sync Reset",
        description: "Sync error state has been reset successfully",
      });
      syncStatusQuery.refetch();
    }
  });

  // Force stop sync
  const forceStopMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { action: 'force_stop', manual_override: true }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sync Stopped",
        description: "Sync operation has been forcefully stopped",
      });
      syncStatusQuery.refetch();
    }
  });

  return {
    // Main sync function - now manual only
    sync: (options?: {
      forceRefresh?: boolean;
      includeCleanup?: boolean;
      batchSize?: number;
    }) => syncMutation.mutate(options),
    
    // Sync state
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
    lastSyncResult: syncMutation.data,
    
    // Status monitoring - now manual only
    syncStatus: syncStatusQuery.data,
    isLoadingStatus: syncStatusQuery.isLoading,
    refetchStatus: () => syncStatusQuery.refetch(),
    
    // Control functions
    resetErrors: () => resetSyncMutation.mutate(),
    forceStop: () => forceStopMutation.mutate(),
    
    // Reset states
    isResetting: resetSyncMutation.isPending,
    isStopping: forceStopMutation.isPending,
    
    // External bot status
    externalBotActive: true
  };
}
