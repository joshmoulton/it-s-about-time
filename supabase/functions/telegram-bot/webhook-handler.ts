
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processAndInsertMessageImproved } from './improved-message-processor.ts';

// Function to trigger sentiment analysis
async function triggerSentimentAnalysis(
  supabase: ReturnType<typeof createClient>,
  messageText: string,
  telegramMessageId: string
): Promise<void> {
  try {
    console.log(`🧠 Starting sentiment analysis for message: ${telegramMessageId}`);
    
    const { data, error } = await supabase.functions.invoke('telegram-sentiment-analyzer', {
      body: {
        messageText: messageText,
        messageId: telegramMessageId,
        batchMode: false
      }
    });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Sentiment analysis completed for message ${telegramMessageId}:`, data);
  } catch (error) {
    console.error(`❌ Sentiment analysis error for message ${telegramMessageId}:`, error);
    throw error;
  }
}

export async function handleWebhook(
  params: any,
  supabase: ReturnType<typeof createClient>,
  botToken: string
) {
  console.log('📨 Processing webhook...');
  const update = params.update;
  
  if (!update) {
    throw new Error('No update data');
  }

  const message = update.message || update.channel_post || update.edited_message || update.edited_channel_post;
  
  if (message && message.chat.id === -1002083186778) { // Updated to new group ID
    console.log(`📬 Processing message ${message.message_id} from webhook`);
    
    try {
      // Use improved message processor that includes analyst call detection
      const success = await processAndInsertMessageImproved(message, supabase, botToken);
      
      if (success) {
        console.log(`✅ Successfully processed webhook message ${message.message_id}`);
        
        // Trigger sentiment analysis in background (non-blocking)
        if (message.text && message.text.trim().length > 0) {
          console.log(`🧠 Triggering sentiment analysis for message ${message.message_id}`);
          triggerSentimentAnalysis(supabase, message.text, message.message_id.toString())
            .catch(error => {
              console.error(`❌ Sentiment analysis failed for message ${message.message_id}:`, error);
            });
        }
      } else {
        console.log(`⚠️ Failed to process webhook message ${message.message_id}`);
      }
    } catch (error) {
      console.error(`❌ Error processing webhook message ${message.message_id}:`, error);
    }
  }

  return { success: true };
}
