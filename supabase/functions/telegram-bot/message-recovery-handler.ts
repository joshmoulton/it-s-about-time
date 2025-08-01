import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processAndInsertMessage } from './message-processor.ts';
import { discoverTopicsFromMessages } from './enhanced-topic-manager.ts';

const TARGET_CHAT_ID = -1002083186778;

export async function handleMessageRecovery(
  supabase: ReturnType<typeof createClient>,
  botToken: string,
  options: {
    hours?: number;
    forceRefresh?: boolean;
    includeTopicDiscovery?: boolean;
  } = {}
) {
  console.log('🚨 Starting message recovery process...');
  
  const { hours = 24, forceRefresh = true, includeTopicDiscovery = true } = options;
  
  try {
    // Step 1: Get the last stored message info
    const { data: lastMessageData } = await supabase
      .from('telegram_messages')
      .select('telegram_message_id, message_time')
      .eq('chat_id', TARGET_CHAT_ID)
      .order('telegram_message_id', { ascending: false })
      .limit(1)
      .single();

    const lastStoredMessageId = lastMessageData?.telegram_message_id || 0;
    const lastStoredTime = lastMessageData?.message_time;
    
    console.log(`📊 Last stored message: ID ${lastStoredMessageId}, Time: ${lastStoredTime}`);
    
    // Step 2: Calculate recovery window
    const recoveryStartTime = new Date();
    recoveryStartTime.setHours(recoveryStartTime.getHours() - hours);
    
    console.log(`🕒 Recovery window: ${hours} hours (since ${recoveryStartTime.toISOString()})`);
    
    // Step 3: Try to recover missed messages
    let recoveredMessages = 0;
    let errors = 0;
    
    try {
      // First, try to clear webhook to use getUpdates
      await clearWebhookForRecovery(botToken);
      
      // Get updates with higher limits for recovery
      const updates = await getUpdatesForRecovery(botToken, lastStoredMessageId, 100);
      
      if (updates.length > 0) {
        console.log(`📥 Found ${updates.length} potential updates for recovery`);
        
        // Filter messages from target chat and within recovery window
        const messagesToRecover = updates
          .filter((update: any) => 
            update.message && 
            update.message.chat.id === TARGET_CHAT_ID &&
            new Date(update.message.date * 1000) >= recoveryStartTime
          )
          .map((update: any) => update.message);
        
        console.log(`🎯 Found ${messagesToRecover.length} messages to recover`);
        
        // Process each message
        for (const message of messagesToRecover) {
          try {
            const success = await processAndInsertMessage(message, supabase, botToken);
            if (success) {
              recoveredMessages++;
            } else {
              errors++;
            }
          } catch (error) {
            console.error(`❌ Error recovering message ${message.message_id}:`, error);
            errors++;
          }
        }
      }
    } catch (recoveryError) {
      console.error('❌ Error during message recovery:', recoveryError);
      errors++;
    }
    
    // Step 4: Topic discovery and mapping
    let topicsDiscovered = 0;
    if (includeTopicDiscovery && recoveredMessages > 0) {
      try {
        console.log('🔍 Running topic discovery on recovered messages...');
        const topicResult = await discoverTopicsFromMessages(supabase, botToken);
        topicsDiscovered = topicResult.discovered;
        console.log(`✅ Discovered ${topicsDiscovered} topics`);
      } catch (topicError) {
        console.error('❌ Error during topic discovery:', topicError);
      }
    }
    
    // Step 5: Generate meaningful topic names for existing generic topics
    await generateMeaningfulTopicNames(supabase);
    
    const result = {
      recoveredMessages,
      errors,
      topicsDiscovered,
      recoveryWindow: `${hours} hours`,
      lastStoredMessageId,
      message: `Recovery completed: ${recoveredMessages} messages recovered, ${topicsDiscovered} topics discovered`
    };
    
    console.log('✅ Message recovery completed:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Message recovery failed:', error);
    throw error;
  }
}

async function clearWebhookForRecovery(botToken: string): Promise<void> {
  try {
    console.log('🗑️ Clearing webhook for recovery...');
    const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      method: 'POST'
    });
    const result = await response.json();
    console.log('🗑️ Webhook cleared:', result.ok);
    
    // Wait for webhook to be fully cleared
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.warn('⚠️ Could not clear webhook:', error);
  }
}

async function getUpdatesForRecovery(
  botToken: string, 
  lastMessageId: number, 
  limit: number
): Promise<any[]> {
  try {
    console.log(`📡 Fetching updates since message ID ${lastMessageId}...`);
    
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?limit=${limit}&timeout=10`
    );
    
    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
    
    return data.result || [];
  } catch (error) {
    console.error('❌ Error fetching updates:', error);
    return [];
  }
}

async function generateMeaningfulTopicNames(
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  try {
    console.log('🏷️ Generating meaningful topic names...');
    
    // Get topics with generic names that need better names
    const { data: genericTopics } = await supabase
      .from('telegram_topics')
      .select('id, telegram_topic_id, name')
      .or('name.like.Topic %,name.like.Thread %')
      .limit(10);
    
    if (!genericTopics || genericTopics.length === 0) {
      console.log('📝 No generic topics found to rename');
      return;
    }
    
    for (const topic of genericTopics) {
      try {
        // Get recent messages from this topic to analyze content
        const { data: topicMessages } = await supabase
          .from('telegram_messages')
          .select('message_text, username, first_name')
          .eq('message_thread_id', topic.telegram_topic_id)
          .not('message_text', 'is', null)
          .order('message_time', { ascending: false })
          .limit(20);
        
        if (topicMessages && topicMessages.length > 0) {
          const newName = generateTopicNameFromMessages(
            topic.telegram_topic_id, 
            topicMessages
          );
          
          if (newName !== topic.name) {
            await supabase
              .from('telegram_topics')
              .update({ 
                name: newName,
                updated_at: new Date().toISOString()
              })
              .eq('id', topic.id);
            
            console.log(`📝 Renamed topic ${topic.telegram_topic_id}: "${topic.name}" -> "${newName}"`);
          }
        }
      } catch (error) {
        console.error(`❌ Error renaming topic ${topic.telegram_topic_id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error in topic name generation:', error);
  }
}

function generateTopicNameFromMessages(
  threadId: number, 
  messages: any[]
): string {
  // Common topic patterns
  const commonTopics: Record<string, string> = {
    '25': 'Trading Discussion',
    '1898050': 'General Chat',
    '2': 'Announcements',
    '3': 'Market Analysis',
    '4': 'Portfolio Review',
    '5': 'Technical Analysis'
  };
  
  // Check for predefined topic
  if (commonTopics[threadId.toString()]) {
    return commonTopics[threadId.toString()];
  }
  
  // Analyze message content for keywords
  const allText = messages
    .map(m => m.message_text)
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  
  // Trading related keywords
  const tradingKeywords = [
    'btc', 'bitcoin', 'eth', 'ethereum', 'trade', 'trading', 'buy', 'sell',
    'pump', 'dump', 'moon', 'bear', 'bull', 'long', 'short', 'leverage',
    'profit', 'loss', 'portfolio', 'hodl', 'swing', 'scalp'
  ];
  
  // Market keywords
  const marketKeywords = [
    'market', 'price', 'chart', 'analysis', 'support', 'resistance',
    'breakout', 'trend', 'volume', 'indicators', 'technical', 'fundamental'
  ];
  
  // Social keywords
  const socialKeywords = [
    'good morning', 'gm', 'hello', 'hi', 'thanks', 'thank you',
    'congrats', 'congratulations', 'welcome', 'nice', 'great'
  ];
  
  // Count keyword matches
  const tradingCount = tradingKeywords.filter(kw => allText.includes(kw)).length;
  const marketCount = marketKeywords.filter(kw => allText.includes(kw)).length;
  const socialCount = socialKeywords.filter(kw => allText.includes(kw)).length;
  
  // Determine topic name based on content
  if (tradingCount >= 3) {
    return 'Trading Discussion';
  } else if (marketCount >= 2) {
    return 'Market Analysis';
  } else if (socialCount >= 2) {
    return 'General Chat';
  } else if (allText.includes('degen') || allText.includes('call')) {
    return 'Degen Calls';
  } else if (allText.includes('news') || allText.includes('update')) {
    return 'News & Updates';
  } else {
    // Try to get the most active user for this topic
    const userCounts: Record<string, number> = {};
    messages.forEach(m => {
      const user = m.username || m.first_name || 'Unknown';
      userCounts[user] = (userCounts[user] || 0) + 1;
    });
    
    const topUser = Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    if (topUser && topUser !== 'Unknown') {
      return `${topUser}'s Discussion`;
    }
    
    return `Topic ${threadId}`;
  }
}