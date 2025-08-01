import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to map Beehiiv subscription tier to our enum
function mapBeehiivTier(subscription: any): 'free' | 'paid' | 'premium' {
  // Check premium tier names array first
  if (subscription.subscription_premium_tier_names && subscription.subscription_premium_tier_names.length > 0) {
    return 'premium';
  }
  
  // Check direct subscription tier
  if (subscription.subscription_tier === 'premium') {
    return 'premium';
  } else if (subscription.subscription_tier === 'paid') {
    return 'paid';
  }
  
  return 'free';
}

// Helper function to map Beehiiv status to our status
function mapBeehiivStatus(status: string): string {
  const statusMapping: Record<string, string> = {
    'active': 'active',
    'inactive': 'inactive',
    'unsubscribed': 'unsubscribed',
    'pending': 'pending',
    'validating': 'validating'
  };
  
  return statusMapping[status] || status;
}

// Helper function to fetch subscribers from Beehiiv API
async function fetchBeehiivSubscribers(
  beehiivApiKey: string,
  publicationId: string,
  cursor?: string
): Promise<{ data: any[], nextCursor?: string }> {
  const params = new URLSearchParams({
    limit: '100',
    expand: 'stats'
  });
  
  if (cursor) {
    params.append('cursor', cursor);
  }

  const response = await fetch(
    `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${beehiivApiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Beehiiv API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    data: data.data || [],
    nextCursor: data.next_cursor
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

    const { action = 'sync_subscribers', limit = 1000 } = await req.json().catch(() => ({}));

    if (action === 'sync_subscribers') {
      console.log('🔄 Starting comprehensive subscriber sync...');
      
      const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
      const publicationId = Deno.env.get('BEEHIIV_PUBLICATION_ID');
      
      if (!beehiivApiKey || !publicationId) {
        throw new Error('BeehiIV API key or publication ID not configured');
      }

      let totalSynced = 0;
      let totalUpdated = 0;
      let totalErrors = 0;
      let nextCursor: string | undefined;
      let pageCount = 0;
      const maxPages = Math.ceil(limit / 100); // Limit pages to avoid timeout

      do {
        pageCount++;
        console.log(`📄 Processing page ${pageCount}...`);
        
        try {
          const { data: subscribers, nextCursor: newCursor } = await fetchBeehiivSubscribers(
            beehiivApiKey,
            publicationId,
            nextCursor
          );

          console.log(`📊 Found ${subscribers.length} subscribers on page ${pageCount}`);

          if (subscribers.length === 0) {
            console.log('No more subscribers to process');
            break;
          }

          // Process subscribers in batches
          for (const subscriber of subscribers) {
            try {
              const mappedTier = mapBeehiivTier(subscriber);
              const mappedStatus = mapBeehiivStatus(subscriber.status);

              console.log(`Processing subscriber: ${subscriber.email} (${mappedTier} tier, ${mappedStatus} status)`);

              // Check if subscriber exists
              const { data: existing } = await supabase
                .from('beehiiv_subscribers')
                .select('id, subscription_tier, status')
                .eq('email', subscriber.email)
                .single();

              const subscriberData = {
                email: subscriber.email,
                beehiiv_subscriber_id: subscriber.id,
                status: mappedStatus,
                subscription_tier: mappedTier,
                created_at: subscriber.created ? new Date(subscriber.created * 1000).toISOString() : new Date().toISOString(),
                updated_at: new Date().toISOString(),
                metadata: {
                  utm_source: subscriber.utm_source,
                  utm_medium: subscriber.utm_medium,
                  utm_campaign: subscriber.utm_campaign,
                  referral_code: subscriber.referral_code,
                  stripe_customer_id: subscriber.stripe_customer_id,
                  premium_tier_names: subscriber.subscription_premium_tier_names
                }
              };

              if (existing) {
                // Update existing subscriber if tier or status changed
                if (existing.subscription_tier !== mappedTier || existing.status !== mappedStatus) {
                  const { error } = await supabase
                    .from('beehiiv_subscribers')
                    .update(subscriberData)
                    .eq('id', existing.id);

                  if (error) {
                    console.error(`❌ Error updating subscriber ${subscriber.email}:`, error);
                    totalErrors++;
                  } else {
                    console.log(`✅ Updated subscriber: ${subscriber.email} (${mappedTier} tier)`);
                    totalUpdated++;
                  }
                }
              } else {
                // Insert new subscriber
                const { error } = await supabase
                  .from('beehiiv_subscribers')
                  .insert(subscriberData);

                if (error) {
                  console.error(`❌ Error inserting subscriber ${subscriber.email}:`, error);
                  totalErrors++;
                } else {
                  console.log(`✅ Created subscriber: ${subscriber.email} (${mappedTier} tier)`);
                  totalSynced++;
                }
              }
            } catch (error) {
              console.error(`❌ Error processing subscriber ${subscriber.email}:`, error);
              totalErrors++;
            }
          }

          nextCursor = newCursor;
          
          // Check if we've hit the limit
          if (pageCount >= maxPages) {
            console.log(`⏸️ Reached page limit (${maxPages}), stopping sync`);
            break;
          }
          
        } catch (error) {
          console.error(`❌ Error fetching page ${pageCount}:`, error);
          totalErrors++;
          break;
        }
      } while (nextCursor);

      console.log(`✅ Subscriber sync completed: ${totalSynced} new, ${totalUpdated} updated, ${totalErrors} errors`);

      // Update system settings to track sync
      await supabase.from('system_settings').upsert({
        setting_key: 'last_subscriber_sync',
        setting_value: {
          timestamp: new Date().toISOString(),
          total_synced: totalSynced,
          total_updated: totalUpdated,
          total_errors: totalErrors,
          pages_processed: pageCount
        },
        description: 'Last comprehensive subscriber sync status'
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Synced ${totalSynced} new subscribers, updated ${totalUpdated} existing ones, ${totalErrors} errors`,
          synced_count: totalSynced,
          updated_count: totalUpdated,
          error_count: totalErrors,
          pages_processed: pageCount
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
    console.error('Subscriber sync error:', error);
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