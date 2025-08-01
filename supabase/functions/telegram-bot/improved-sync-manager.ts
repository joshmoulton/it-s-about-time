import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchAndProcessMessagesImproved } from './improved-message-processor.ts';

interface SyncState {
  isRunning: boolean;
  lastSyncTime: Date | null;
  consecutiveErrors: number;
  backoffDelay: number;
  currentJobId: string | null;
  cancellationRequested: boolean;
}

export class ImprovedSyncManager {
  private syncState: SyncState = {
    isRunning: false,
    lastSyncTime: null,
    consecutiveErrors: 0,
    backoffDelay: 1000, // Start with 1 second
    currentJobId: null,
    cancellationRequested: false
  };

  private maxBackoffDelay = 60000; // Max 1 minute
  private maxConsecutiveErrors = 5;
  private processId: string;

  constructor() {
    // Generate unique process ID for this function instance
    this.processId = `process-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async performSync(
    supabase: ReturnType<typeof createClient>,
    botToken: string,
    options: {
      forceRefresh?: boolean;
      includeCleanup?: boolean;
      batchSize?: number;
    } = {}
  ): Promise<{ synced: number; cleaned: number; errors: number; message?: string; jobId?: string }> {
    
    // Generate unique job ID
    const jobId = crypto.randomUUID();
    
    try {
      // Attempt to create a new sync job atomically
      const { data: newJob, error: insertError } = await supabase
        .from('telegram_sync_status')
        .insert({
          sync_type: 'consolidated_fetch',
          status: 'running',
          started_at: new Date().toISOString(),
          job_id: jobId,
          process_id: this.processId,
          metadata: {
            options,
            started_by: this.processId
          }
        })
        .select()
        .single();

      // If insert failed due to unique constraint, another job is already running
      if (insertError) {
        if (insertError.code === '23P01') { // Exclusion constraint violation
          console.log('⚠️ Another sync job is already running, skipping...');
          return { 
            synced: 0, 
            cleaned: 0, 
            errors: 0, 
            message: 'Another sync job is already running' 
          };
        }
        throw insertError;
      }

      // Update internal state
      this.syncState.isRunning = true;
      this.syncState.currentJobId = jobId;
      this.syncState.cancellationRequested = false;

      console.log(`🔄 Starting consolidated sync operation with job ID: ${jobId}`);

      // Create cancellation checker that polls database
      const cancellationChecker = setInterval(async () => {
        try {
          const { data: jobStatus } = await supabase
            .from('telegram_sync_status')
            .select('cancellation_requested')
            .eq('job_id', jobId)
            .single();

          if (jobStatus?.cancellation_requested) {
            console.log('🛑 Cancellation requested for job:', jobId);
            this.syncState.cancellationRequested = true;
          }
        } catch (error) {
          console.warn('⚠️ Could not check cancellation status:', error);
        }
      }, 5000); // Check every 5 seconds

      try {
        // Perform the actual sync with cancellation support
        const result = await this.performSyncWithCancellation(
          supabase, 
          botToken, 
          jobId,
          {
            batchSize: options.batchSize || 25,
            includeCleanup: options.includeCleanup || false
          }
        );

        // Clear the cancellation checker
        clearInterval(cancellationChecker);

        // Check if cancelled
        if (this.syncState.cancellationRequested) {
          await this.updateJobStatus(supabase, jobId, 'failed', {
            ...result,
            cancelled: true,
            cancellation_reason: 'Cancelled by user request'
          });

          return {
            ...result,
            message: 'Sync was cancelled'
          };
        }

        // Success - reset error counters
        this.syncState.consecutiveErrors = 0;
        this.syncState.backoffDelay = 1000;
        this.syncState.lastSyncTime = new Date();

        // Update job status to completed
        await this.updateJobStatus(supabase, jobId, 'completed', result);

        console.log('✅ Consolidated sync completed successfully');
        return { ...result, jobId };

      } catch (error) {
        clearInterval(cancellationChecker);
        throw error;
      }

    } catch (error) {
      console.error('❌ Consolidated sync failed:', error);
      
      // Increment error counter and calculate backoff
      this.syncState.consecutiveErrors++;
      this.syncState.backoffDelay = Math.min(
        this.syncState.backoffDelay * 2,
        this.maxBackoffDelay
      );
      this.syncState.lastSyncTime = new Date();

      // Update job status to failed
      if (jobId) {
        await this.updateJobStatus(supabase, jobId, 'failed', { 
          error: error.message,
          stack: error.stack 
        });
      }

      return { 
        synced: 0, 
        cleaned: 0, 
        errors: 1, 
        message: error.message,
        jobId 
      };

    } finally {
      this.syncState.isRunning = false;
      this.syncState.currentJobId = null;
      this.syncState.cancellationRequested = false;
    }
  }

  private async performSyncWithCancellation(
    supabase: ReturnType<typeof createClient>,
    botToken: string,
    jobId: string,
    options: { batchSize: number; includeCleanup: boolean }
  ): Promise<{ synced: number; cleaned: number; errors: number }> {
    
    // This is a simplified version - in a real implementation, you'd need to modify
    // fetchAndProcessMessagesImproved to support cancellation
    return await fetchAndProcessMessagesImproved(supabase, botToken, options);
  }

  private async updateJobStatus(
    supabase: ReturnType<typeof createClient>,
    jobId: string,
    status: string,
    metadata: any
  ): Promise<void> {
    try {
      await supabase
        .from('telegram_sync_status')
        .update({
          status,
          metadata: metadata || {},
          messages_synced: metadata?.synced || 0,
          messages_deleted: metadata?.cleaned || 0,
          errors_count: metadata?.errors || 0,
          updated_at: new Date().toISOString()
        })
        .eq('job_id', jobId);
    } catch (error) {
      console.warn('⚠️ Could not update job status:', error);
    }
  }

  async requestCancellation(
    supabase: ReturnType<typeof createClient>,
    jobId?: string
  ): Promise<{ success: boolean; message: string }> {
    const targetJobId = jobId || this.syncState.currentJobId;
    
    if (!targetJobId) {
      return {
        success: false,
        message: 'No job ID provided and no job currently running'
      };
    }

    try {
      const { data } = await supabase.rpc('request_sync_cancellation', {
        p_job_id: targetJobId
      });

      return {
        success: data?.success || false,
        message: data?.message || 'Unknown response'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async forceStopAllJobs(
    supabase: ReturnType<typeof createClient>
  ): Promise<{ success: boolean; stoppedJobs: number; message: string }> {
    try {
      const { data } = await supabase.rpc('force_stop_all_sync_jobs');
      
      // Also update internal state
      this.syncState.isRunning = false;
      this.syncState.currentJobId = null;
      this.syncState.cancellationRequested = false;

      return {
        success: data?.success || false,
        stoppedJobs: data?.stopped_jobs || 0,
        message: 'All sync jobs have been forcefully stopped'
      };
    } catch (error) {
      return {
        success: false,
        stoppedJobs: 0,
        message: error.message
      };
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

  // Check if cancellation was requested
  isCancellationRequested(): boolean {
    return this.syncState.cancellationRequested;
  }
}

// Export singleton instance
export const improvedSyncManager = new ImprovedSyncManager();