import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function checkSyncHealth(
  supabase: ReturnType<typeof createClient>
): Promise<{
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  metrics: any;
}> {
  console.log('🔍 Performing sync health check...');
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // Check 1: Recent message activity
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const { count: recentMessages } = await supabase
      .from('telegram_messages')
      .select('*', { count: 'exact', head: true })
      .gte('message_time', oneHourAgo.toISOString());
    
    if (recentMessages === 0) {
      issues.push('No messages received in the last hour');
      recommendations.push('Run message recovery to check for missed messages');
    }
    
    // Check 2: Topic mapping coverage
    const { count: messagesWithoutTopics } = await supabase
      .from('telegram_messages')
      .select('*', { count: 'exact', head: true })
      .not('message_thread_id', 'is', null)
      .is('topic_name', null);
    
    if ((messagesWithoutTopics || 0) > 10) {
      issues.push(`${messagesWithoutTopics} messages missing topic names`);
      recommendations.push('Run bulk topic mapping to fix missing topic names');
    }
    
    // Check 3: Recent sync status
    const { data: recentSyncs } = await supabase
      .from('telegram_sync_status')
      .select('status, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(5);
    
    const failedSyncs = recentSyncs?.filter(sync => sync.status === 'failed').length || 0;
    if (failedSyncs >= 3) {
      issues.push(`${failedSyncs} recent sync failures detected`);
      recommendations.push('Check sync logs and reset error state if needed');
    }
    
    // Check 4: Topic mapping count
    const { count: topicMappings } = await supabase
      .from('telegram_topic_mappings')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if ((topicMappings || 0) === 0) {
      issues.push('No active topic mappings found');
      recommendations.push('Create topic mappings for better organization');
    }
    
    // Check 5: Message gap detection
    const { data: lastMessages } = await supabase
      .from('telegram_messages')
      .select('telegram_message_id, message_time')
      .order('telegram_message_id', { ascending: false })
      .limit(2);
    
    if (lastMessages && lastMessages.length >= 2) {
      const gap = lastMessages[0].telegram_message_id - lastMessages[1].telegram_message_id;
      if (gap > 50) {
        issues.push(`Large message ID gap detected: ${gap} messages`);
        recommendations.push('Run message recovery to fill gaps');
      }
    }
    
    const metrics = {
      recentMessages,
      messagesWithoutTopics,
      failedSyncs,
      topicMappings,
      lastSyncTime: recentSyncs?.[0]?.created_at || null,
      healthScore: Math.max(0, 100 - (issues.length * 20))
    };
    
    const isHealthy = issues.length === 0;
    
    console.log(`🔍 Health check completed: ${isHealthy ? 'HEALTHY' : 'ISSUES FOUND'}`);
    console.log(`📊 Health score: ${metrics.healthScore}%`);
    
    return {
      isHealthy,
      issues,
      recommendations,
      metrics
    };
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return {
      isHealthy: false,
      issues: ['Health check failed to run'],
      recommendations: ['Check database connectivity and permissions'],
      metrics: { healthScore: 0 }
    };
  }
}

export async function autoRepairSyncIssues(
  supabase: ReturnType<typeof createClient>,
  botToken: string
): Promise<{
  repairsAttempted: string[];
  repairsSuccessful: string[];
  repairsFailed: string[];
}> {
  console.log('🔧 Starting automatic sync repair...');
  
  const repairsAttempted: string[] = [];
  const repairsSuccessful: string[] = [];
  const repairsFailed: string[] = [];
  
  try {
    // Repair 1: Fix missing topic names
    repairsAttempted.push('bulk_topic_mapping');
    try {
      const { handleBulkTopicMapping } = await import('./topic-management-improvements.ts');
      const result = await handleBulkTopicMapping(supabase, botToken);
      if (result.updated > 0 || result.created > 0) {
        repairsSuccessful.push(`bulk_topic_mapping: ${result.updated} updated, ${result.created} created`);
      } else {
        repairsSuccessful.push('bulk_topic_mapping: no changes needed');
      }
    } catch (error) {
      repairsFailed.push(`bulk_topic_mapping: ${error.message}`);
    }
    
    // Repair 2: Update topic activity
    repairsAttempted.push('topic_activity_update');
    try {
      const { handleTopicActivityUpdate } = await import('./topic-management-improvements.ts');
      const result = await handleTopicActivityUpdate(supabase);
      repairsSuccessful.push(`topic_activity_update: ${result.updated} topics updated`);
    } catch (error) {
      repairsFailed.push(`topic_activity_update: ${error.message}`);
    }
    
    // Repair 3: Clean up failed sync status
    repairsAttempted.push('cleanup_failed_syncs');
    try {
      const { error } = await supabase
        .from('telegram_sync_status')
        .update({ status: 'cancelled' })
        .eq('status', 'running')
        .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Older than 30 minutes
      
      if (!error) {
        repairsSuccessful.push('cleanup_failed_syncs: completed');
      } else {
        repairsFailed.push(`cleanup_failed_syncs: ${error.message}`);
      }
    } catch (error) {
      repairsFailed.push(`cleanup_failed_syncs: ${error}`);
    }
    
    console.log(`🔧 Auto-repair completed: ${repairsSuccessful.length} successful, ${repairsFailed.length} failed`);
    
    return {
      repairsAttempted,
      repairsSuccessful,
      repairsFailed
    };
    
  } catch (error) {
    console.error('❌ Auto-repair failed:', error);
    return {
      repairsAttempted,
      repairsSuccessful,
      repairsFailed: [...repairsFailed, `General failure: ${error.message}`]
    };
  }
}

export async function generateHealthReport(
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const health = await checkSyncHealth(supabase);
  
  let report = `# Telegram Sync Health Report\n\n`;
  report += `**Overall Health:** ${health.isHealthy ? '✅ HEALTHY' : '⚠️ ISSUES DETECTED'}\n`;
  report += `**Health Score:** ${health.metrics.healthScore}%\n\n`;
  
  if (health.issues.length > 0) {
    report += `## Issues Found:\n`;
    health.issues.forEach(issue => {
      report += `- ❌ ${issue}\n`;
    });
    report += `\n`;
  }
  
  if (health.recommendations.length > 0) {
    report += `## Recommendations:\n`;
    health.recommendations.forEach(rec => {
      report += `- 🔧 ${rec}\n`;
    });
    report += `\n`;
  }
  
  report += `## Metrics:\n`;
  report += `- Recent Messages (1h): ${health.metrics.recentMessages}\n`;
  report += `- Messages Without Topics: ${health.metrics.messagesWithoutTopics}\n`;
  report += `- Recent Failed Syncs: ${health.metrics.failedSyncs}\n`;
  report += `- Active Topic Mappings: ${health.metrics.topicMappings}\n`;
  report += `- Last Sync: ${health.metrics.lastSyncTime || 'Unknown'}\n`;
  
  return report;
}