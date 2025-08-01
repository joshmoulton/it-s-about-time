import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🚀 Starting bulk newsletter date fix...');

    // Get all newsletters that need date assignment (NULL dates)
    const { data: newsletters, error: fetchError } = await supabase
      .from('newsletters')
      .select('id, title, beehiiv_post_id, beehiiv_created_at')
      .is('beehiiv_created_at', null)
      .order('created_at', { ascending: false }); // Newest first (like BeehiIV ordering)

    if (fetchError) {
      throw new Error(`Failed to fetch newsletters: ${fetchError.message}`);
    }

    console.log(`📊 Found ${newsletters?.length || 0} newsletters needing date assignment`);

    if (!newsletters || newsletters.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All newsletters already have dates assigned',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Progressive date assignment strategy
    const endDate = new Date(); // Today
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2); // 2 years ago
    
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalNewsletters = newsletters.length;

    console.log(`📅 Assigning dates across ${totalDays} days for ${totalNewsletters} newsletters`);

    const updates = newsletters.map((newsletter, index) => {
      // Calculate progressive date (index 0 = newest = most recent date)
      const dayOffset = Math.floor((index / totalNewsletters) * totalDays);
      const assignedDate = new Date(endDate);
      assignedDate.setDate(assignedDate.getDate() - dayOffset);
      
      // Add time variation within the day
      const randomHour = Math.floor(Math.random() * 16) + 6; // 6 AM to 10 PM
      const randomMinute = Math.floor(Math.random() * 60);
      assignedDate.setHours(randomHour, randomMinute, 0, 0);
      
      const progressiveDate = assignedDate.toISOString();
      
      console.log(`📰 ${newsletter.title}: Index ${index} -> ${progressiveDate}`);
      
      return {
        id: newsletter.id,
        beehiiv_created_at: progressiveDate,
        published_at: progressiveDate,
        updated_at: new Date().toISOString()
      };
    });

    // Batch update all newsletters
    console.log('💾 Performing batch update...');
    
    let updated = 0;
    const batchSize = 50; // Process in batches to avoid timeouts
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      const { error: updateError } = await supabase
        .from('newsletters')
        .upsert(batch, { onConflict: 'id' });
      
      if (updateError) {
        console.error(`❌ Batch update error:`, updateError);
        throw updateError;
      }
      
      updated += batch.length;
      console.log(`✅ Updated batch ${i / batchSize + 1}: ${updated}/${updates.length} newsletters`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🎉 Successfully assigned progressive dates to ${updated} newsletters!`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully assigned progressive dates to ${updated} newsletters`,
        processed: updated,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Newsletter date fix failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})