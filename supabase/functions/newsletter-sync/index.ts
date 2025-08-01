import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to map Beehiiv audience to our required_tier enum
function mapAudienceToTier(audience: string): 'free' | 'paid' | 'premium' {
  switch (audience) {
    case 'premium':
      return 'premium';
    case 'paid':
      return 'paid';
    case 'free':
    default:
      return 'free';
  }
}

// Helper function to fetch posts from Beehiiv with tier detection
async function fetchBeehiivPostsWithTierDetection(
  beehiivApiKey: string,
  beehiivPublicationId: string,
  dateFilter?: string
) {
  const params = new URLSearchParams({
    status: 'confirmed',
    limit: '50',
    expand: 'free_web_content,premium_web_content,free_email_content,premium_email_content'
  });
  
  if (dateFilter) {
    params.append('created_after', dateFilter);
  }

  const response = await fetch(
    `https://api.beehiiv.com/v2/publications/${beehiivPublicationId}/posts?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${beehiivApiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`BeehiIV API error: ${response.status}`);
  }

  return await response.json();
}

// Helper function to determine actual tier by comparing content
function determineActualTier(post: any): 'free' | 'paid' | 'premium' {
  const freeContent = post.free_web_content || post.free_email_content || '';
  const premiumContent = post.premium_web_content || post.premium_email_content || '';
  
  // If there's no premium content or it's identical to free content, it's truly free
  if (!premiumContent || premiumContent.trim() === freeContent.trim()) {
    return 'free';
  }
  
  // If premium content is significantly longer or different, it's premium
  const freeLength = freeContent.length;
  const premiumLength = premiumContent.length;
  
  // If premium content is more than 20% longer or has substantial differences, mark as premium
  if (premiumLength > freeLength * 1.2) {
    return 'premium';
  }
  
  // Default to paid tier for content with some differences
  return 'paid';
}

// Helper function to fetch single post with full content and tier detection
async function fetchSingleBeehiivPost(
  beehiivApiKey: string,
  beehiivPublicationId: string,
  postId: string
) {
  const response = await fetch(
    `https://api.beehiiv.com/v2/publications/${beehiivPublicationId}/posts/${postId}?expand=free_web_content,premium_web_content,free_email_content,premium_email_content`,
    {
      headers: {
        'Authorization': `Bearer ${beehiivApiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`BeehiIV API error for single post: ${response.status}`);
  }

  return await response.json();
}

// Helper function to fetch recent posts from Beehiiv with tier detection
async function fetchBeehiivPostsRecent(
  beehiivApiKey: string,
  beehiivPublicationId: string,
  maxPosts: number = 25
) {
  const params = new URLSearchParams({
    status: 'confirmed',
    limit: maxPosts.toString(),
    order_by: 'created',
    direction: 'desc',
    expand: 'free_web_content,premium_web_content,free_email_content,premium_email_content'
  });

  const response = await fetch(
    `https://api.beehiiv.com/v2/publications/${beehiivPublicationId}/posts?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${beehiivApiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`BeehiIV API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`📊 BeehiIV API returned ${data.data?.length || 0} newsletters (newest first)`);
  
  return data;
}

// Helper function to extract content based on user's subscription tier  
function extractContentForTier(post: any, userTier: 'free' | 'paid' | 'premium', actualTier: 'free' | 'paid' | 'premium') {
  // If user has sufficient tier access, show full content
  const canAccessFull = (
    actualTier === 'free' || 
    (actualTier === 'paid' && ['paid', 'premium'].includes(userTier)) ||
    (actualTier === 'premium' && userTier === 'premium')
  );
  
  let htmlContent = null;
  let plainContent = null;
  
  if (canAccessFull) {
    // Show premium content if available, otherwise free content
    htmlContent = post.premium_web_content || post.premium_email_content || 
                  post.free_web_content || post.free_email_content;
  } else {
    // Show only free content
    htmlContent = post.free_web_content || post.free_email_content;
  }
  
  // Extract plain text from HTML
  plainContent = htmlContent?.replace(/<[^>]*>/g, '') || post.content_preview;
  
  return {
    htmlContent,
    plainContent,
    shortContent: post.content_preview || post.subtitle || (plainContent ? plainContent.substring(0, 500) : null),
    hasFullAccess: canAccessFull
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, comprehensive = false } = await req.json();

    if (action === 'sync_newsletters') {
      console.log('🔄 Starting newsletter sync for last 25 newsletters...');
      
      const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
      const beehiivPublicationId = Deno.env.get('BEEHIIV_PUBLICATION_ID');
      
      if (!beehiivApiKey || !beehiivPublicationId) {
        throw new Error('BeehiIV API key or publication ID not configured');
      }

      // Fetch only the most recent 25 newsletters
      console.log('📡 Fetching recent newsletters...');
      const data = await fetchBeehiivPostsRecent(beehiivApiKey, beehiivPublicationId, 25);
      
      const allPosts = data.data || [];
      
      let syncedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      console.log(`📊 Found ${allPosts.length} newsletters from Beehiiv`);

      // Get all existing newsletters from our database
      const { data: existingNewsletters } = await supabase
        .from('newsletters')
        .select('id, beehiiv_post_id, title');

      // Create a set of Beehiiv post IDs that still exist
      const activeBeehiivIds = new Set(allPosts.map(post => post.id));
      
      // Find newsletters in our database that no longer exist in Beehiiv
      const staleNewsletters = existingNewsletters?.filter(
        newsletter => !activeBeehiivIds.has(newsletter.beehiiv_post_id)
      ) || [];

      // Clean up stale newsletters
      let deletedCount = 0;
      if (staleNewsletters.length > 0) {
        console.log(`🗑️ Found ${staleNewsletters.length} stale newsletters to clean up`);
        
        for (const staleNewsletter of staleNewsletters) {
          const { error } = await supabase
            .from('newsletters')
            .delete()
            .eq('id', staleNewsletter.id);
            
          if (!error) {
            console.log(`🗑️ Deleted stale newsletter: ${staleNewsletter.title}`);
            deletedCount++;
          } else {
            console.error(`❌ Failed to delete newsletter ${staleNewsletter.title}:`, error);
          }
        }
      }

      for (const post of allPosts) {
        try {
          // Check if newsletter is blacklisted
          const { data: blacklisted } = await supabase
            .from('newsletter_blacklist')
            .select('id, reason')
            .eq('beehiiv_post_id', post.id)
            .single();

          if (blacklisted) {
            console.log(`🚫 Skipping blacklisted newsletter: ${post.title} (Reason: ${blacklisted.reason})`);
            skippedCount++;
            continue;
          }

          // No date filtering - we want the most recent 25 regardless of age
          
          // Check if newsletter already exists
          const { data: existing } = await supabase
            .from('newsletters')
            .select('id')
            .eq('beehiiv_post_id', post.id)
            .single();

          // Determine actual tier by comparing free vs premium content
          const actualTier = determineActualTier(post);
          
          // Extract content for free tier (we'll use FreemiumWrapper in frontend for tier-based access)
          const { htmlContent, plainContent, shortContent } = extractContentForTier(post, 'free', actualTier);
          
          console.log(`📊 Newsletter "${post.title}" detected as ${actualTier} tier`);

          // Classify content type using our database function
          const { data: contentType } = await supabase.rpc(
            'classify_newsletter_content_type',
            {
              p_title: post.title || '',
              p_excerpt: post.subtitle || '',
              p_html_content: htmlContent || '',
              p_plain_content: plainContent || ''
            }
          );

          const newsletterData = {
            title: post.title || 'Untitled',
            content: shortContent || post.content_preview,
            html_content: htmlContent,
            plain_content: plainContent,
            excerpt: post.subtitle || shortContent?.substring(0, 200) || post.content_preview?.substring(0, 200),
            status: 'published', // Force published status for now
            beehiiv_post_id: post.id,
            published_at: post.publish_date ? new Date(post.publish_date * 1000).toISOString() : null,
            beehiiv_created_at: post.created ? new Date(post.created * 1000).toISOString() : null,
            beehiiv_updated_at: post.updated_at ? new Date(post.updated_at * 1000).toISOString() : null,
            web_url: post.web_url,
            thumbnail_url: post.thumbnail_url,
            required_tier: actualTier,
            metadata: { content_type: contentType || 'article' },
            updated_at: new Date().toISOString()
          };

          if (existing) {
            // Update existing newsletter
            const { error } = await supabase
              .from('newsletters')
              .update(newsletterData)
              .eq('id', existing.id);

            if (!error) {
              console.log(`✅ Updated newsletter: ${post.title} (${actualTier} tier)`);
              updatedCount++;
            }
          } else {
            // Insert new newsletter
            const { error } = await supabase
              .from('newsletters')
              .insert({
                ...newsletterData,
                created_at: new Date().toISOString()
              });

            if (!error) {
              console.log(`✅ Created newsletter: ${post.title} (${actualTier} tier)`);
              syncedCount++;
            }
          }
        } catch (error) {
          console.error('Error syncing post:', post.id, error);
        }
      }

      console.log(`✅ Newsletter sync completed: ${syncedCount} new, ${updatedCount} updated, ${deletedCount} deleted, ${skippedCount} skipped (blacklisted/too old)`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Synced ${syncedCount} new newsletters, updated ${updatedCount} existing ones, deleted ${deletedCount} stale ones, and skipped ${skippedCount} (blacklisted/too old)`,
          synced_count: syncedCount,
          updated_count: updatedCount,
          deleted_count: deletedCount,
          skipped_count: skippedCount
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Handle syncing a specific newsletter with full content
    if (action === 'sync_specific_newsletter') {
      const { beehiiv_post_id } = await req.json();
      
      if (!beehiiv_post_id) {
        throw new Error('beehiiv_post_id is required for specific newsletter sync');
      }

      console.log(`🔄 Syncing specific newsletter: ${beehiiv_post_id}`);
      
      const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
      const beehiivPublicationId = Deno.env.get('BEEHIIV_PUBLICATION_ID');
      
      if (!beehiivApiKey || !beehiivPublicationId) {
        throw new Error('BeehiIV API key or publication ID not configured');
      }

      // Fetch the specific post with full content
      const post = await fetchSingleBeehiivPost(beehiivApiKey, beehiivPublicationId, beehiiv_post_id);
      
      if (!post) {
        throw new Error('Newsletter not found on Beehiiv');
      }

      // Determine actual tier by comparing free vs premium content
      const actualTier = determineActualTier(post);

      // Extract content for free tier (frontend will handle tier-based access)
      const { htmlContent, plainContent, shortContent } = extractContentForTier(post, 'free', actualTier);

      const newsletterData = {
        title: post.title || 'Untitled',
        content: shortContent || post.content_preview,
        html_content: htmlContent,
        plain_content: plainContent,
        excerpt: post.subtitle || shortContent?.substring(0, 200) || post.content_preview?.substring(0, 200),
        status: post.status === 'confirmed' ? 'published' : 'draft',
        beehiiv_post_id: post.id,
        published_at: post.publish_date ? new Date(post.publish_date * 1000).toISOString() : null,
        beehiiv_created_at: post.created ? new Date(post.created * 1000).toISOString() : null,
        beehiiv_updated_at: post.updated_at ? new Date(post.updated_at * 1000).toISOString() : null,
        web_url: post.web_url,
        thumbnail_url: post.thumbnail_url,
        required_tier: actualTier,
        updated_at: new Date().toISOString()
      };

      // Update the newsletter in the database
      const { error } = await supabase
        .from('newsletters')
        .update(newsletterData)
        .eq('beehiiv_post_id', beehiiv_post_id);

      if (error) {
        throw error;
      }

      console.log(`✅ Successfully synced newsletter: ${post.title}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully synced newsletter: ${post.title}`,
          newsletter: newsletterData
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );

  } catch (error) {
    console.error('Newsletter sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});