import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'

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
    console.log('🤖 Beehiiv automated sync triggered');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { trigger, comprehensive = false } = await req.json().catch(() => ({ trigger: 'manual' }));
    
    console.log(`📅 Sync trigger: ${trigger}, comprehensive: ${comprehensive}`);

    // Call the existing newsletter-sync function to do the actual work
    const { data, error } = await supabase.functions.invoke('newsletter-sync', {
      body: { 
        action: 'sync_newsletters',
        comprehensive: comprehensive 
      }
    });

    if (error) {
      console.error('❌ Newsletter sync failed:', error);
      throw error;
    }

    console.log('✅ Newsletter sync completed via automated trigger:', data);

    // Log the sync activity
    await supabase.from('system_settings').upsert({
      setting_key: 'last_automated_sync',
      setting_value: {
        trigger: trigger,
        timestamp: new Date().toISOString(),
        success: true,
        data: data
      },
      description: 'Last automated Beehiiv sync status'
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Automated sync completed successfully (${trigger})`,
        trigger: trigger,
        sync_result: data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('💥 Automated sync error:', error);
    
    // Log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase.from('system_settings').upsert({
        setting_key: 'last_automated_sync',
        setting_value: {
          trigger: 'unknown',
          timestamp: new Date().toISOString(),
          success: false,
          error: error.message
        },
        description: 'Last automated Beehiiv sync status'
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Automated sync failed' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});