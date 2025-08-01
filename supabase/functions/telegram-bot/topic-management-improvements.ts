import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleBulkTopicMapping(
  supabase: ReturnType<typeof createClient>,
  botToken: string
) {
  console.log('🔄 Starting bulk topic mapping process...');
  
  try {
    // Step 1: Get all messages with missing topic names
    const { data: messagesNeedingTopics } = await supabase
      .from('telegram_messages')
      .select('id, message_thread_id, chat_id, message_text, username, first_name')
      .not('message_thread_id', 'is', null)
      .is('topic_name', null)
      .limit(100);
    
    if (!messagesNeedingTopics || messagesNeedingTopics.length === 0) {
      console.log('✅ All messages already have topic names');
      return { updated: 0, created: 0, errors: 0 };
    }
    
    console.log(`📊 Found ${messagesNeedingTopics.length} messages needing topic names`);
    
    // Step 2: Group by thread ID
    const threadGroups: Record<number, any[]> = {};
    messagesNeedingTopics.forEach(msg => {
      if (!threadGroups[msg.message_thread_id]) {
        threadGroups[msg.message_thread_id] = [];
      }
      threadGroups[msg.message_thread_id].push(msg);
    });
    
    let updated = 0;
    let created = 0;
    let errors = 0;
    
    // Step 3: Process each thread
    for (const [threadIdStr, messages] of Object.entries(threadGroups)) {
      const threadId = parseInt(threadIdStr);
      
      try {
        // Check if we already have a mapping or topic for this thread
        let topicName = await getExistingTopicName(supabase, threadId);
        
        if (!topicName) {
          // Create new topic name based on message content
          topicName = generateIntelligentTopicName(threadId, messages);
          
          // Create topic record
          await createTopicRecord(supabase, threadId, topicName, messages);
          created++;
        }
        
        // Update all messages in this thread
        const messageIds = messages.map(m => m.id);
        const { error: updateError } = await supabase
          .from('telegram_messages')
          .update({ topic_name: topicName })
          .in('id', messageIds);
        
        if (updateError) {
          console.error(`❌ Error updating messages for thread ${threadId}:`, updateError);
          errors++;
        } else {
          updated += messageIds.length;
          console.log(`✅ Updated ${messageIds.length} messages for thread ${threadId}: "${topicName}"`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing thread ${threadId}:`, error);
        errors++;
      }
    }
    
    const result = { updated, created, errors };
    console.log('✅ Bulk topic mapping completed:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Bulk topic mapping failed:', error);
    throw error;
  }
}

async function getExistingTopicName(
  supabase: ReturnType<typeof createClient>,
  threadId: number
): Promise<string | null> {
  // Check topic mappings first
  const { data: mapping } = await supabase
    .from('telegram_topic_mappings')
    .select('custom_name')
    .eq('telegram_topic_id', threadId)
    .eq('is_active', true)
    .single();
  
  if (mapping) {
    return mapping.custom_name;
  }
  
  // Check topics table
  const { data: topic } = await supabase
    .from('telegram_topics')
    .select('name')
    .eq('telegram_topic_id', threadId)
    .single();
  
  return topic?.name || null;
}

function generateIntelligentTopicName(threadId: number, messages: any[]): string {
  // Predefined mappings for known threads
  const knownThreads: Record<string, string> = {
    '25': 'Trading & Market Discussion',
    '1898050': 'General Community Chat',
    '2': 'Announcements & News',
    '3': 'Technical Analysis',
    '4': 'Portfolio Discussion',
    '5': 'Educational Content',
    '6': 'Weekly Recap',
    '7': 'Feedback & Suggestions'
  };
  
  if (knownThreads[threadId.toString()]) {
    return knownThreads[threadId.toString()];
  }
  
  // Analyze message content
  const recentMessages = messages.slice(0, 10); // Focus on recent messages
  const textContent = recentMessages
    .map(m => m.message_text)
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  
  // Enhanced keyword analysis
  const categories = {
    'Trading Signals': [
      'long', 'short', 'buy', 'sell', 'entry', 'exit', 'tp', 'take profit',
      'sl', 'stop loss', 'position', 'leverage', 'margin', 'futures'
    ],
    'Market Analysis': [
      'analysis', 'chart', 'technical', 'support', 'resistance', 'trend',
      'breakout', 'pattern', 'indicator', 'moving average', 'rsi', 'macd'
    ],
    'Crypto Discussion': [
      'bitcoin', 'btc', 'ethereum', 'eth', 'altcoin', 'defi', 'nft',
      'blockchain', 'wallet', 'exchange', 'mining', 'staking'
    ],
    'News & Updates': [
      'news', 'update', 'announcement', 'breaking', 'report', 'article',
      'development', 'partnership', 'regulation', 'adoption'
    ],
    'Community Chat': [
      'hello', 'hi', 'good morning', 'gm', 'how', 'what', 'when', 'where',
      'thanks', 'thank you', 'welcome', 'congrats', 'nice', 'great'
    ],
    'Price Discussion': [
      'price', 'pump', 'dump', 'moon', 'crash', 'rally', 'dip', 'ath',
      'bottom', 'top', 'bull', 'bear', 'market', 'correction'
    ]
  };
  
  // Score each category
  const scores: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(categories)) {
    scores[category] = keywords.filter(keyword => textContent.includes(keyword)).length;
  }
  
  // Find the highest scoring category
  const topCategory = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (topCategory && topCategory[1] > 0) {
    return topCategory[0];
  }
  
  // Fallback: analyze user activity patterns
  const userActivity: Record<string, number> = {};
  recentMessages.forEach(msg => {
    const user = msg.username || msg.first_name || 'Unknown';
    userActivity[user] = (userActivity[user] || 0) + 1;
  });
  
  const mostActiveUser = Object.entries(userActivity)
    .sort(([,a], [,b]) => b - a)[0]?.[0];
  
  if (mostActiveUser && mostActiveUser !== 'Unknown') {
    return `${mostActiveUser}'s Discussion`;
  }
  
  // Final fallback
  return `Discussion Thread ${threadId}`;
}

async function createTopicRecord(
  supabase: ReturnType<typeof createClient>,
  threadId: number,
  topicName: string,
  messages: any[]
): Promise<void> {
  try {
    // Calculate topic statistics
    const messageCount = messages.length;
    const lastActivity = messages.reduce((latest, msg) => {
      const msgTime = new Date(msg.created_at || new Date());
      return msgTime > latest ? msgTime : latest;
    }, new Date(0));
    
    // Insert or update topic
    await supabase
      .from('telegram_topics')
      .upsert({
        telegram_topic_id: threadId,
        name: topicName,
        message_count: messageCount,
        last_activity_at: lastActivity.toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'telegram_topic_id'
      });
    
    console.log(`📝 Created/updated topic record: ${topicName} (${messageCount} messages)`);
  } catch (error) {
    console.error(`❌ Error creating topic record for ${threadId}:`, error);
  }
}

export async function handleTopicActivityUpdate(
  supabase: ReturnType<typeof createClient>
) {
  console.log('📊 Updating topic activity statistics...');
  
  try {
    // Get all topics and update their statistics
    const { data: topics } = await supabase
      .from('telegram_topics')
      .select('id, telegram_topic_id');
    
    if (!topics || topics.length === 0) {
      console.log('📭 No topics found to update');
      return { updated: 0 };
    }
    
    let updated = 0;
    
    for (const topic of topics) {
      try {
        // Count messages in this topic
        const { count: messageCount } = await supabase
          .from('telegram_messages')
          .select('*', { count: 'exact', head: true })
          .eq('message_thread_id', topic.telegram_topic_id);
        
        // Get last activity
        const { data: lastMessage } = await supabase
          .from('telegram_messages')
          .select('message_time')
          .eq('message_thread_id', topic.telegram_topic_id)
          .order('message_time', { ascending: false })
          .limit(1)
          .single();
        
        // Update topic
        await supabase
          .from('telegram_topics')
          .update({
            message_count: messageCount || 0,
            last_activity_at: lastMessage?.message_time || new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', topic.id);
        
        updated++;
      } catch (error) {
        console.error(`❌ Error updating topic ${topic.telegram_topic_id}:`, error);
      }
    }
    
    console.log(`✅ Updated ${updated} topic activity records`);
    return { updated };
    
  } catch (error) {
    console.error('❌ Topic activity update failed:', error);
    throw error;
  }
}