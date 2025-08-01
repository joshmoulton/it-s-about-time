
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createTopicMapping, getTopicMappings, ensureEnhancedTopicExists } from './enhanced-topic-manager.ts';

export async function handleCreateTopicMapping(
  params: any,
  supabase: ReturnType<typeof createClient>
) {
  console.log('📝 Creating topic mapping...');
  
  const success = await createTopicMapping(
    params.telegram_topic_id,
    params.custom_name,
    supabase
  );
  
  return { success };
}

export async function handleGetTopicMappings(
  supabase: ReturnType<typeof createClient>
) {
  console.log('📋 Fetching topic mappings...');
  
  const mappings = await getTopicMappings(supabase);
  
  return { mappings };
}

export async function handleSyncTopicNames(
  supabase: ReturnType<typeof createClient>,
  botToken: string
) {
  console.log('🏷️ Syncing topic names...');
  
  // Get all messages with thread IDs but missing topic names
  const { data: messagesNeedingTopics } = await supabase
    .from('telegram_messages')
    .select('id, message_thread_id, chat_id, message_text')
    .not('message_thread_id', 'is', null)
    .is('topic_name', null)
    .limit(100);
  
  let updated = 0;
  
  if (messagesNeedingTopics) {
    for (const message of messagesNeedingTopics) {
      const topicName = await ensureEnhancedTopicExists(
        message.message_thread_id,
        message.chat_id,
        supabase,
        botToken,
        message.message_text
      );
      
      if (topicName) {
        await supabase
          .from('telegram_messages')
          .update({ topic_name: topicName })
          .eq('id', message.id);
        
        updated++;
      }
    }
  }
  
  return { updated_topics: updated };
}
