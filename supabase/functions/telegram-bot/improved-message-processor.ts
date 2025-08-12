import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleAnalystCallDetection } from './enhanced-message-sync-handler.ts';

const TARGET_CHAT_ID = -1002083186778;

export async function processAndInsertMessageImproved(
  message: any,
  supabase: ReturnType<typeof createClient>,
  botToken: string
): Promise<boolean> {
  try {
    console.log(`🔄 Processing message ${message.message_id} from ${message.from?.username || 'Unknown'}`);

    // Check if message already exists using the new function
    const { data: existingMessage } = await supabase
      .from('telegram_messages')
      .select('id')
      .eq('telegram_message_id', message.message_id)
      .eq('chat_id', message.chat.id)
      .maybeSingle();

    if (existingMessage) {
      console.log(`✅ Message ${message.message_id} already exists, skipping`);
      return true;
    }

    // Handle topic mapping first
    let topicName = null;
    if (message.message_thread_id) {
      topicName = await ensureTopicExistsImproved(
        message.message_thread_id,
        message.chat.id,
        supabase,
        message.text || message.caption
      );
    }

    // Use the new VOLATILE database function for insertion
    const { data: messageId, error: insertError } = await supabase.rpc('insert_telegram_message', {
      p_telegram_message_id: message.message_id,
      p_chat_id: message.chat.id,
      p_user_id: message.from?.id || null,
      p_username: message.from?.username || null,
      p_first_name: message.from?.first_name || null,
      p_last_name: message.from?.last_name || null,
      p_message_text: message.text || message.caption || null,
      p_message_type: getMessageType(message),
      p_message_thread_id: message.message_thread_id || null,
      p_reply_to_message_id: message.reply_to_message?.message_id || null,
      p_forwarded_from: message.forward_from?.username || null,
      p_media_url: extractMediaUrl(message),
      p_media_type: extractMediaType(message),
      p_timestamp: new Date(message.date * 1000).toISOString(),
      p_topic_name: topicName
    });

    if (insertError) {
      console.error('❌ Error inserting message via function:', insertError);
      return false;
    }

    // Update topic activity if needed
    if (message.message_thread_id && topicName) {
      await supabase.rpc('update_topic_activity', {
        p_topic_id: message.message_thread_id,
        p_topic_name: topicName,
        p_last_activity: new Date(message.date * 1000).toISOString()
      });
    }

    // Check for analyst call detection if message has text
    if (message.text || message.caption) {
      try {
        const detectionResult = await handleAnalystCallDetection(
          supabase,
          message.text || message.caption,
          message.chat.id.toString(),
          message.message_id.toString(),
          message.from?.username
        );
        
        if (detectionResult.detected) {
          console.log(`🎯 Analyst call detected in message ${message.message_id}:`, detectionResult);
        }
      } catch (detectionError) {
        console.error('⚠️ Error in analyst call detection:', detectionError);
        // Don't fail the entire message processing if detection fails
      }
    }

    console.log(`✅ Successfully processed message ${message.message_id} with ID: ${messageId}`);
    return true;

  } catch (error) {
    console.error('❌ Error processing message:', error);
    return false;
  }
}

async function ensureTopicExistsImproved(
  threadId: number,
  chatId: number,
  supabase: ReturnType<typeof createClient>,
  messageText?: string
): Promise<string | null> {
  try {
    // Check for custom mapping first
    const { data: mapping } = await supabase
      .from('telegram_topic_mappings')
      .select('custom_name')
      .eq('telegram_topic_id', threadId)
      .eq('is_active', true)
      .maybeSingle();

    if (mapping) {
      console.log(`📝 Found custom mapping: ${mapping.custom_name}`);
      return mapping.custom_name;
    }

    // Check if topic exists in telegram_topics
    const { data: existingTopic } = await supabase
      .from('telegram_topics')
      .select('name')
      .eq('telegram_topic_id', threadId)
      .maybeSingle();

    if (existingTopic) {
      return existingTopic.name;
    }

    // Create a default topic name
    const defaultName = `Topic ${threadId}`;
    
    // Insert new topic
    const { error: topicError } = await supabase
      .from('telegram_topics')
      .insert({
        telegram_topic_id: threadId,
        name: defaultName,
        last_activity_at: new Date().toISOString(),
        message_count: 1
      });

    if (topicError) {
      console.error('❌ Error creating topic:', topicError);
      return defaultName; // Return the name even if insert fails
    }

    console.log(`✅ Created new topic: ${defaultName}`);
    return defaultName;

  } catch (error) {
    console.error('❌ Error in ensureTopicExistsImproved:', error);
    return `Topic ${threadId}`; // Fallback
  }
}

export async function fetchAndProcessMessagesImproved(
  supabase: ReturnType<typeof createClient>,
  botToken: string,
  options: {
    batchSize?: number;
    includeCleanup?: boolean;
  } = {}
): Promise<{ synced: number; cleaned: number; errors: number }> {
  console.log('🔄 Starting improved message sync...');
  
  const { batchSize = 25, includeCleanup = false } = options;
  let synced = 0;
  let cleaned = 0;
  let errors = 0;

  try {
    // Get the last message ID we have in database
    const { data: lastMessage } = await supabase
      .from('telegram_messages')
      .select('telegram_message_id')
      .eq('chat_id', TARGET_CHAT_ID)
      .order('telegram_message_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastMessageId = lastMessage?.telegram_message_id || 0;
    console.log('📊 Last stored message ID:', lastMessageId);

    // Try to delete existing webhook first
    try {
      const deleteWebhookUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
      await fetch(deleteWebhookUrl, { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for deletion
    } catch (deleteError) {
      console.warn('⚠️ Could not delete webhook:', deleteError);
    }

    // Fetch updates from Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/getUpdates`;
    const params = new URLSearchParams({
      chat_id: TARGET_CHAT_ID.toString(),
      limit: Math.min(batchSize, 100).toString(),
      offset: '0',
      timeout: '10'
    });

    console.log('🚀 Fetching from Telegram API...');
    const response = await fetch(`${telegramUrl}?${params}`);
    
    if (!response.ok) {
      // Handle specific Telegram API errors
      if (response.status === 409) {
        console.log('⚠️ Telegram API 409 conflict - likely due to concurrent requests or rate limiting');
        return { synced: 0, cleaned: 0, errors: 1 };
      }
      
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('❌ Telegram API error:', response.status, errorText);
      throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Telegram API returned error: ${data.description}`);
    }

    const updates = data.result || [];
    console.log(`📥 Received ${updates.length} updates from Telegram`);

    // Filter for new messages from our target chat
    const newMessages = updates
      .filter((update: any) => update.message && update.message.chat.id === TARGET_CHAT_ID)
      .map((update: any) => update.message)
      .filter((message: any) => message.message_id > lastMessageId);

    console.log(`📨 Found ${newMessages.length} new messages to process`);

    // Process messages with improved error handling
    for (const message of newMessages) {
      try {
        const success = await processAndInsertMessageImproved(message, supabase, botToken);
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

    // Cleanup phase (only if requested and no errors)
    if (includeCleanup && errors === 0) {
      console.log('🧹 Performing cleanup...');
      
      // Remove duplicates using a more efficient approach
      const { data: duplicates, error: dupError } = await supabase
        .rpc('find_duplicate_messages')
        .limit(100);

      if (!dupError && duplicates && duplicates.length > 0) {
        const { error: deleteError } = await supabase
          .from('telegram_messages')
          .delete()
          .in('id', duplicates);

        if (!deleteError) {
          cleaned = duplicates.length;
          console.log(`🧹 Cleaned up ${cleaned} duplicate messages`);
        }
      }
    }

    console.log(`✅ Sync completed: ${synced} synced, ${cleaned} cleaned, ${errors} errors`);
    return { synced, cleaned, errors };

  } catch (error) {
    console.error('❌ Error in fetchAndProcessMessagesImproved:', error);
    return { synced, cleaned, errors: errors + 1 };
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
  return null; // For now, return null as we'd need to get file info from Telegram API
}

function extractMediaType(message: any): string | null {
  if (message.photo) return 'photo';
  if (message.video) return 'video';
  if (message.document) return 'document';
  if (message.audio) return 'audio';
  if (message.voice) return 'voice';
  return null;
}
