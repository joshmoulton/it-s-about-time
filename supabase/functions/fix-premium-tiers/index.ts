import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface FixResult {
  success: boolean;
  beehiiv_sync_result?: any;
  missing_users_fixed: number;
  test_results?: any[];
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Starting premium tier assignment fix...');

    // Step 1: Run comprehensive Beehiiv subscriber sync
    console.log('📊 Step 1: Running Beehiiv subscriber sync...');
    const { data: syncResult, error: syncError } = await supabase.functions.invoke('beehiiv-subscriber-sync', {
      body: { action: 'sync_subscribers', limit: 2000 }
    });

    if (syncError) {
      console.error('❌ Beehiiv sync failed:', syncError);
      return new Response(
        JSON.stringify({ success: false, error: `Beehiiv sync failed: ${syncError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Beehiiv sync completed:', syncResult);

    // Step 2: Test verification for our known users
    const testEmails = ['an7onio947@gmail.com', 'petijnorelio@gmail.com', 'pidgeon@avium.trade'];
    const testResults: any[] = [];

    console.log('🧪 Step 2: Testing verification for known users...');
    for (const email of testEmails) {
      try {
        const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('unified-auth-verify', {
          body: { email, action: 'verify' }
        });

        const result = {
          email,
          success: !verifyError,
          verified: verifyResult?.verified || false,
          tier: verifyResult?.tier || 'free',
          source: verifyResult?.source || 'none',
          error: verifyError?.message || verifyResult?.error
        };

        testResults.push(result);
        console.log(`📧 ${email}: ${result.verified ? '✅' : '❌'} ${result.tier} tier (${result.source})`);
      } catch (error) {
        console.error(`❌ Test failed for ${email}:`, error);
        testResults.push({
          email,
          success: false,
          verified: false,
          tier: 'free',
          source: 'none',
          error: error.message
        });
      }
    }

    // Step 3: Count how many users are now properly stored
    const { count: fixedCount } = await supabase
      .from('beehiiv_subscribers')
      .select('*', { count: 'exact', head: true })
      .neq('subscription_tier', 'free');

    console.log(`📈 Step 3: Found ${fixedCount || 0} users with premium/paid tiers`);

    const result: FixResult = {
      success: true,
      beehiiv_sync_result: syncResult,
      missing_users_fixed: fixedCount || 0,
      test_results: testResults
    };

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Premium tier fix error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred',
        missing_users_fixed: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});