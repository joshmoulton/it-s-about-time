import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('🔄 Starting X sentiment analysis backfill...');

    // Get X posts that don't have sentiment analysis yet
    const { data: postsWithoutSentiment, error: fetchError } = await supabaseClient
      .from('x_posts')
      .select('id, x_post_id, post_text, account_handle, created_at')
      .not('post_text', 'is', null)
      .not('post_text', 'eq', '')
      .not('id', 'in', `(
        SELECT x_post_id 
        FROM x_sentiment_analysis 
        WHERE x_post_id IS NOT NULL
      )`)
      .order('created_at', { ascending: false })
      .limit(100); // Process in batches to avoid timeouts

    if (fetchError) {
      console.error('❌ Error fetching posts without sentiment:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${postsWithoutSentiment?.length || 0} posts without sentiment analysis`);

    if (!postsWithoutSentiment || postsWithoutSentiment.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No posts need sentiment analysis',
          processed: 0 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Process sentiment analysis for each post
    let processedCount = 0;
    const errors = [];

    for (const post of postsWithoutSentiment) {
      try {
        console.log(`🧠 Processing sentiment for post: ${post.x_post_id} (@${post.account_handle})`);

        // Call the X sentiment analyzer function
        const { data: sentimentResult, error: sentimentError } = await supabaseClient.functions.invoke('x-sentiment-analyzer', {
          body: {
            postText: post.post_text,
            postId: post.id,
            source: 'x_post'
          }
        });

        if (sentimentError) {
          console.error(`❌ Sentiment analysis error for post ${post.id}:`, sentimentError);
          errors.push({
            postId: post.id,
            xPostId: post.x_post_id,
            error: sentimentError.message
          });
          continue;
        }

        console.log(`✅ Sentiment analysis completed for post: ${post.x_post_id}`);
        processedCount++;

        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error);
        errors.push({
          postId: post.id,
          xPostId: post.x_post_id,
          error: error.message
        });
      }
    }

    // Log summary
    console.log(`📊 X sentiment analysis backfill completed:`);
    console.log(`  - Processed: ${processedCount}`);
    console.log(`  - Errors: ${errors.length}`);

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        message: `X sentiment analysis backfill completed: ${processedCount} posts processed`,
        processed: processedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ X sentiment analysis backfill error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        processed: 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});