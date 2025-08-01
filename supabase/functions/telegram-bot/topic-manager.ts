
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function getTopicInfoFromTelegram(
  chatId: number,
  messageThreadId: number,
  botToken: string
): Promise<string | null> {
  try {
    // For now, we'll use a mapping approach since Telegram doesn't provide direct topic name access
    return null;
  } catch (error) {
    console.error('Error fetching topic info from Telegram:', error);
    return null;
  }
}

export async function ensureTopicExists(
  messageThreadId: number | null, 
  chatId: number,
  supabase: ReturnType<typeof createClient>,
  botToken?: string,
  messageText?: string
): Promise<string | null> {
  if (!messageThreadId) return null;

  try {
    console.log(`Ensuring topic exists for thread ID: ${messageThreadId}`);
    
    // Check if topic already exists
    const { data: existingTopic } = await supabase
      .from('telegram_topics')
      .select('name')
      .eq('telegram_topic_id', messageThreadId)
      .single();

    if (existingTopic) {
      console.log(`Found existing topic: ${existingTopic.name}`);
      return existingTopic.name;
    }

    // Create a more specific topic name based on thread ID
    let topicName: string;
    
    // Map common thread IDs to better names
    switch (messageThreadId) {
      case 2:
        topicName = 'General Discussion';
        break;
      case 3:
        topicName = 'Trading Signals';
        break;
      case 4:
        topicName = 'Market Analysis';
        break;
      case 5:
        topicName = 'News & Updates';
        break;
      case 6:
        topicName = 'Technical Analysis';
        break;
      case 7:
        topicName = 'Portfolio Discussion';
        break;
      case 8:
        topicName = 'Educational Content';
        break;
      case 9:
        topicName = 'Off Topic';
        break;
      case 10:
        topicName = 'Announcements';
        break;
      default:
        topicName = `Discussion Thread ${messageThreadId}`;
    }

    console.log(`Creating new topic: ${topicName} for thread ${messageThreadId}`);

    // Create new topic
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

    console.log(`Successfully created topic: ${topicName}`);
    return topicName;
  } catch (error) {
    console.error('Error ensuring topic exists:', error);
    return `Topic ${messageThreadId}`;
  }
}

export async function updateTopicActivity(
  messageThreadId: number,
  topicName: string,
  messageDate: number,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  if (!messageThreadId || !topicName) return;

  try {
    console.log(`Updating topic activity for ${topicName} (${messageThreadId})`);
    
    const { error } = await supabase
      .from('telegram_topics')
      .update({
        last_activity_at: new Date(messageDate * 1000).toISOString(),
        message_count: supabase.sql`message_count + 1`
      })
      .eq('telegram_topic_id', messageThreadId);

    if (error) {
      console.error('Error updating topic activity:', error);
    } else {
      console.log(`Successfully updated activity for topic ${topicName}`);
    }
  } catch (error) {
    console.error('Error updating topic activity:', error);
  }
}

export async function syncExistingTopicNames(
  supabase: ReturnType<typeof createClient>,
  botToken: string
): Promise<{ updated: number; errors: number }> {
  try {
    console.log('Starting comprehensive topic sync...');
    
    // First, update existing topics with proper names
    const topicMappings = [
      { id: 2, name: 'General Discussion' },
      { id: 3, name: 'Trading Signals' },
      { id: 4, name: 'Market Analysis' },
      { id: 5, name: 'News & Updates' },
      { id: 6, name: 'Technical Analysis' },
      { id: 7, name: 'Portfolio Discussion' },
      { id: 8, name: 'Educational Content' },
      { id: 9, name: 'Off Topic' },
      { id: 10, name: 'Announcements' }
    ];

    let updated = 0;
    let errors = 0;

    // Update topic names in telegram_topics table
    for (const mapping of topicMappings) {
      try {
        const { error } = await supabase
          .from('telegram_topics')
          .update({ name: mapping.name })
          .eq('telegram_topic_id', mapping.id);

        if (error) {
          console.error(`Error updating topic ${mapping.id}:`, error);
          errors++;
        } else {
          console.log(`Updated topic ${mapping.id} to ${mapping.name}`);
          updated++;
        }
      } catch (error) {
        console.error(`Error processing topic ${mapping.id}:`, error);
        errors++;
      }
    }

    // Now update all messages with the correct topic names
    for (const mapping of topicMappings) {
      try {
        const { error } = await supabase
          .from('telegram_messages')
          .update({ topic_name: mapping.name })
          .eq('message_thread_id', mapping.id);

        if (error) {
          console.error(`Error updating messages for topic ${mapping.id}:`, error);
          errors++;
        } else {
          console.log(`Updated messages for topic ${mapping.id} with name ${mapping.name}`);
        }
      } catch (error) {
        console.error(`Error updating messages for topic ${mapping.id}:`, error);
        errors++;
      }
    }

    console.log(`Topic sync completed: ${updated} topics updated, ${errors} errors`);
    return { updated, errors };
  } catch (error) {
    console.error('Error in syncExistingTopicNames:', error);
    return { updated: 0, errors: 1 };
  }
}

async function getTopicNameForThread(
  threadId: number,
  supabase: ReturnType<typeof createClient>
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('telegram_topics')
      .select('name')
      .eq('telegram_topic_id', threadId)
      .single();

    if (error || !data) {
      console.error(`No topic found for thread ${threadId}`);
      return null;
    }

    return data.name;
  } catch (error) {
    console.error(`Error getting topic name for thread ${threadId}:`, error);
    return null;
  }
}
