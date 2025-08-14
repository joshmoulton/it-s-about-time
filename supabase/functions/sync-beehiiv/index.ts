import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", ...corsHeaders },
    ...init,
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create client with user's auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Authorization header required' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔍 Syncing premium status for user: ${user.email}`);

    // Call Beehiiv API to verify subscription
    const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
    const publicationId = 'pub_e08d5f43-7f7c-4c24-b546-f301ccd42a77';
    
    if (!beehiivApiKey || beehiivApiKey.length < 10) {
      console.error('❌ BEEHIIV_API_KEY missing or invalid');
      return json({ error: 'Configuration error' }, { status: 500 });
    }

    // Verify Beehiiv subscription status
    const beehiivUrl = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/by_email/${encodeURIComponent(user.email!)}`;
    console.log(`📡 Making API request to: ${beehiivUrl}`);

    const beehiivResponse = await fetch(beehiivUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${beehiivApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📡 Beehiiv API Response Status: ${beehiivResponse.status}`);

    let isPremium = false;
    let tier = 'free';

    if (beehiivResponse.ok) {
      const beehiivData = await beehiivResponse.json();
      console.log(`✅ Beehiiv API response for ${user.email}:`, JSON.stringify(beehiivData, null, 2));

      if (beehiivData?.data) {
        const subscription = beehiivData.data;
        const apiTier = subscription.subscription_tier;
        
        // Determine tier from Beehiiv API response
        if (
          apiTier === 'premium' ||
          apiTier === 'Premium' ||
          (Array.isArray(subscription.subscription_premium_tier_names) && subscription.subscription_premium_tier_names.length > 0)
        ) {
          tier = 'premium';
          isPremium = true;
        } else if (apiTier === 'paid' || apiTier === 'Paid') {
          tier = 'paid';
          isPremium = true;
        }
      }
    } else if (beehiivResponse.status === 404) {
      console.log(`📝 Email not found in Beehiiv: ${user.email} - treating as free tier`);
      // User not in Beehiiv, remains free tier
    } else {
      console.error(`❌ Beehiiv API error: ${beehiivResponse.status}`);
      return json({ error: 'Unable to verify subscription status' }, { status: 500 });
    }

    console.log(`✅ Determined tier for ${user.email}: ${tier}, isPremium: ${isPremium}`);

    // Use service role to update premium_members table
    const adminSupabase = createClient(supabaseUrl, serviceKey);

    if (isPremium) {
      // Upsert premium membership
      const { error: upsertError } = await adminSupabase
        .from('premium_members')
        .upsert({
          user_id: user.id,
          beehiiv_email: user.email!,
          tier: tier,
          active: true,
          expires_at: null, // No expiration for now
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('❌ Error upserting premium member:', upsertError);
        return json({ error: 'Failed to update premium status' }, { status: 500 });
      }

      console.log(`✅ Updated premium membership for ${user.email} with tier: ${tier}`);
    } else {
      // Remove premium membership if exists
      const { error: deleteError } = await adminSupabase
        .from('premium_members')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('❌ Error removing premium member:', deleteError);
        // Don't fail the request for this
      }

      console.log(`✅ Removed premium membership for ${user.email} (free tier)`);
    }

    return json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        tier: tier,
        isPremium: isPremium
      }
    });

  } catch (error) {
    console.error('❌ Sync error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
});