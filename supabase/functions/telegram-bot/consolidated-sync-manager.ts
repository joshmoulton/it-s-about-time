
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchAndProcessMessagesImproved } from './improved-message-processor.ts';

interface SyncState {
  isRunning: boolean;
  lastSyncTime: Date | null;
  consecutiveErrors: number;
  backoffDelay: number;
}

export class ConsolidatedSyncManager {
  private syncState: SyncState = {
    isRunning: false,
    lastSyncTime: null,
    consecutiveErrors: 0,
    backoffDelay: 1000 // Start with 1 second
  };

  private maxBackoffDelay = 60000; // Max 1 minute
  private maxConsecutiveErrors = 5;

  async performSync(
    supabase: ReturnType<typeof createClient>,
    botToken: string,
    options: {
      forceRefresh?: boolean;
      includeCleanup?: boolean;
      batchSize?: number;
    } = {}
  ): Promise<{ synced: number; cleaned: number; errors: number; message?: string }> {
    
    // Database-level sync prevention (check for ANY running sync)
    if (!options.forceRefresh) {
      const { data: runningSyncs } = await supabase
        .from('telegram_sync_status')
        .select('id, sync_type')
        .eq('status', 'running')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

      if (runningSyncs && runningSyncs.length > 0) {
        console.log(`⚠️ Sync already running (${runningSyncs[0].sync_type}), skipping consolidated sync...`);
        return { 
          synced: 0, 
          cleaned: 0, 
          errors: 0, 
          message: `Sync already in progress (${runningSyncs[0].sync_type})` 
        };
      }
    }
    
    // Also check in-memory state as secondary protection
    if (this.syncState.isRunning && !options.forceRefresh) {
      console.log('⏸️ Sync already in progress (in-memory), skipping...');
      return { 
        synced: 0, 
        cleaned: 0, 
        errors: 0, 
        message: 'Sync already in progress' 
      };
    }

    // Check if we should backoff due to consecutive errors
    if (this.syncState.consecutiveErrors >= this.maxConsecutiveErrors) {
      const timeSinceLastSync = this.syncState.lastSyncTime 
        ? Date.now() - this.syncState.lastSyncTime.getTime()
        : Infinity;
        
      if (timeSinceLastSync < this.syncState.backoffDelay) {
        console.log(`⚠️ Backing off due to ${this.syncState.consecutiveErrors} consecutive errors`);
        return { 
          synced: 0, 
          cleaned: 0, 
          errors: 0, 
          message: `Backing off due to consecutive errors. Next sync in ${Math.round((this.syncState.backoffDelay - timeSinceLastSync) / 1000)}s` 
        };
      }
    }

    this.syncState.isRunning = true;

    try {
      console.log('🔄 Starting consolidated sync operation...');
      
      // Log sync status to database
      await this.logSyncStatus('running', null, supabase);

      const result = await fetchAndProcessMessagesImproved(supabase, botToken, {
        batchSize: options.batchSize || 25,
        includeCleanup: options.includeCleanup || false
      });

      // Success - reset error counters
      this.syncState.consecutiveErrors = 0;
      this.syncState.backoffDelay = 1000;
      this.syncState.lastSyncTime = new Date();

      // Log successful sync
      await this.logSyncStatus('completed', result, supabase);

      console.log('✅ Consolidated sync completed successfully');
      return result;

    } catch (error) {
      console.error('❌ Consolidated sync failed:', error);
      
      // Increment error counter and calculate backoff
      this.syncState.consecutiveErrors++;
      this.syncState.backoffDelay = Math.min(
        this.syncState.backoffDelay * 2,
        this.maxBackoffDelay
      );
      this.syncState.lastSyncTime = new Date();

      // Log failed sync
      await this.logSyncStatus('failed', { error: error.message }, supabase);

      return { 
        synced: 0, 
        cleaned: 0, 
        errors: 1, 
        message: error.message 
      };

    } finally {
      this.syncState.isRunning = false;
    }
  }

  private async logSyncStatus(
    status: string,
    metadata: any,
    supabase: ReturnType<typeof createClient>
  ): Promise<void> {
    try {
      await supabase
        .from('telegram_sync_status')
        .insert({
          sync_type: 'consolidated_fetch',
          status,
          metadata: metadata || {},
          messages_synced: metadata?.synced || 0,
          messages_deleted: metadata?.cleaned || 0,
          errors_count: metadata?.errors || 0
        });
    } catch (error) {
      console.warn('⚠️ Could not log sync status:', error);
    }
  }

  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  resetErrorState(): void {
    this.syncState.consecutiveErrors = 0;
    this.syncState.backoffDelay = 1000;
    console.log('🔄 Sync error state reset');
  }

  // Force stop any running sync (emergency use)
  forceStop(): void {
    this.syncState.isRunning = false;
    console.log('🛑 Sync forcefully stopped');
  }
}

// Export singleton instance
export const syncManager = new ConsolidatedSyncManager();
