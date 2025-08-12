
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { improvedSyncManager } from './improved-sync-manager.ts';
import { AnalystCallDetector } from './analyst-call-detector.ts';

export async function handleEnhancedMessageSync(
  params: any,
  supabase: ReturnType<typeof createClient>,
  botToken: string
) {
  console.log('🔄 Starting enhanced message sync with params:', JSON.stringify(params, null, 2));
  
  try {
    const result = await improvedSyncManager.performSync(supabase, botToken, {
      forceRefresh: params.force_refresh || false,
      includeCleanup: params.include_cleanup || false,
      batchSize: Math.min(params.batch_size || 25, 50) // Cap at 50
    });
    
    console.log('✅ Enhanced sync result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Enhanced sync failed:', error);
    
    return {
      synced: 0,
      cleaned: 0,
      errors: 1,
      message: error.message
    };
  }
}

export async function handleSyncStatusRequest(
  supabase: ReturnType<typeof createClient>
) {
  const syncState = improvedSyncManager.getSyncState();
  
  // Get recent sync history
  const { data: recentSyncs } = await supabase
    .from('telegram_sync_status')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    currentState: syncState,
    recentSyncs: recentSyncs || []
  };
}

export async function handleSyncReset(
  supabase: ReturnType<typeof createClient>
) {
  improvedSyncManager.resetErrorState();
  
  return {
    message: 'Sync error state reset successfully',
    newState: improvedSyncManager.getSyncState()
  };
}

export async function handleForceStop(
  supabase: ReturnType<typeof createClient>
) {
  console.log('🛑 Force stopping all sync jobs...');
  
  const result = await improvedSyncManager.forceStopAllJobs(supabase);
  
  return {
    message: result.message,
    stoppedJobs: result.stoppedJobs,
    success: result.success,
    newState: improvedSyncManager.getSyncState()
  };
}

export async function handleCancellationRequest(
  supabase: ReturnType<typeof createClient>,
  jobId?: string
) {
  console.log('🛑 Requesting cancellation for job:', jobId || 'current');
  
  const result = await improvedSyncManager.requestCancellation(supabase, jobId);
  
  return {
    success: result.success,
    message: result.message,
    newState: improvedSyncManager.getSyncState()
  };
}

export async function handleAnalystCallDetection(
  supabase: ReturnType<typeof createClient>,
  messageText: string,
  chatId: string,
  telegramMessageId: string,
  username?: string
) {
  console.log('🔍 Handling analyst call detection for message:', telegramMessageId);
  
  try {
    const detector = new AnalystCallDetector(supabase);
    const detection = await detector.detectAnalystCall(messageText, chatId, telegramMessageId, username);
    
    if (!detection) {
      return { detected: false };
    }

    console.log('✅ Analyst call detected, processing...');
    
    // Process the detection (create analyst signal)
    const signalId = await detector.processDetection(detection.patternId);
    
    if (signalId) {
      // Trigger degen call notification
      const notificationSent = await detector.triggerDegenCallNotification(signalId);
      
      return {
        detected: true,
        signalId,
        confidenceScore: detection.confidenceScore,
        notificationSent,
        requiresReview: detection.requiresReview
      };
    }

    return {
      detected: true,
      processed: false,
      confidenceScore: detection.confidenceScore,
      requiresReview: detection.requiresReview
    };

  } catch (error) {
    console.error('❌ Error in analyst call detection:', error);
    return {
      detected: false,
      error: error.message
    };
  }
}

export async function handleDetectionReview(
  supabase: ReturnType<typeof createClient>,
  detectionId: string,
  approved: boolean,
  reviewedBy?: string
) {
  console.log('👥 Reviewing detection:', detectionId, 'Approved:', approved);
  
  try {
    if (approved) {
      const detector = new AnalystCallDetector(supabase);
      const signalId = await detector.processDetection(detectionId);
      
      if (signalId) {
        const notificationSent = await detector.triggerDegenCallNotification(signalId);
        
        // Update detection as reviewed and processed
        await supabase
          .from('analyst_call_detections')
          .update({
            requires_review: false,
            reviewed_by: reviewedBy,
            reviewed_at: new Date().toISOString(),
            auto_processed: true
          })
          .eq('id', detectionId);

        return {
          success: true,
          signalId,
          notificationSent
        };
      }
    } else {
      // Mark as reviewed but not processed
      await supabase
        .from('analyst_call_detections')
        .update({
          requires_review: false,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          auto_processed: false
        })
        .eq('id', detectionId);

      return {
        success: true,
        rejected: true
      };
    }

  } catch (error) {
    console.error('❌ Error reviewing detection:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
