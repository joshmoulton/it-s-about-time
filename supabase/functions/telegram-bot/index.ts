
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
    
    if (!botToken || botToken.length < 10) {
      console.error('Invalid or missing Telegram bot token');
      return new Response(JSON.stringify({ error: 'Bot configuration error' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('🤖 Bot token configured');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return new Response(JSON.stringify({ error: 'Database configuration error' }), {
        status: 503,
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

      // Check if this is a custom external bot message (no action, has telegram_user_id)
      if (!body.action && body.telegram_user_id && body.telegram_message && body.telegram_chat_id) {
        console.log('🤖 Processing external bot message');
        console.log('🤖 External bot data:', JSON.stringify(body, null, 2));
        
        try {
          // Convert external bot format to standard Telegram message format
          const telegramMessage = {
            message_id: body.message_id,
            chat: {
              id: body.telegram_chat_id
            },
            from: {
              id: body.telegram_user_id,
              username: body.telegram_username,
              first_name: body.telegram_full_name?.split(' ')[0] || body.telegram_username,
              last_name: body.telegram_full_name?.split(' ').slice(1).join(' ') || null
            },
            text: body.telegram_message,
            message_thread_id: body.telegram_topic_id,
            date: Math.floor(new Date(body.timestamp_utc || new Date()).getTime() / 1000),
            reply_to_message: body.reply_to_message_id ? { message_id: body.reply_to_message_id } : undefined,
            // Add topic name from external bot if available
            topic_name: body.telegram_topic_name
          };

          // Process using the improved message processor
          const { processAndInsertMessageImproved } = await import('./improved-message-processor.ts');
          const success = await processAndInsertMessageImproved(telegramMessage, supabase, botToken);
          
          if (success) {
            console.log('✅ Successfully processed external bot message');
            
            // Trigger sentiment analysis in background
            if (body.telegram_message && body.telegram_message.trim().length > 0) {
              try {
                const sentimentResponse = await supabase.functions.invoke('telegram-sentiment-analyzer', {
                  body: {
                    messageText: body.telegram_message,
                    messageId: body.message_id?.toString(),
                    batchMode: false
                  }
                });
                
                if (sentimentResponse.error) {
                  console.error('❌ Sentiment analysis error:', sentimentResponse.error);
                } else {
                  console.log('✅ Sentiment analysis completed');
                }
              } catch (sentimentError) {
                console.error('❌ Error in sentiment analysis:', sentimentError);
              }
            }
            
            return new Response(JSON.stringify({ success: true, message: 'Message processed successfully' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            console.log('⚠️ Failed to process external bot message');
            return new Response(JSON.stringify({ success: false, error: 'Failed to process message' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } catch (error) {
          console.error('❌ External bot processing error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Support path-based routing for degen call endpoints
      const { pathname } = new URL(req.url);
      if (!body.action) {
        if (pathname.endsWith('/insert_degen_call')) body.action = 'insert_degen_call';
        if (pathname.endsWith('/close_degen_call')) body.action = 'close_degen_call';
        if (pathname.endsWith('/backfill_degen_calls')) body.action = 'backfill_degen_calls';
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

        case 'insert_degen_call':
          try {
            console.log('🧩 insert_degen_call payload:', JSON.stringify(body, null, 2));
            const payload = body.degen_call || {};
            const msg = body.message || {};
            const from = msg.from_user || {};

            const rawTicker = (payload.ticker ?? '').toString();
            const ticker = rawTicker.replace(/^\$/,'').toUpperCase().trim();
            if (!ticker) {
              return new Response(JSON.stringify({ error: 'ticker is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            const toNum = (v: any) => {
              const n = typeof v === 'number' ? v : parseFloat(String(v));
              return Number.isFinite(n) ? n : null;
            };

            const entry = toNum(payload.entry);
            const stop = toNum(payload.stop);
            const target = toNum(payload.target);

            const parseRisk = (r: any): number | null => {
              if (r == null) return null;
              const s = String(r).trim();
              const pctMatch = s.match(/^([0-9]+(?:\.[0-9]+)?)%$/);
              if (pctMatch) {
                const val = parseFloat(pctMatch[1]);
                return Number.isFinite(val) ? Math.max(0.01, Math.min(val, 100)) : null;
              }
              switch (s.toLowerCase()) {
                case 'tiny': return 0.5;
                case 'low': return 1.0;
                case 'medium': return 2.0;
                case 'high': return 5.0;
                default: return null;
              }
            };
            const risk_percentage = parseRisk(payload.risk) ?? 2.0;

            const inferDirection = (e: number | null, s: number | null, t: number | null): 'long' | 'short' => {
              if (e != null && t != null) {
                if (t > e) return 'long';
                if (t < e) return 'short';
              }
              if (e != null && s != null) {
                if (s < e) return 'long';
                if (s > e) return 'short';
              }
              return 'long';
            };
            const trade_direction = inferDirection(entry, stop, target);

            const existingCheckId = msg.message_id ?? null;
            if (existingCheckId != null) {
              const { data: existing } = await supabase
                .from('analyst_signals')
                .select('id')
                .eq('telegram_message_id', existingCheckId)
                .maybeSingle();
              if (existing?.id) {
                console.log('🟡 idempotent: analyst_signal already exists', existing.id);
                return new Response(JSON.stringify({ success: true, idempotent: true, analyst_signal_id: existing.id }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
              }
            }

            const insertPayload: any = {
              analyst_name: from.username || from.first_name || 'Telegram Analyst',
              market: 'crypto',
              trade_type: 'futures',
              trade_direction,
              ticker,
              risk_percentage,
              entry_type: 'market',
              entry_price: entry,
              risk_management: stop != null ? 'stop_loss' : 'conditional',
              stop_loss_price: stop,
              targets: target != null ? [target] : [],
              full_description: msg.text ? `DEGEN: ${msg.text}` : `Degen call for ${ticker}`,
              posted_to_telegram: true,
              status: 'active',
              telegram_message_id: existingCheckId
            };

            const { data: inserted, error: insertError } = await supabase
              .from('analyst_signals')
              .insert(insertPayload)
              .select('id')
              .maybeSingle();

            if (insertError) {
              console.error('❌ analyst_signals insert error:', insertError);
              return new Response(JSON.stringify({ error: insertError.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            console.log('✅ analyst_signal created', inserted);
            return new Response(JSON.stringify({ success: true, analyst_signal_id: inserted?.id || null }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

          } catch (err) {
            console.error('❌ insert_degen_call error:', err);
            return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

        case 'close_degen_call':
          try {
            console.log('🚫 close_degen_call payload:', JSON.stringify(body, null, 2));
            const payload = body.close_call || {};
            const msg = body.message || {};
            const from = msg.from_user || {};

            const rawTicker = (payload.ticker ?? '').toString();
            const ticker = rawTicker.replace(/^\$/,'').toUpperCase().trim();
            if (!ticker) {
              return new Response(JSON.stringify({ error: 'ticker is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            const toNum = (v: any) => {
              const n = typeof v === 'number' ? v : parseFloat(String(v));
              return Number.isFinite(n) ? n : null;
            };

            const close_price = toNum(payload.close_price);
            const reason = payload.reason || 'Closed via !close command';
            const analyst_name = from.username || from.first_name || payload.analyst_username || 'Telegram Analyst';

            // Find active signals with matching ticker
            const { data: activeSignals, error: findError } = await supabase
              .from('analyst_signals')
              .select('id, ticker, analyst_name, created_at')
              .eq('ticker', ticker)
              .eq('status', 'active')
              .order('created_at', { ascending: false });

            if (findError) {
              console.error('❌ Error finding active signals:', findError);
              return new Response(JSON.stringify({ error: findError.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            if (!activeSignals || activeSignals.length === 0) {
              console.log('⚠️ No active signals found for ticker:', ticker);
              return new Response(JSON.stringify({ 
                success: true, 
                message: `No active signals found for ${ticker}`,
                closed_count: 0
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            // Close all active signals for this ticker
            const { data: updatedSignals, error: updateError } = await supabase
              .from('analyst_signals')
              .update({
                status: 'closed',
                closed_at: new Date().toISOString(),
                closed_by: analyst_name,
                close_reason: reason
              })
              .eq('ticker', ticker)
              .eq('status', 'active')
              .select('id, ticker');

            if (updateError) {
              console.error('❌ Error closing signals:', updateError);
              return new Response(JSON.stringify({ error: updateError.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            const closed_count = updatedSignals?.length || 0;
            console.log(`✅ Closed ${closed_count} signals for ${ticker}`);
            
            return new Response(JSON.stringify({ 
              success: true, 
              message: `Closed ${closed_count} signal(s) for ${ticker}`,
              closed_count,
              closed_signals: updatedSignals,
              close_price,
              reason
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

          } catch (err) {
            console.error('❌ close_degen_call error:', err);
            return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

        case 'backfill_degen_calls':
          try {
            const limit = Math.min(parseInt(String(body.limit ?? '200')), 1000) || 200;
            const since = body.since ? new Date(body.since) : null;
            const chatFilter = body.chat_id ?? null;
            const dryRun = Boolean(body.dry_run ?? false);

            const { data: messages, error: fetchErr } = await supabase
              .from('telegram_messages')
              .select('telegram_message_id, message_text, chat_id, message_thread_id, user_id, username, first_name, last_name, timestamp')
              .not('message_text', 'is', null)
              .not('telegram_message_id', 'is', null)
              .ilike('message_text', '!degen%')
              .order('timestamp', { ascending: true })
              .limit(limit);

            if (fetchErr) {
              console.error('❌ backfill fetch error:', fetchErr);
              return new Response(JSON.stringify({ error: fetchErr.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            const filtered = (messages || []).filter(m => {
              if (since && new Date(m.timestamp) < since) return false;
              if (chatFilter && String(m.chat_id) !== String(chatFilter)) return false;
              return true;
            });

            const re = /^\s*!degen\s+(\$?[A-Za-z]{2,15})(?:\s+(here))?(?:\s+entry\s+([0-9]+(?:\.[0-9]+)?))?(?:\s+stop\s+([0-9]+(?:\.[0-9]+)?))?(?:\s+target\s+([0-9]+(?:\.[0-9]+)?))?(?:\s+risk\s+([A-Za-z]+|[0-9]+(?:\.[0-9]+)?%))?/i;
            const toNum = (v: any) => {
              const n = typeof v === 'number' ? v : parseFloat(String(v));
              return Number.isFinite(n) ? n : null;
            };
            const parseRisk = (r: any): number | null => {
              if (r == null) return null;
              const s = String(r).trim();
              const pctMatch = s.match(/^([0-9]+(?:\.[0-9]+)?)%$/);
              if (pctMatch) {
                const val = parseFloat(pctMatch[1]);
                return Number.isFinite(val) ? Math.max(0.01, Math.min(val, 100)) : null;
              }
              switch (s.toLowerCase()) {
                case 'tiny': return 0.5;
                case 'low': return 1.0;
                case 'medium': return 2.0;
                case 'high': return 5.0;
                default: return null;
              }
            };
            const inferDirection = (e: number | null, s: number | null, t: number | null): 'long' | 'short' => {
              if (e != null && t != null) {
                if (t > e) return 'long';
                if (t < e) return 'short';
              }
              if (e != null && s != null) {
                if (s < e) return 'long';
                if (s > e) return 'short';
              }
              return 'long';
            };

            let candidates = filtered.length;
            let parsed = 0, inserted = 0, skipped = 0, errors = 0;
            const sample: any[] = [];

            for (const m of filtered) {
              const text = m.message_text || '';
              const match = text.match(re);
              if (!match) { skipped++; continue; }

              const rawTicker = match[1] || '';
              const ticker = rawTicker.replace(/^\$/,'').toUpperCase().trim();
              const entry = toNum(match[3]);
              const stop = toNum(match[4]);
              const target = toNum(match[5]);
              const riskRaw = match[6] || null;
              const risk_percentage = parseRisk(riskRaw) ?? 2.0;
              const trade_direction = inferDirection(entry, stop, target);
              parsed++;

              // Idempotency check
              const { data: existing } = await supabase
                .from('analyst_signals')
                .select('id')
                .eq('telegram_message_id', m.telegram_message_id)
                .maybeSingle();
              if (existing?.id) { skipped++; continue; }

              const insertPayload: any = {
                analyst_name: m.username || m.first_name || 'Telegram Analyst',
                market: 'crypto',
                trade_type: 'futures',
                trade_direction,
                ticker,
                risk_percentage,
                entry_type: 'market',
                entry_price: entry,
                risk_management: stop != null ? 'stop_loss' : 'conditional',
                stop_loss_price: stop,
                targets: target != null ? [target] : [],
                full_description: text ? `DEGEN: ${text}` : `Degen call for ${ticker}`,
                posted_to_telegram: true,
                status: 'active',
                telegram_message_id: m.telegram_message_id
              };

              if (dryRun) {
                sample.push({ ticker, entry, stop, target, risk_percentage, trade_direction, telegram_message_id: m.telegram_message_id });
                continue;
              }

              const { error: insErr } = await supabase
                .from('analyst_signals')
                .insert(insertPayload);

              if (insErr) {
                console.error('❌ backfill insert error:', insErr);
                errors++;
              } else {
                inserted++;
                if (sample.length < 10) sample.push({ ticker, entry, stop, target, risk_percentage, trade_direction, telegram_message_id: m.telegram_message_id });
              }
            }

            return new Response(JSON.stringify({ success: true, dryRun, candidates, parsed, inserted, skipped, errors, sample }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } catch (err) {
            console.error('❌ backfill_degen_calls error:', err);
            return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

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
