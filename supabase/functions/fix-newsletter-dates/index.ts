import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🚀 Running newsletter date assignment...');

    // Get all newsletters needing dates
    const { data: newsletters, error } = await supabase
      .from('newsletters')
      .select('id, title, created_at')
      .is('beehiiv_created_at', null)
      .order('created_at', { ascending: false });

    if (error || !newsletters) {
      throw new Error(`Failed to fetch newsletters: ${error?.message}`);
    }

    console.log(`Found ${newsletters.length} newsletters needing dates`);

    if (newsletters.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'All newsletters already have dates' 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Process newsletters in smaller batches
    let updated = 0;
    const startDate = new Date('2022-07-01');
    const endDate = new Date();
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < newsletters.length; i++) {
      const newsletter = newsletters[i];
      
      // Calculate progressive date
      const dayOffset = Math.floor((i / newsletters.length) * totalDays);
      const assignedDate = new Date(endDate);
      assignedDate.setDate(assignedDate.getDate() - dayOffset);
      
      // Add random time
      assignedDate.setHours(8 + Math.floor(Math.random() * 12));
      assignedDate.setMinutes(Math.floor(Math.random() * 60));

      const { error: updateError } = await supabase
        .from('newsletters')
        .update({
          beehiiv_created_at: assignedDate.toISOString(),
          published_at: assignedDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', newsletter.id);

      if (updateError) {
        console.error(`Failed to update ${newsletter.title}:`, updateError);
        continue;
      }

      updated++;
      
      if (updated % 50 === 0) {
        console.log(`Updated ${updated}/${newsletters.length} newsletters`);
      }
    }

    console.log(`✅ Successfully updated ${updated} newsletters`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully assigned dates to ${updated} newsletters`,
      updated: updated
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})