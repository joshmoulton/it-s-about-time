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

    if (tokenError || !tokenData) {
      console.log('❌ Invalid or expired token:', tokenError);
      const errorResponse = req.method === 'POST' 
        ? JSON.stringify({ success: false, error: 'Invalid or expired token' })
        : 'Invalid or expired token';
      return new Response(errorResponse, { 
        status: 400,
        headers: req.method === 'POST' ? { 'content-type': 'application/json', ...corsHeaders } : {}
      });
    }

    console.log(`✅ Token validated for: ${tokenData.email}`);

    // Delete token after use (one-time use)
    console.log(`🔄 Deleting used token for: ${tokenData.email}`);
    await supabase
      .from('magic_link_tokens')
      .delete()
      .eq('token', token);
    console.log(`✅ Token deleted for: ${tokenData.email}`);

    // Get or create user in Supabase auth with real session
    console.log(`🔄 Looking up existing user for: ${tokenData.email}`);
    let authUser;
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    authUser = existingUsers.users.find(u => u.email === tokenData.email);
    console.log(`${authUser ? '✅ Found existing user' : '❌ No existing user found'} for: ${tokenData.email}`);

    if (!authUser) {
      console.log(`🔐 Creating Supabase auth user for: ${tokenData.email}`);
      
      // Create user with temporary password they can reset later
      const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: tokenData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          subscription_tier: tokenData.tier,
          source: 'magic_link',
          verified_at: new Date().toISOString(),
          needs_password_setup: true
        }
      });

      if (createError) {
        // If user already exists, just fetch them instead of failing
        if (createError.message?.includes('already been registered')) {
          console.log(`🔄 User already exists, fetching existing user: ${tokenData.email}`);
          const { data: users } = await supabase.auth.admin.listUsers();
          authUser = users.users.find(u => u.email === tokenData.email);
          if (!authUser) {
            console.error('❌ Could not find existing user after creation error');
            return new Response('Failed to authenticate user', { status: 500 });
          }
        } else {
          console.error('❌ Error creating Supabase user:', createError);
          return new Response('Failed to create user account', { status: 500 });
        }
      } else {
        authUser = newUser.user;
      }
    } else {
      console.log(`🔄 Updating existing Supabase user: ${tokenData.email}`);
      
      // Update existing user metadata with latest tier info
      await supabase.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          ...authUser.user_metadata,
          subscription_tier: tokenData.tier,
          last_login_via: 'magic_link',
          verified_at: new Date().toISOString()
        }
      });
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
    }

    console.log(`✅ Magic link verified successfully for ${tokenData.email}, preparing authentication...`);
    
    // Update user metadata to sync subscription tier
    if (authUser) {
      console.log(`🔄 Updating user metadata for: ${tokenData.email}`);
      await supabase.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          ...authUser.user_metadata,
          subscription_tier: tokenData.tier,
          last_login_via: 'magic_link',
          verified_at: new Date().toISOString()
        }
      });
    }

    console.log(`✅ Magic link authentication complete for ${tokenData.email}`);
    
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