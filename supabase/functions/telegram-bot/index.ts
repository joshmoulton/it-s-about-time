
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';
import { handleEnhancedMessageSync, handleSyncStatusRequest, handleSyncReset, handleForceStop, handleCancellationRequest, handleDetectionReview } from './enhanced-message-sync-handler.ts';
import { handleMessageRecovery } from './message-recovery-handler.ts';
import { handleBulkTopicMapping, handleTopicActivityUpdate } from './topic-management-improvements.ts';
import { handleCreateTopicMapping, handleGetTopicMappings } from './topic-management-handler.ts';
import { checkSyncHealth, autoRepairSyncIssues } from './sync-monitoring.ts';
import { handleWebhook } from './webhook-handler.ts';

// Additional handlers
async function handleGetStats(supabase: any) {
  console.log('📊 Getting Telegram statistics...');
  
  try {
    // Get total messages
    const { count: totalMessages } = await supabase
      .from('telegram_messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_hidden', false);

    // Get messages this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { count: messagesThisWeek } = await supabase
      .from('telegram_messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_hidden', false)
      .gte('timestamp', oneWeekAgo.toISOString());

    // Get active users count
    const { data: activeUsersData } = await supabase
      .from('telegram_messages')
      .select('user_id')
      .eq('is_hidden', false)
      .gte('timestamp', oneWeekAgo.toISOString());

    const activeUsers = new Set(activeUsersData?.map(m => m.user_id).filter(Boolean)).size;

    // Get top contributors
    const { data: contributorsData } = await supabase
      .from('telegram_messages')
      .select('username, first_name')
      .eq('is_hidden', false)
      .gte('timestamp', oneWeekAgo.toISOString());

    const userCounts = {};
    contributorsData?.forEach(msg => {
      const username = msg.username || msg.first_name || 'Unknown';
      userCounts[username] = (userCounts[username] || 0) + 1;
    });

    const topContributors = Object.entries(userCounts)
      .map(([username, count]) => ({ username, messageCount: count }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 5);

    return {
      totalMessages: totalMessages || 0,
      messagesThisWeek: messagesThisWeek || 0,
      activeUsers,
      topContributors
    };
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    return {
      totalMessages: 0,
      messagesThisWeek: 0,
      activeUsers: 0,
      topContributors: []
    };
  }
}

async function handleSetWebhook(webhookUrl: string, botToken: string) {
  console.log('🔗 Setting webhook:', webhookUrl);
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
    });

    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.description || 'Failed to set webhook');
    }

    return { success: true, message: 'Webhook set successfully' };
  } catch (error) {
    console.error('❌ Error setting webhook:', error);
    throw error;
  }
}

async function handleSyncTopicNames(supabase: any, botToken: string) {
  console.log('🏷️ Syncing topic names...');
  
  try {
    // Get unique thread IDs from messages
    const { data: threadData } = await supabase
      .from('telegram_messages')
      .select('message_thread_id, chat_id')
      .not('message_thread_id', 'is', null);

    const uniqueThreads = [...new Set(threadData?.map(m => `${m.chat_id}-${m.message_thread_id}`))];
    
    let updated = 0;
    let errors = 0;

    for (const threadKey of uniqueThreads.slice(0, 10)) { // Limit to avoid rate limits
      try {
        const [chatId, threadId] = threadKey.split('-');
        
        // Try to get forum topic info from Telegram API
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getForumTopicIconStickers`);
        
        if (response.ok) {
          updated++;
        } else {
          errors++;
        }
      } catch (error) {
        console.error(`❌ Error syncing thread ${threadKey}:`, error);
        errors++;
      }
    }

    return { updated, errors, message: `Processed ${uniqueThreads.length} topics` };
  } catch (error) {
    console.error('❌ Error syncing topic names:', error);
    throw error;
  }
}

// CORS headers - Updated to match shared configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, beehiiv-signature, x-beehiiv-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🤖 Telegram Bot API request:', req.method, req.url);
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    
    console.log('🤖 Bot token available:', !!botToken);
    
    if (!supabaseUrl || !supabaseKey || !botToken) {
      return new Response(JSON.stringify({ error: 'Missing required environment variables' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'POST') {
      const body = await req.json();
      
      // Log all incoming requests for debugging
      console.log('📥 Incoming POST request body:', JSON.stringify(body, null, 2));
      console.log('📥 Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));
      
      // Check if this is a Telegram webhook (no action field, has update field)
      if (!body.action && body.update) {
        console.log('📨 Processing Telegram webhook update');
        console.log('📨 Webhook update data:', JSON.stringify(body.update, null, 2));
        
        try {
          const webhookResult = await handleWebhook(body, supabase, botToken);
          console.log('✅ Webhook processing result:', JSON.stringify(webhookResult, null, 2));
          return new Response(JSON.stringify(webhookResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('❌ Webhook processing error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      console.log('🎯 Processing API action request:', body.action);

      switch (body.action) {
        case 'get_stats':
          const statsResult = await handleGetStats(supabase);
          return new Response(JSON.stringify(statsResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'set_webhook':
          const webhookResult = await handleSetWebhook(body.webhook_url, botToken);
          return new Response(JSON.stringify(webhookResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'sync_topic_names':
          const topicResult = await handleSyncTopicNames(supabase, botToken);
          return new Response(JSON.stringify(topicResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'enhanced_sync':
        case 'fetch_messages': // Keep backwards compatibility
          const syncResult = await handleEnhancedMessageSync(body, supabase, botToken);
          
          // Trigger sentiment analysis for new messages
          if (syncResult.synced > 0) {
            try {
              console.log('🧠 Triggering sentiment analysis for', syncResult.synced, 'messages');
              
              // Get recent messages that don't have sentiment analysis yet
              const { data: recentMessages } = await supabase
                .from('telegram_messages')
                .select('id, message_text')
                .not('message_text', 'is', null)
                .order('created_at', { ascending: false })
                .limit(Math.min(syncResult.synced, 50));

              if (recentMessages && recentMessages.length > 0) {
                // Filter messages that need analysis
                const { data: existingAnalyses } = await supabase
                  .from('telegram_sentiment_analysis')
                  .select('telegram_message_id')
                  .in('telegram_message_id', recentMessages.map(m => m.id));

                const existingIds = new Set(existingAnalyses?.map(a => a.telegram_message_id) || []);
                const messagesToAnalyze = recentMessages.filter(m => !existingIds.has(m.id));

                if (messagesToAnalyze.length > 0) {
                  // Call sentiment analysis function
                  const sentimentResponse = await supabase.functions.invoke('telegram-sentiment-analyzer', {
                    body: {
                      batchMode: true,
                      messages: messagesToAnalyze
                    }
                  });

                  if (sentimentResponse.error) {
                    console.error('❌ Sentiment analysis error:', sentimentResponse.error);
                  } else {
                    console.log('✅ Sentiment analysis completed for', messagesToAnalyze.length, 'messages');
                  }
                }
              }
            } catch (sentimentError) {
              console.error('❌ Error in sentiment analysis trigger:', sentimentError);
              // Don't fail the main operation if sentiment analysis fails
            }
          }
          
          return new Response(JSON.stringify(syncResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'sync_status':
          const statusResult = await handleSyncStatusRequest(supabase);
          return new Response(JSON.stringify(statusResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'sync_reset':
          const resetResult = await handleSyncReset(supabase);
          return new Response(JSON.stringify(resetResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'force_stop':
          const stopResult = await handleForceStop(supabase);
          return new Response(JSON.stringify(stopResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'cancel_sync':
        case 'request_cancellation':
          const cancellationResult = await handleCancellationRequest(supabase, body.job_id);
          return new Response(JSON.stringify(cancellationResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'review_detection':
          const reviewResult = await handleDetectionReview(
            supabase,
            body.detection_id,
            body.approved,
            body.reviewed_by
          );
          return new Response(JSON.stringify(reviewResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'message_recovery':
          const recoveryResult = await handleMessageRecovery(supabase, botToken, {
            hours: body.hours || 24,
            forceRefresh: body.force_refresh ?? true,
            includeTopicDiscovery: body.include_topic_discovery ?? true
          });
          return new Response(JSON.stringify(recoveryResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'create_topic_mapping':
          const createMappingResult = await handleCreateTopicMapping(body, supabase);
          return new Response(JSON.stringify(createMappingResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'get_topic_mappings':
          const getMappingsResult = await handleGetTopicMappings(supabase);
          return new Response(JSON.stringify(getMappingsResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'bulk_topic_mapping':
          const bulkMappingResult = await handleBulkTopicMapping(supabase, botToken);
          return new Response(JSON.stringify(bulkMappingResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'topic_activity_update':
          const activityResult = await handleTopicActivityUpdate(supabase);
          return new Response(JSON.stringify(activityResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'health_check':
          const healthResult = await checkSyncHealth(supabase);
          return new Response(JSON.stringify(healthResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'auto_repair':
          const repairResult = await autoRepairSyncIssues(supabase, botToken);
          return new Response(JSON.stringify(repairResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'send_test_message':
          console.log('📤 Sending test message to chat_id:', body.chat_id);
          
          if (!body.chat_id) {
            return new Response(JSON.stringify({ error: 'chat_id is required' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          try {
            const testMessage = `🤖 Test message from Weekly Wizdom!\n\nHi! This is a test to confirm your Telegram notifications are working properly.\n\n✅ Your Chat ID: ${body.chat_id}\n📧 Your Email: ${body.user_email || 'Not provided'}\n\nYou should now receive degen call alerts and other notifications here!`;
            
            const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: body.chat_id,
                text: testMessage,
                parse_mode: 'HTML'
              })
            });

            const telegramResult = await telegramResponse.json();
            
            if (!telegramResult.ok) {
              console.error('❌ Telegram API error:', telegramResult);
              return new Response(JSON.stringify({ 
                error: telegramResult.description || 'Failed to send message',
                telegram_error: telegramResult
              }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            console.log('✅ Test message sent successfully');
            return new Response(JSON.stringify({ 
              success: true, 
              message: 'Test message sent successfully!',
              telegram_message_id: telegramResult.result.message_id
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

          } catch (error) {
            console.error('❌ Error sending test message:', error);
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

        default:
          return new Response(JSON.stringify({ error: 'Unknown action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in telegram-bot function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
