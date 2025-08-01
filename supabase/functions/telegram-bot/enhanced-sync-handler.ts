
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { syncAndCleanupMessages } from './message-processor.ts';
import { discoverTopicsFromMessages, logSyncStatus } from './enhanced-topic-manager.ts';

export async function handleEnhancedSync(
  params: any,
  supabase: ReturnType<typeof createClient>,
  botToken: string
) {
  console.log('🚀 Starting enhanced sync with params:', JSON.stringify(params, null, 2));
  
  const syncType = params.sync_type || 'enhanced';
  const includeTopicDiscovery = params.include_topic_discovery !== false;
  const forceRefresh = params.force_refresh === true;

  // Prevent concurrent syncs of ANY type unless forced
  if (!forceRefresh) {
    const { data: runningSyncs } = await supabase
      .from('telegram_sync_status')
      .select('id, sync_type')
      .eq('status', 'running')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

    if (runningSyncs && runningSyncs.length > 0) {
      console.log(`⚠️ Sync already running (${runningSyncs[0].sync_type}), skipping ${syncType}...`);
      return { 
        synced: 0, 
        cleaned: 0, 
        errors: 0,
        topics_discovered: 0,
        message: `Sync already in progress (${runningSyncs[0].sync_type})`
      };
    }
  }

  await logSyncStatus(syncType, 'running', { 
    started_at: new Date().toISOString(),
    include_topic_discovery: includeTopicDiscovery,
    force_refresh: forceRefresh,
    params
  }, supabase);

  try {
    // Step 1: Sync and cleanup messages with limited scope
    const messageResult = await syncAndCleanupMessages(supabase, botToken, {
      batchSize: Math.min(params.batch_size || 25, 25), // Smaller batches for enhanced sync
      includeCleanup: params.include_cleanup !== false
    });

    let topicsDiscovered = 0;

    // Step 2: Topic discovery (only if no errors in message sync)
    if (includeTopicDiscovery && messageResult.errors === 0) {
      console.log('🔍 Starting topic discovery...');
      try {
        const discoveryResult = await discoverTopicsFromMessages(supabase, botToken);
        topicsDiscovered = discoveryResult.discovered;
        console.log(`✅ Topic discovery completed: ${topicsDiscovered} topics processed`);
      } catch (error) {
        console.error('❌ Topic discovery failed:', error);
        messageResult.errors++;
      }
    } else if (messageResult.errors > 0) {
      console.log('⚠️ Skipping topic discovery due to message sync errors');
    }

    const finalResult = {
      ...messageResult,
      topics_discovered: topicsDiscovered,
      sync_type: syncType,
      completed_at: new Date().toISOString()
    };

    await logSyncStatus(syncType, 'completed', finalResult, supabase);

    console.log('✅ Enhanced sync completed successfully');
    return finalResult;

  } catch (error) {
    console.error('❌ Enhanced sync failed:', error);
    
    const errorResult = {
      synced: 0,
      cleaned: 0,
      errors: 1,
      topics_discovered: 0,
      error_message: error.message,
      completed_at: new Date().toISOString()
    };

    await logSyncStatus(syncType, 'failed', errorResult, supabase);
    throw error;
  }
}
