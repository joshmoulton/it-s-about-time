import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting cache to prevent duplicate requests
const pendingRequests = new Map();
const rateLimitCache = new Map();

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", ...corsHeaders },
    ...init,
  });
}

function generateToken(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const email = await req.json().then(body => body.email?.toLowerCase().trim()).catch(() => null);
  
  if (!email) {
    console.error('❌ Missing email in request');
    return json({ 
      success: false, 
      error: 'Email is required' 
    }, { status: 400 });
  }

  console.log(`🪄 Magic link request for: ${email}`);

  // Rate limiting check
  if (rateLimitCache.has(email)) {
    console.log(`⏰ Rate limited: ${email}`);
    return json({ 
      success: false, 
      error: 'Please wait before requesting another magic link' 
    }, { status: 429 });
  }

  // Check for pending requests
  if (pendingRequests.has(email)) {
    console.log(`⏳ Request already pending for: ${email}`);
    return json({ 
      success: false, 
      error: 'Magic link request already in progress' 
    }, { status: 429 });
  }

  try {
    // Mark request as pending
    pendingRequests.set(email, true);
    rateLimitCache.set(email, true);
    setTimeout(() => rateLimitCache.delete(email), 10000); // 10 second rate limit

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log(`🔍 Verifying ${email} with Beehiiv...`);

    // Call Beehiiv API to verify subscription
    const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
    const publicationId = 'pub_e08d5f43-7f7c-4c24-b546-f301ccd42a77';
    
    if (!beehiivApiKey || beehiivApiKey.length < 10) {
      console.error('❌ BEEHIIV_API_KEY missing or invalid');
      return json({ 
        success: false, 
        error: 'Configuration error' 
      }, { status: 500 });
    }

    // Verify Beehiiv subscription status
    const beehiivUrl = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/by_email/${encodeURIComponent(email)}`;
    console.log(`📡 Making API request to: ${beehiivUrl}`);

    const beehiivResponse = await fetch(beehiivUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${beehiivApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📡 Beehiiv API Response Status: ${beehiivResponse.status}`);

    let tier = 'free';
    let userExists = false;

    if (beehiivResponse.ok) {
      const beehiivData = await beehiivResponse.json();
      console.log(`✅ Beehiiv API response for ${email}:`, JSON.stringify(beehiivData, null, 2));

      if (beehiivData?.data) {
        userExists = true;
        const subscription = beehiivData.data;
        const apiTier = subscription.subscription_tier;
        
        // Determine tier from Beehiiv API response
        if (
          apiTier === 'premium' ||
          apiTier === 'Premium' ||
          (Array.isArray(subscription.subscription_premium_tier_names) && subscription.subscription_premium_tier_names.length > 0)
        ) {
          tier = 'premium';
        } else if (apiTier === 'paid' || apiTier === 'Paid') {
          tier = 'paid';
        }
      }
    } else if (beehiivResponse.status === 404) {
      console.log(`📝 Email not found in Beehiiv: ${email} - will create free subscription`);
      // User not in Beehiiv, will be created as free
    } else {
      console.error(`❌ Beehiiv API error: ${beehiivResponse.status}`);
      return json({ 
        success: false, 
        error: 'Unable to verify subscription status' 
      }, { status: 500 });
    }

    console.log(`✅ User verification complete - Email: ${email}, Exists: ${userExists}, Tier: ${tier}`);

    // Create Supabase client for OTP
    const anonSupabase = createClient(supabaseUrl, supabaseAnonKey);

    // Send OTP magic link via Supabase Auth
    const redirectUrl = `${req.headers.get('origin') || 'https://www.weeklywizdom.com'}/auth/callback?tier=${tier}`;
    
    const { error: otpError } = await anonSupabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: true,
        data: {
          tier: tier,
          beehiiv_verified: userExists,
          source: 'beehiiv'
        }
      }
    });

    if (otpError) {
      console.error('❌ Supabase OTP error:', otpError);
      return json({ 
        success: false, 
        error: 'Failed to send magic link' 
      }, { status: 500 });
    }

    console.log(`✅ Magic link sent successfully for ${email} with tier: ${tier}`);

    return json({ 
      success: true, 
      message: 'Magic link sent to your email',
      tier: tier
    });

  } catch (error) {
    console.error('❌ Magic link error:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  } finally {
    // Clean up pending request
    pendingRequests.delete(email);
  }
});
});