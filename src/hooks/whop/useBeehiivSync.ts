
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { withTimeout, showSyncCompletionToast } from './utils';
import { SyncProgress, WhopSyncResult } from './types';

export const useBeehiivSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

  const syncBeehiivSubscribers = async (forceFullSync: boolean = false): Promise<WhopSyncResult | undefined> => {
    setIsLoading(true);
    setSyncProgress(null);
    
    try {
      console.log(`🔄 Starting Beehiiv CHUNKED sync${forceFullSync ? ' (force full)' : ''}...`);
      
      const syncType = forceFullSync ? 'Full chunked sync' : 'Chunked sync';
      toast.info(`${syncType} started - Processing large dataset in chunks...`);
      
      const { data, error } = await withTimeout(
        supabase.functions.invoke('beehiiv-auth', {
          body: { action: forceFullSync ? 'force_full_sync' : 'sync_subscribers' }
        }),
        15000 // Shorter timeout since we're starting a background job
      );

      if (error) {
        console.error('🚨 Beehiiv chunked sync error:', error);
        throw error;
      }

      console.log('✅ Beehiiv chunked sync started:', data);
      
      if (data.job_id) {
        // Start polling for progress
        startProgressPolling(data.job_id);
        
        toast.success(`Chunked sync started: Processing ${data.total_records} subscribers in ${data.total_pages} pages`, {
          duration: 5000
        });
      }
      
      return data;
    } catch (error) {
      console.error('💥 Error starting chunked sync:', error);
      
      const isTimeout = error.message.includes('timed out');
      const isRateLimit = error.message.includes('rate limit') || error.message.includes('429');
      
      let errorMessage = 'Failed to start sync process';
      if (isTimeout) {
        errorMessage = 'Sync startup timed out. Please try again.';
      } else if (isRateLimit) {
        errorMessage = 'Rate limit reached. Please try again in a few minutes.';
      }
      
      toast.error(errorMessage, { duration: 8000 });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const startProgressPolling = (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('beehiiv-auth', {
          body: { action: 'get_sync_status', job_id: jobId }
        });

        if (error) {
          console.error('Error polling sync status:', error);
          clearInterval(pollInterval);
          setSyncProgress(null);
          return;
        }

        console.log('📊 Sync progress:', data);
        setSyncProgress(data);

        // Check if job is completed
        if (data.job?.status === 'completed') {
          clearInterval(pollInterval);
          setSyncProgress(null);
          showSyncCompletionToast(data.job);
        } else if (data.job?.status === 'failed') {
          clearInterval(pollInterval);
          setSyncProgress(null);
          toast.error(`Sync failed: ${data.job.error_message}`, { duration: 10000 });
        } else if (data.job?.status === 'paused') {
          clearInterval(pollInterval);
          setSyncProgress(null);
          toast.warning('Sync paused due to timeout - you can resume it manually', { duration: 8000 });
        }

      } catch (pollError) {
        console.error('Error during progress polling:', pollError);
        clearInterval(pollInterval);
        setSyncProgress(null);
      }
    }, 3000); // Poll every 3 seconds

    // Clear polling after 10 minutes maximum
    setTimeout(() => {
      clearInterval(pollInterval);
      setSyncProgress(null);
    }, 600000);
  };

  const continueSyncJob = async (jobId: string, fromPage?: number): Promise<WhopSyncResult | undefined> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('beehiiv-auth', {
        body: { action: 'continue_sync', job_id: jobId, page: fromPage }
      });

      if (error) throw error;

      toast.success('Sync job resumed');
      
      if (data.success) {
        startProgressPolling(jobId);
      }
      
      return data;
    } catch (error) {
      console.error('Error continuing sync job:', error);
      toast.error('Failed to resume sync job');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailedItems = async (jobId: string): Promise<WhopSyncResult | undefined> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('beehiiv-auth', {
        body: { action: 'retry_failed_items', job_id: jobId }
      });

      if (error) throw error;

      toast.success(`Retried ${data.retried} items: ${data.successes} succeeded, ${data.failures} failed`);
      return data;
    } catch (error) {
      console.error('Error retrying failed items:', error);
      toast.error('Failed to retry failed items');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    syncProgress,
    syncBeehiivSubscribers,
    continueSyncJob,
    retryFailedItems
  };
};
