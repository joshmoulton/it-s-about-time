import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ensureTopicExists, updateTopicActivity } from './topic-manager.ts';
import { ensureEnhancedTopicExists } from './enhanced-topic-manager.ts';

const TARGET_CHAT_ID = -1002083186778;

export async function processAndInsertMessage(
  message: any,
  supabase: ReturnType<typeof createClient>,
  botToken: string
): Promise<boolean> {
  try {
    console.log(`Processing message ${message.message_id} from ${message.from?.username || 'Unknown'}`);

    // Check if message already exists
    const { data: existingMessage } = await supabase
      .from('telegram_messages')
      .select('id')
      .eq('telegram_message_id', message.message_id)
      .eq('chat_id', message.chat.id)
      .single();

    if (existingMessage) {
      console.log(`Message ${message.message_id} already exists, skipping`);
      return true;
    }

    // Extract message details
    const messageData = {
      telegram_message_id: message.message_id,
      chat_id: message.chat.id,
      user_id: message.from?.id || null,
      username: message.from?.username || null,
      first_name: message.from?.first_name || null,
      last_name: message.from?.last_name || null,
      message_text: message.text || message.caption || null,
      message_type: getMessageType(message),
      message_thread_id: message.message_thread_id || null,
      reply_to_message_id: message.reply_to_message?.message_id || null,
      forwarded_from: message.forward_from?.username || null,
      media_url: extractMediaUrl(message),
      media_type: extractMediaType(message),
      timestamp: new Date(message.date * 1000).toISOString(),
      is_highlighted: false,
      is_hidden: false,
      likes_count: 0
    };

    // Handle topic mapping with enhanced topic manager
    let topicName = null;
    if (messageData.message_thread_id) {
      // Try enhanced topic manager first (with mappings)
      topicName = await ensureEnhancedTopicExists(
        messageData.message_thread_id,
        messageData.chat_id,
        supabase,
        botToken,
        messageData.message_text
      );
      
      // Fallback to basic topic manager if enhanced fails
      if (!topicName) {
        topicName = await ensureTopicExists(
          messageData.message_thread_id,
          messageData.chat_id,
          supabase,
          botToken,
          messageData.message_text
        );
      }
      
      messageData.topic_name = topicName;
    }

    // Insert message
    const { error: insertError } = await supabase
      .from('telegram_messages')
      .insert(messageData);

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return false;
    }

    // Update topic activity
    if (messageData.message_thread_id && topicName) {
      await updateTopicActivity(
        messageData.message_thread_id,
        topicName,
        message.date,
        supabase
      );
    }

    console.log(`✅ Successfully processed message ${message.message_id}`);
    return true;

  } catch (error) {
    console.error('Error processing message:', error);
    return false;
  }
}

export async function fetchRecentMessagesFromChat(
  supabase: ReturnType<typeof createClient>,
  botToken: string,
  limit: number = 25
): Promise<{ messages: any[], fetchedCount: number }> {
  try {
    console.log('🔄 Fetching recent messages using getChatHistory...');
    
    // Get the last message ID we have in database
    const { data: lastMessage } = await supabase
      .from('telegram_messages')
      .select('telegram_message_id')
      .eq('chat_id', TARGET_CHAT_ID)
      .order('telegram_message_id', { ascending: false })
      .limit(1)
      .single();

    const lastMessageId = lastMessage?.telegram_message_id || 0;
    console.log('📊 Last stored message ID:', lastMessageId);

    // First, try to delete any existing webhook to use getUpdates
    try {
      console.log('🗑️ Attempting to delete existing webhook...');
      const deleteWebhookUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
      const deleteResponse = await fetch(deleteWebhookUrl, { method: 'POST' });
      const deleteResult = await deleteResponse.json();
      console.log('🗑️ Webhook deletion result:', deleteResult);
    } catch (deleteError) {
      console.warn('⚠️ Could not delete webhook:', deleteError);
    }

    // Wait a moment for webhook deletion to take effect
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Now try to use getUpdates with a small offset
    const telegramUrl = `https://api.telegram.org/bot${botToken}/getUpdates`;
    const params = new URLSearchParams({
      chat_id: TARGET_CHAT_ID.toString(),
      limit: Math.min(limit, 100).toString(),
      offset: '0', // Start from beginning to get recent messages
      timeout: '10'
    });

    console.log('🚀 Calling Telegram API:', `${telegramUrl}?${params}`);
    
    const response = await fetch(`${telegramUrl}?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Telegram API error:', response.status, errorText);
      
      // If we still get webhook conflict, try alternative approach
      if (errorText.includes('webhook is active')) {
        console.log('🔄 Webhook still active, using alternative method...');
        return await fetchMessagesAlternative(supabase, botToken, limit);
      }
      
      throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.ok) {
      console.error('❌ Telegram API returned error:', data);
      
      // If webhook conflict persists, use alternative
      if (data.description?.includes('webhook is active')) {
        console.log('🔄 Webhook conflict detected, using alternative method...');
        return await fetchMessagesAlternative(supabase, botToken, limit);
      }
      
      throw new Error(`Telegram API error: ${data.description}`);
    }

    const updates = data.result || [];
    console.log(`📥 Received ${updates.length} updates from Telegram`);

    // Filter for messages from our target chat
    const messages = updates
      .filter((update: any) => update.message && update.message.chat.id === TARGET_CHAT_ID)
      .map((update: any) => update.message)
      .filter((message: any) => message.message_id > lastMessageId); // Only new messages

    console.log(`📨 Found ${messages.length} new messages from target chat`);

    return {
      messages,
      fetchedCount: messages.length
    };

  } catch (error) {
    console.error('❌ Error fetching from Telegram:', error);
    console.log('🔄 Falling back to alternative method...');
    return await fetchMessagesAlternative(supabase, botToken, limit);
  }
}

async function fetchMessagesAlternative(
  supabase: ReturnType<typeof createClient>,
  botToken: string,
  limit: number
): Promise<{ messages: any[], fetchedCount: number }> {
  try {
    console.log('🔧 Using alternative method: checking database only...');
    
    // Since we can't fetch from Telegram API due to webhook, 
    // let's just return empty array and rely on webhook for new messages
    console.log('📭 Webhook is active - new messages should come via webhook');
    console.log('🔄 Performing database cleanup only...');
    
    return {
      messages: [],
      fetchedCount: 0
    };
  } catch (error) {
    console.error('❌ Alternative method failed:', error);
    return {
      messages: [],
      fetchedCount: 0
    };
  }
}

export async function syncAndCleanupMessages(
  supabase: ReturnType<typeof createClient>,
  botToken: string,
  options: {
    batchSize?: number;
    includeCleanup?: boolean;
  } = {}
): Promise<{ synced: number; cleaned: number; errors: number }> {
  console.log('🔄 Starting message sync and cleanup...');
  
  const { batchSize = 25, includeCleanup = true } = options;
  let synced = 0;
  let cleaned = 0;
  let errors = 0;

  try {
    // STEP 1: Try to fetch new messages from Telegram API (will handle webhook conflict gracefully)
    console.log('📡 Step 1: Attempting to fetch new messages from Telegram...');
    
    const { messages: newMessages, fetchedCount } = await fetchRecentMessagesFromChat(
      supabase,
      botToken,
      batchSize
    );

    console.log(`📊 Fetch result: ${fetchedCount} new messages available`);

    // STEP 2: Process and insert new messages
    if (newMessages.length > 0) {
      console.log(`📝 Step 2: Processing ${newMessages.length} new messages...`);
      
      for (const message of newMessages) {
        try {
          const success = await processAndInsertMessage(message, supabase, botToken);
          if (success) {
            synced++;
          } else {
            errors++;
          }
        } catch (error) {
          console.error(`❌ Error processing message ${message.message_id}:`, error);
          errors++;
        }
      }

      console.log(`✅ Processed ${synced} new messages, ${errors} errors`);
    } else {
      console.log('📭 No new messages to sync (webhook may be handling real-time messages)');
    }

    // STEP 3: Cleanup (only if requested)
    if (includeCleanup) {
      console.log('🧹 Step 3: Performing database cleanup...');

      // Clean up duplicate messages (limited scope)
      const { data: duplicates } = await supabase
        .from('telegram_messages')
        .select('telegram_message_id, chat_id, id, created_at')
        .order('created_at', { ascending: false })
        .limit(500); // Limit to recent messages

      if (duplicates && duplicates.length > 0) {
        const seen = new Set();
        const toDelete = [];

        for (const msg of duplicates) {
          const key = `${msg.telegram_message_id}-${msg.chat_id}`;
          if (seen.has(key)) {
            toDelete.push(msg.id);
          } else {
            seen.add(key);
          }
        }

        if (toDelete.length > 0) {
          // Delete in smaller batches to avoid timeouts
          const deleteChunks = [];
          for (let i = 0; i < toDelete.length; i += 50) {
            deleteChunks.push(toDelete.slice(i, i + 50));
          }

          for (const chunk of deleteChunks) {
            const { error: deleteError } = await supabase
              .from('telegram_messages')
              .delete()
              .in('id', chunk);

            if (!deleteError) {
              cleaned += chunk.length;
            } else {
              console.error('Error deleting duplicates:', deleteError);
              errors++;
              break;
            }
          }

          console.log(`🧹 Cleaned up ${cleaned} duplicate messages`);
        }
      }

      // Update topic names for messages missing them (limited batch)
      const { data: messagesNeedingTopics } = await supabase
        .from('telegram_messages')
        .select('id, message_thread_id, message_text')
        .not('message_thread_id', 'is', null)
        .is('topic_name', null)
        .limit(Math.min(batchSize, 25));

      if (messagesNeedingTopics && messagesNeedingTopics.length > 0) {
        for (const message of messagesNeedingTopics) {
          try {
            const topicName = await ensureEnhancedTopicExists(
              message.message_thread_id,
              TARGET_CHAT_ID,
              supabase,
              botToken,
              message.message_text
            );

            if (topicName) {
              await supabase
                .from('telegram_messages')
                .update({ topic_name: topicName })
                .eq('id', message.id);
              
              console.log(`📝 Updated topic for message ${message.id}: ${topicName}`);
            }
          } catch (error) {
            console.error(`Error updating topic for message ${message.id}:`, error);
            errors++;
          }
        }
      }
    }

    console.log(`✅ Sync completed: ${synced} synced, ${cleaned} cleaned, ${errors} errors`);
    return { synced, cleaned, errors };

  } catch (error) {
    console.error('❌ Error in syncAndCleanupMessages:', error);
    throw error;
  }
}

function getMessageType(message: any): string {
  if (message.photo) return 'photo';
  if (message.video) return 'video';
  if (message.document) return 'document';
  if (message.audio) return 'audio';
  if (message.voice) return 'voice';
  if (message.sticker) return 'sticker';
  if (message.animation) return 'animation';
  if (message.location) return 'location';
  if (message.contact) return 'contact';
  return 'text';
}

function extractMediaUrl(message: any): string | null {
  // For now, return null as we'd need to get file info from Telegram API
  return null;
}

function extractMediaType(message: any): string | null {
  if (message.photo) return 'photo';
  if (message.video) return 'video';
  if (message.document) return 'document';
  if (message.audio) return 'audio';
  if (message.voice) return 'voice';
  return null;
}
