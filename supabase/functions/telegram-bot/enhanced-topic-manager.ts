import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function createTopicMapping(
  telegramTopicId: number,
  customName: string,
  supabase: ReturnType<typeof createClient>
): Promise<boolean> {
  try {
    console.log(`Creating topic mapping: ${telegramTopicId} -> ${customName}`);
    
    const { error } = await supabase
      .from('telegram_topic_mappings')
      .insert({
        telegram_topic_id: telegramTopicId,
        custom_name: customName
      });

    if (error) {
      console.error('Error creating topic mapping:', error);
      return false;
    }

    // Also ensure the topic exists in telegram_topics
    await supabase
      .from('telegram_topics')
      .upsert({
        telegram_topic_id: telegramTopicId,
        name: customName,
        is_active: true,
        display_order: telegramTopicId <= 10 ? telegramTopicId : 999,
        message_count: 0,
        last_activity_at: new Date().toISOString()
      }, {
        onConflict: 'telegram_topic_id'
      });

    console.log(`✅ Created topic mapping: ${telegramTopicId} -> ${customName}`);
    return true;
  } catch (error) {
    console.error('Error in createTopicMapping:', error);
    return false;
  }
}

export async function getTopicMappings(
  supabase: ReturnType<typeof createClient>
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('telegram_topic_mappings')
      .select('*')
      .eq('is_active', true)
      .order('telegram_topic_id');

    if (error) {
      console.error('Error fetching topic mappings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTopicMappings:', error);
    return [];
  }
}

export async function ensureEnhancedTopicExists(
  messageThreadId: number,
  chatId: number,
  supabase: ReturnType<typeof createClient>,
  botToken: string,
  messageText?: string
): Promise<string | null> {
  if (!messageThreadId) return null;

  try {
    console.log(`Checking enhanced topic for thread ID: ${messageThreadId}`);
    
    // First check if we have a custom mapping
    const { data: mapping } = await supabase
      .from('telegram_topic_mappings')
      .select('custom_name')
      .eq('telegram_topic_id', messageThreadId)
      .eq('is_active', true)
      .single();

    if (mapping) {
      console.log(`Found custom mapping: ${mapping.custom_name}`);
      return mapping.custom_name;
    }

    // Check if topic exists in telegram_topics
    const { data: existingTopic } = await supabase
      .from('telegram_topics')
      .select('name')
      .eq('telegram_topic_id', messageThreadId)
      .single();

    if (existingTopic) {
      return existingTopic.name;
    }

    // Create new topic with enhanced naming
    const topicName = generateTopicName(messageThreadId, messageText);

    const { error: insertError } = await supabase
      .from('telegram_topics')
      .insert({
        telegram_topic_id: messageThreadId,
        name: topicName,
        description: `Topic thread ${messageThreadId}`,
        last_activity_at: new Date().toISOString(),
        message_count: 0,
        is_active: true,
        display_order: messageThreadId <= 10 ? messageThreadId : 999
      });

    if (insertError) {
      console.error('Error creating topic:', insertError);
      return `Topic ${messageThreadId}`;
    }

    console.log(`✅ Created new topic: ${topicName}`);
    return topicName;
  } catch (error) {
    console.error('Error ensuring topic exists:', error);
    return `Topic ${messageThreadId}`;
  }
}

export async function discoverTopicsFromMessages(
  supabase: ReturnType<typeof createClient>,
  botToken: string
): Promise<{ discovered: number; errors: number }> {
  try {
    console.log('🔍 Starting topic discovery from recent messages...');
    
    // Get unique thread IDs from recent messages (limited scope)
    const { data: threadIds } = await supabase
      .from('telegram_messages')
      .select('message_thread_id, message_text')
      .not('message_thread_id', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(50); // Reduced from 100 to prevent timeouts

    if (!threadIds || threadIds.length === 0) {
      console.log('No threaded messages found for discovery');
      return { discovered: 0, errors: 0 };
    }

    const uniqueThreads = new Map();
    threadIds.forEach(msg => {
      if (msg.message_thread_id && !uniqueThreads.has(msg.message_thread_id)) {
        uniqueThreads.set(msg.message_thread_id, msg.message_text);
      }
    });

    console.log(`Found ${uniqueThreads.size} unique threads to process`);

    let discovered = 0;
    let errors = 0;

    for (const [threadId, sampleText] of uniqueThreads) {
      try {
        const topicName = await ensureEnhancedTopicExists(
          threadId,
          -1002083186778, // TARGET_CHAT_ID - Updated to new group ID
          supabase,
          botToken,
          sampleText
        );

        if (topicName) {
          // Log the discovery
          await supabase
            .from('telegram_topic_discovery')
            .upsert({
              telegram_topic_id: threadId,
              discovered_name: topicName,
              confidence_score: 0.8,
              discovery_method: 'message_analysis',
              message_samples: [sampleText].filter(Boolean)
            }, {
              onConflict: 'telegram_topic_id'
            });

          discovered++;
          console.log(`Discovered topic: ${topicName} for thread ${threadId}`);
        }
      } catch (error) {
        console.error(`Error discovering topic ${threadId}:`, error);
        errors++;
      }
    }

    console.log(`✅ Topic discovery completed: ${discovered} discovered, ${errors} errors`);
    return { discovered, errors };
  } catch (error) {
    console.error('Error in topic discovery:', error);
    return { discovered: 0, errors: 1 };
  }
}

export async function logSyncStatus(
  syncType: string,
  status: string,
  metadata: any,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  try {
    await supabase
      .from('telegram_sync_status')
      .insert({
        sync_type: syncType,
        status: status,
        messages_processed: metadata.synced || 0,
        messages_synced: metadata.synced || 0,
        messages_deleted: metadata.cleaned || 0,
        errors_count: metadata.errors || 0,
        metadata: metadata
      });
  } catch (error) {
    console.error('Error logging sync status:', error);
  }
}

function generateTopicName(threadId: number, messageText?: string): string {
  // Enhanced topic name generation based on thread ID and context
  const commonTopics = {
    2: 'General Discussion',
    3: 'Trading Signals',
    4: 'Market Analysis',
    5: 'News & Updates',
    6: 'Technical Analysis',
    7: 'Portfolio Discussion',
    8: 'Educational Content',
    9: 'Off Topic',
    10: 'Announcements',
    11: 'DeFi Discussion',
    12: 'NFT Talk',
    13: 'Altcoin Analysis',
    14: 'Bitcoin Discussion',
    15: 'Ethereum Chat'
  };

  if (commonTopics[threadId]) {
    return commonTopics[threadId];
  }

  // If we have message text, try to infer topic from content
  if (messageText) {
    const text = messageText.toLowerCase();
    if (text.includes('bitcoin') || text.includes('btc')) return `Bitcoin Discussion ${threadId}`;
    if (text.includes('ethereum') || text.includes('eth')) return `Ethereum Chat ${threadId}`;
    if (text.includes('defi')) return `DeFi Discussion ${threadId}`;
    if (text.includes('nft')) return `NFT Talk ${threadId}`;
    if (text.includes('trading') || text.includes('trade')) return `Trading Discussion ${threadId}`;
    if (text.includes('news') || text.includes('update')) return `News & Updates ${threadId}`;
  }

  return `Discussion Thread ${threadId}`;
}
