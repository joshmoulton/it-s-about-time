import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Newsletter {
  id: string;
  title: string;
  status: string;
  scheduled_at: string;
  content: string;
  excerpt?: string;
  author_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('🔄 Starting newsletter scheduler check...');

    // Get all scheduled newsletters that are due for publication
    const now = new Date().toISOString();
    const { data: scheduledNewsletters, error: fetchError } = await supabaseClient
      .from('newsletters')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now); // scheduled_at is less than or equal to current time

    if (fetchError) {
      console.error('❌ Error fetching scheduled newsletters:', fetchError);
      throw fetchError;
    }

    console.log(`📧 Found ${scheduledNewsletters?.length || 0} newsletters due for publication`);

    if (!scheduledNewsletters || scheduledNewsletters.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No newsletters due for publication',
          published: 0 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    let publishedCount = 0;
    const publishedNewsletters = [];
    const errors = [];

    // Process each scheduled newsletter
    for (const newsletter of scheduledNewsletters) {
      try {
        console.log(`📤 Publishing newsletter: ${newsletter.title} (ID: ${newsletter.id})`);

        // Update newsletter status to published
        const { error: updateError } = await supabaseClient
          .from('newsletters')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', newsletter.id);

        if (updateError) {
          console.error(`❌ Error updating newsletter ${newsletter.id}:`, updateError);
          errors.push({
            newsletterId: newsletter.id,
            title: newsletter.title,
            error: updateError.message
          });
          continue;
        }

        // TODO: Add integration with email service provider (BeehiIV, etc.)
        // This is where you would send the actual newsletter via email
        console.log(`✅ Successfully published newsletter: ${newsletter.title}`);
        
        publishedCount++;
        publishedNewsletters.push({
          id: newsletter.id,
          title: newsletter.title,
          published_at: new Date().toISOString()
        });

      } catch (error) {
        console.error(`❌ Error processing newsletter ${newsletter.id}:`, error);
        errors.push({
          newsletterId: newsletter.id,
          title: newsletter.title,
          error: error.message
        });
      }
    }

    // Log summary
    console.log(`📊 Newsletter scheduler completed:`);
    console.log(`  - Published: ${publishedCount}`);
    console.log(`  - Errors: ${errors.length}`);

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        message: `Newsletter scheduler completed: ${publishedCount} newsletters published`,
        published: publishedCount,
        publishedNewsletters,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Newsletter scheduler error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        published: 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});