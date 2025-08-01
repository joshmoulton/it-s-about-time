
import { supabase } from '@/integrations/supabase/client';

export class SyncManager {
  private syncTimer: NodeJS.Timeout | null = null;
  private lastSyncTime: Date | null = null;
  private syncInProgress = false;
  private externalBotActive = true; // Disable internal polling since Python bot is active

  startAutoSync(onSync: () => Promise<void>): void {
    // Skip auto-sync if external Python bot is active
    if (this.externalBotActive) {
      console.log('⚠️ Auto-sync disabled: External Python bot is handling Telegram polling');
      return;
    }

    // Original auto-sync logic (now disabled)
    this.syncTimer = setInterval(async () => {
      if (this.syncInProgress) {
        console.log('⏸️ Sync already in progress, skipping...');
        return;
      }

      console.log('⏰ 15-second direct API polling triggered');
      await onSync();
    }, 15 * 1000);
    
    console.log('⏰ Direct API polling started (15-second interval)');
  }

  async triggerTelegramSync(): Promise<void> {
    // Allow manual sync for emergency use, but warn about external bot
    if (this.externalBotActive) {
      console.warn('⚠️ Manual sync triggered while external Python bot is active');
    }

    if (this.syncInProgress) {
      console.log('⏸️ Sync already in progress');
      return;
    }

    this.syncInProgress = true;
    this.lastSyncTime = new Date();

    try {
      console.log('🔄 Triggering manual Telegram API sync...');
      
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'fetch_messages',
          batch_size: 50,
          include_cleanup: false,
          force_refresh: true,
          direct_api_only: true,
          manual_override: true // Flag for manual use
        }
      });

      if (error) {
        console.error('❌ Manual sync error:', error);
        throw new Error('Manual sync failed: ' + error.message);
      } else {
        console.log('✅ Manual sync completed:', data);
      }
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  cleanup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.syncInProgress = false;
    this.lastSyncTime = null;
  }

  // Method to check if external bot is active
  isExternalBotActive(): boolean {
    return this.externalBotActive;
  }

  // Method to toggle external bot status (for admin use)
  setExternalBotActive(active: boolean): void {
    this.externalBotActive = active;
    if (active && this.syncTimer) {
      this.cleanup();
      console.log('🛑 Internal Telegram polling stopped - External bot activated');
    }
  }
}
