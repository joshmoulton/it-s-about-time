
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { syncAndCleanupMessages } from './message-processor.ts';
import { logSyncStatus } from './enhanced-topic-manager.ts';

export async function handleFetchMessages(
  params: any,
  supabase: ReturnType<typeof createClient>,
  botToken: string
) {
  console.log('🔄 Starting message sync with params:', JSON.stringify(params, null, 2));
  
  // Database-level sync prevention (check for ANY running sync)
  if (!params.force_refresh) {
    const { data: runningSyncs } = await supabase
      .from('telegram_sync_status')
      .select('id, sync_type')
      .eq('status', 'running')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

    if (runningSyncs && runningSyncs.length > 0) {
      console.log(`⚠️ Sync already running (${runningSyncs[0].sync_type}), skipping fetch messages...`);
      return { 
        synced: 0, 
        cleaned: 0, 
        errors: 0,
        message: `Sync already in progress (${runningSyncs[0].sync_type})`
      };
    }
  } else {
    console.log('🚀 Force refresh requested, bypassing running sync check');
  }

  await logSyncStatus('fetch_messages', 'running', { 
    started_at: new Date().toISOString(),
    force_refresh: params.force_refresh || false,
    params 
  }, supabase);
  
  try {
    const result = await syncAndCleanupMessages(supabase, botToken, {
      batchSize: Math.min(params.batch_size || 50, 50), // Cap at 50
      includeCleanup: params.include_cleanup ?? true
    });
    
    await logSyncStatus('fetch_messages', 'completed', {
      ...result,
      completed_at: new Date().toISOString()
    }, supabase);
    
    return result;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    
    await logSyncStatus('fetch_messages', 'failed', {
      synced: 0,
      cleaned: 0,
      errors: 1,
      error_message: error.message,
      completed_at: new Date().toISOString()
    }, supabase);
    
    throw error;
  }
}
