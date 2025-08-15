import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let token, email;
    
    // Handle both GET (old URL-based) and POST (new API-based) requests
    if (req.method === 'GET') {
      const url = new URL(req.url);
      token = url.searchParams.get('token');
      const redirect = url.searchParams.get('redirect') || 'https://www.weeklywizdom.com/dashboard';
      
      if (!token) {
        console.log('❌ No token provided in GET request');
        return new Response('Invalid or missing token', { status: 400 });
      }
      
      // For GET requests, we need to extract email from token lookup
      console.log(`🔍 GET request - validating token: ${token.substring(0, 8)}...`);
    } else {
      // Handle POST request with JSON body
      const body = await req.json();
      token = body.token;
      email = body.email;
      
      if (!token || !email) {
        console.log('❌ Missing token or email in POST request');
        return new Response(JSON.stringify({ success: false, error: 'Token and email are required' }), { 
          status: 400,
          headers: { 'content-type': 'application/json', ...corsHeaders }
        });
      }
      
      console.log(`🔍 POST request - validating token: ${token.substring(0, 8)}... for email: ${email}`);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate the token - include email filter for POST requests
    const query = supabase
      .from('magic_link_tokens')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString());
      
    if (email) {
      query.eq('email', email);
    }
    
    const { data: tokenData, error: tokenError } = await query.maybeSingle();

    if (tokenError) {
      console.log('❌ Database error looking up token:', tokenError);
      const errorResponse = req.method === 'POST' 
        ? JSON.stringify({ success: false, error: 'Database error during verification' })
        : 'Database error during verification';
      return new Response(errorResponse, { 
        status: 500,
        headers: req.method === 'POST' ? { 'content-type': 'application/json', ...corsHeaders } : {}
      });
    }

    if (!tokenData) {
      console.log('❌ Invalid or expired token');
      const errorResponse = req.method === 'POST' 
        ? JSON.stringify({ success: false, error: 'Invalid or expired token' })
        : 'Invalid or expired token';
      return new Response(errorResponse, { 
        status: 400,
        headers: req.method === 'POST' ? { 'content-type': 'application/json', ...corsHeaders } : {}
      });
    }

    console.log(`✅ Token validated for: ${tokenData.email}`);

    // Delete token after use (one-time use) - but only after successful verification
    console.log(`🔄 Marking token as used for: ${tokenData.email}`);
    const tokenToDelete = token; // Store token before we potentially lose it

    // Create or get Supabase session for the user
    console.log(`🔄 Creating session for verified email: ${tokenData.email}`);
    
    // Use generateLink to create a session - this works whether user exists or not
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: tokenData.email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://www.weeklywizdom.com'}/dashboard`
      }
    });

    if (authError) {
      console.error('❌ Failed to generate auth session:', authError);
      const errorResponse = req.method === 'POST' 
        ? JSON.stringify({ success: false, error: 'Failed to create user session' })
        : 'Failed to create user session';
      return new Response(errorResponse, { 
        status: 500,
        headers: req.method === 'POST' ? { 'content-type': 'application/json', ...corsHeaders } : {}
      });
    }

    console.log(`✅ Auth session generated for: ${tokenData.email}`);
    
    // Extract access and refresh tokens from the magic link
    const magicLinkUrl = new URL(authData.properties.action_link);
    const accessToken = magicLinkUrl.searchParams.get('access_token');
    const refreshToken = magicLinkUrl.searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      console.error('❌ Failed to extract tokens from auth session');
      const errorResponse = req.method === 'POST' 
        ? JSON.stringify({ success: false, error: 'Failed to extract session tokens' })
        : 'Failed to extract session tokens';
      return new Response(errorResponse, { 
        status: 500,
        headers: req.method === 'POST' ? { 'content-type': 'application/json', ...corsHeaders } : {}
      });
    }

    // Get user info from the auth data
    const authUser = authData.user;
    console.log(`✅ Session tokens extracted for user: ${authUser?.id}`);

    // Ensure we have a valid user at this point
    if (!authUser) {
      console.error('❌ No valid user found after authentication process');
      const errorResponse = req.method === 'POST' 
        ? JSON.stringify({ success: false, error: 'Authentication failed' })
        : 'Authentication failed';
      return new Response(errorResponse, { 
        status: 500,
        headers: req.method === 'POST' ? { 'content-type': 'application/json', ...corsHeaders } : {}
      });
    }

    // Update user metadata with latest tier info
    console.log(`🔄 Updating user metadata for: ${tokenData.email}`);
    try {
      await supabase.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          ...authUser.user_metadata,
          subscription_tier: tokenData.tier,
          last_login_via: 'magic_link',
          verified_at: new Date().toISOString()
        }
      });
      console.log(`✅ User metadata updated successfully`);
    } catch (updateError) {
      console.warn('⚠️ Error updating user metadata:', updateError);
    }

    // Upsert subscriber in our database
    const { error: upsertError } = await supabase
      .from('beehiiv_subscribers')
      .upsert({
        email: tokenData.email,
        subscription_tier: tokenData.tier === 'premium' ? 'premium' : 'paid',
        status: 'active',
        metadata: { 
          source: 'magic_link_auth',
          last_verified: new Date().toISOString(),
          supabase_user_id: authUser.id
        }
      }, { onConflict: 'email' });

    if (upsertError) {
      console.warn('⚠️ Error upserting subscriber:', upsertError);
    } else {
      console.log(`✅ Subscriber record updated for: ${tokenData.email}`);
    }

    console.log(`✅ Magic link authentication complete for ${tokenData.email}`);
    
    // NOW delete the token after successful authentication
    await supabase
      .from('magic_link_tokens')
      .delete()
      .eq('token', tokenToDelete);
    console.log(`✅ Token deleted after successful verification for: ${tokenData.email}`);
    // Handle response based on request method
    if (req.method === 'POST') {
      // Return JSON response for API calls
      return new Response(JSON.stringify({
        success: true,
        user: {
          id: authUser.id,
          email: tokenData.email,
          subscription_tier: tokenData.tier,
          source: 'magic_link'
        },
        session: null // Frontend will handle session creation
      }), {
        headers: { 'content-type': 'application/json', ...corsHeaders }
      });
    } else {
      // Handle GET request with redirect
      const redirect = new URL(req.url).searchParams.get('redirect') || 'https://www.weeklywizdom.com/dashboard';
      const redirectUrl = new URL(redirect);
      redirectUrl.searchParams.set('verified', 'true');
      redirectUrl.searchParams.set('tier', tokenData.tier);
      redirectUrl.searchParams.set('email', tokenData.email);
      redirectUrl.searchParams.set('auth_method', 'magic_link');
      
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl.toString(),
          ...corsHeaders
        }
      });
    }
  } catch (error) {
    console.error('❌ Verify magic link error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});