import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const twitterBearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');

const supabase = createClient(supabaseUrl, supabaseKey);

interface XAccount {
  id: string;
  account_handle: string;
  account_url?: string;
  monitor_frequency_minutes: number;
  content_type: string;
  keyword_filters?: string[];
  last_sync_at?: string;
  last_post_id?: string;
  error_count?: number;
}

interface XTweetData {
  id: string;
  text?: string;
  author_id?: string;
  created_at?: string;
  public_metrics?: {
    retweet_count?: number;
    like_count?: number;
    reply_count?: number;
    quote_count?: number;
  };
  referenced_tweets?: Array<{
    type: string;
    id: string;
  }>;
  in_reply_to_user_id?: string;
  context_annotations?: Array<{
    domain: { id: string; name: string; description?: string };
    entity: { id: string; name: string; description?: string };
  }>;
}

interface XUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  verified?: boolean;
}

async function getActiveAccounts(): Promise<XAccount[]> {
  try {
    const { data, error } = await supabase
      .from('x_account_monitoring')
      .select('*')
      .eq('is_active', true)
      .order('last_sync_at', { ascending: true, nullsFirst: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching active accounts:', error);
    return [];
  }
}

async function getUserByUsername(username: string): Promise<XUser | null> {
  if (!twitterBearerToken) {
    throw new Error('Twitter Bearer Token not configured');
  }

  try {
    const response = await fetch(`https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url,verified`, {
      headers: {
        'Authorization': `Bearer ${twitterBearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error(`Error fetching user @${username}:`, error);
    return null;
  }
}

async function collectAccountData(account: XAccount): Promise<{ success: boolean; postsCollected: number; error?: string }> {
  if (!twitterBearerToken) {
    return { success: false, postsCollected: 0, error: 'Twitter Bearer Token not configured' };
  }

  try {
    console.log(`🔄 Collecting data for @${account.account_handle}`);

    // Get user info first
    const userInfo = await getUserByUsername(account.account_handle);
    if (!userInfo) {
      throw new Error(`User @${account.account_handle} not found`);
    }

    // Build query parameters for tweet types
    let excludeParams = [];
    if (account.content_type === 'original_only') {
      excludeParams = ['retweets', 'replies'];
    } else if (account.content_type === 'replies_only') {
      excludeParams = ['retweets'];
    } else if (account.content_type === 'retweets_only') {
      excludeParams = ['replies'];
    }

    const excludeQuery = excludeParams.length > 0 ? `&exclude=${excludeParams.join(',')}` : '';
    
    // Build time filtering - only get posts from the last sync or last 24 hours (whichever is more recent)
    const now = new Date();
    let sinceTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    
    if (account.last_sync_at) {
      const lastSync = new Date(account.last_sync_at);
      // Use the more recent of last sync or 24 hours ago
      sinceTime = lastSync > sinceTime ? lastSync : sinceTime;
    }
    
    const startTimeParam = `&start_time=${sinceTime.toISOString()}`;
    
    // Reduce max_results to avoid hitting rate limits with old posts
    const maxResults = account.last_sync_at ? 50 : 10; // More conservative approach
    
    // Construct API URL for user timeline with time filtering
    const apiUrl = `https://api.twitter.com/2/users/${userInfo.id}/tweets?max_results=${maxResults}&tweet.fields=created_at,author_id,public_metrics,referenced_tweets,in_reply_to_user_id,context_annotations&expansions=author_id,referenced_tweets.id${excludeQuery}${startTimeParam}`;

    console.log(`📡 Fetching tweets from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${twitterBearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const tweets: XTweetData[] = data.data || [];

    console.log(`📊 Collected ${tweets.length} tweets for @${account.account_handle}`);

    // Apply keyword filters
    let filteredTweets = tweets;
    if (account.keyword_filters && account.keyword_filters.length > 0) {
      filteredTweets = filteredTweets.filter(tweet => 
        tweet.text && account.keyword_filters!.some(keyword => 
          tweet.text!.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }

    console.log(`🔍 After filtering: ${filteredTweets.length} tweets`);

    // Store posts in database
    let postsStored = 0;
    const latestPostId = filteredTweets.length > 0 ? filteredTweets[0].id : account.last_post_id;

    for (const tweet of filteredTweets) {
      // Skip tweets with missing essential data
      if (!tweet.id || !tweet.text) {
        console.log(`⚠️ Skipping tweet with missing data: ${tweet.id || 'no ID'}`);
        continue;
      }
      
      // Skip if we already have this tweet
      const { data: existingPost } = await supabase
        .from('x_posts')
        .select('id')
        .eq('x_post_id', tweet.id)
        .single();

      if (existingPost) continue;

      // Determine if it's a retweet or reply
      const isRetweet = tweet.referenced_tweets?.some(ref => ref.type === 'retweeted') || false;
      const isReply = tweet.in_reply_to_user_id !== undefined || tweet.referenced_tweets?.some(ref => ref.type === 'replied_to') || false;

      // Insert new post
      const { error: insertError } = await supabase
        .from('x_posts')
        .insert({
          x_post_id: tweet.id,
          account_id: account.id,
          account_handle: account.account_handle,
          post_text: tweet.text,
          post_url: `https://x.com/${account.account_handle}/status/${tweet.id}`,
          author_name: userInfo.name,
          author_username: userInfo.username,
          retweet_count: tweet.public_metrics?.retweet_count || 0,
          like_count: tweet.public_metrics?.like_count || 0,
          reply_count: tweet.public_metrics?.reply_count || 0,
          quote_count: tweet.public_metrics?.quote_count || 0,
          posted_at: tweet.created_at || new Date().toISOString(),
          is_retweet: isRetweet,
          is_reply: isReply,
          reply_to_post_id: tweet.referenced_tweets?.find(ref => ref.type === 'replied_to')?.id || null,
          post_metadata: tweet
        });

      if (!insertError) {
        postsStored++;

        // Trigger sentiment analysis for this post
        if (tweet.text && tweet.text.trim()) {
          console.log(`🧠 Triggering sentiment analysis for tweet: ${tweet.id}`);
          await triggerSentimentAnalysis(tweet.id, tweet.text);
        }
      } else {
        console.error(`❌ Error inserting post ${tweet.id}:`, insertError);
      }
    }

    // Update account sync status
    await supabase
      .from('x_account_monitoring')
      .update({
        last_sync_at: new Date().toISOString(),
        last_post_id: latestPostId,
        error_count: 0,
        last_error_message: null
      })
      .eq('id', account.id);

    console.log(`✅ Stored ${postsStored} new posts for @${account.account_handle}`);
    return { success: true, postsCollected: postsStored };

  } catch (error: any) {
    console.error(`❌ Error collecting data for @${account.account_handle}:`, error);

    // Update error status
    await supabase
      .from('x_account_monitoring')
      .update({
        error_count: (account.error_count || 0) + 1,
        last_error_message: error.message
      })
      .eq('id', account.id);

    return { success: false, postsCollected: 0, error: error.message };
  }
}

async function triggerSentimentAnalysis(postId: string, postText: string) {
  try {
    console.log(`🧠 Triggering sentiment analysis for post ID: ${postId}`);
    const { data, error } = await supabase.functions.invoke('x-sentiment-analyzer', {
      body: {
        postText: postText,
        postId: postId,
        source: 'x_post'
      }
    });

    if (error) {
      console.error('❌ Sentiment analysis invocation error:', error);
    } else {
      console.log('✅ Sentiment analysis triggered successfully for post:', postId);
    }
  } catch (error) {
    console.error('❌ Error triggering sentiment analysis:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trigger = 'manual' } = await req.json().catch(() => ({}));
    
    console.log(`🚀 Starting X data collection (trigger: ${trigger})`);

    // Get active accounts to monitor
    const accounts = await getActiveAccounts();
    
    if (accounts.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active accounts to monitor',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Found ${accounts.length} active accounts to monitor`);

    // Filter accounts that need updating based on frequency
    const accountsToUpdate = accounts.filter(account => {
      if (!account.last_sync_at) return true; // Never synced
      
      const lastSync = new Date(account.last_sync_at);
      const now = new Date();
      const minutesSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60);
      
      return minutesSinceSync >= account.monitor_frequency_minutes;
    });

    console.log(`🔄 ${accountsToUpdate.length} accounts need updating`);

    // Process accounts in batches to avoid overwhelming X API
    const results = [];
    const batchSize = 2; // Process 2 accounts at a time to respect rate limits
    
    for (let i = 0; i < accountsToUpdate.length; i += batchSize) {
      const batch = accountsToUpdate.slice(i, i + batchSize);
      const batchPromises = batch.map(account => collectAccountData(account));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Delay between batches to respect X API rate limits
      if (i + batchSize < accountsToUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      }
    }

    const totalPostsCollected = results.reduce((sum, result) => sum + result.postsCollected, 0);
    const successfulAccounts = results.filter(result => result.success).length;
    const failedAccounts = results.filter(result => !result.success).length;

    console.log(`✅ Collection complete: ${totalPostsCollected} posts from ${successfulAccounts} accounts`);

    return new Response(JSON.stringify({
      success: true,
      processed: accountsToUpdate.length,
      successful: successfulAccounts,
      failed: failedAccounts,
      totalPostsCollected,
      results: results.map(r => ({ success: r.success, postsCollected: r.postsCollected, error: r.error }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ X data collection error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});