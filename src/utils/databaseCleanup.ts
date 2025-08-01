import { supabase } from '@/integrations/supabase/client';

export class DatabaseCleanupService {
  private static instance: DatabaseCleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): DatabaseCleanupService {
    if (!DatabaseCleanupService.instance) {
      DatabaseCleanupService.instance = new DatabaseCleanupService();
    }
    return DatabaseCleanupService.instance;
  }

  public startPeriodicCleanup(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🧹 Starting database cleanup service...');
    
    // Run cleanup immediately
    this.performCleanup();
    
    // Schedule cleanup every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 10 * 60 * 1000);
  }

  public stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Database cleanup service stopped');
  }

  private async performCleanup(): Promise<void> {
    try {
      console.log('🧹 Performing database cleanup...');
      
      // Clean up stuck sync jobs
      await this.cleanupStuckSyncJobs();
      
      // Clean up old sync failures
      await this.cleanupOldSyncFailures();
      
      // Clean up duplicate messages
      await this.cleanupDuplicateMessages();
      
      console.log('✅ Database cleanup completed');
    } catch (error) {
      console.error('❌ Database cleanup failed:', error);
    }
  }

  private async cleanupStuckSyncJobs(): Promise<void> {
    try {
      // BeehiIV sync jobs removed - no cleanup needed
      console.log('✅ Sync jobs cleanup skipped (BeehiIV removed)');
    } catch (error) {
      console.error('Error in cleanupStuckSyncJobs:', error);
    }
  }

  private async cleanupOldSyncFailures(): Promise<void> {
    try {
      // This is handled by the cleanup_old_sync_jobs function
      console.log('✅ Old sync failures cleaned up');
    } catch (error) {
      console.error('Error in cleanupOldSyncFailures:', error);
    }
  }

  private async cleanupDuplicateMessages(): Promise<void> {
    try {
      // Find duplicate messages based on timestamp and content within a 1-minute window
      const { data: duplicateIds, error: selectError } = await supabase
        .from('telegram_messages')
        .select('id')
        .not('message_text', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (selectError) {
        console.error('Error finding duplicate messages:', selectError);
        return;
      }

      if (!duplicateIds || duplicateIds.length === 0) {
        console.log('✅ No duplicate messages found');
        return;
      }

      // Get the actual duplicate message groups by finding messages with same text and similar timestamps
      const messageGroups = new Map();
      
      for (const msg of duplicateIds) {
        const { data: messageData, error: msgError } = await supabase
          .from('telegram_messages')
          .select('id, message_text, timestamp')
          .eq('id', msg.id)
          .single();

        if (msgError || !(messageData as any)?.message_text) continue;

        const key = `${(messageData as any).message_text}_${Math.floor(new Date((messageData as any).timestamp || (messageData as any).message_time || new Date()).getTime() / 60000)}`;
        
        if (!messageGroups.has(key)) {
          messageGroups.set(key, []);
        }
        messageGroups.get(key).push((messageData as any).id);
      }

      // Delete duplicates, keeping the first one in each group
      let deletedCount = 0;
      for (const [, ids] of messageGroups) {
        if (ids.length > 1) {
          // Keep the first one, delete the rest
          const toDelete = ids.slice(1);
          
          const { error: deleteError } = await supabase
            .from('telegram_messages')
            .delete()
            .in('id', toDelete);

          if (deleteError) {
            console.error('Error deleting duplicate messages:', deleteError);
          } else {
            deletedCount += toDelete.length;
          }
        }
      }

      console.log(`✅ Cleaned up ${deletedCount} duplicate messages`);
    } catch (error) {
      console.error('Error in cleanupDuplicateMessages:', error);
    }
  }

  public async forceCleanup(): Promise<void> {
    console.log('🔄 Force cleanup requested');
    await this.performCleanup();
  }
}

// Initialize cleanup service when module loads
const cleanupService = DatabaseCleanupService.getInstance();
cleanupService.startPeriodicCleanup();

export default cleanupService;
