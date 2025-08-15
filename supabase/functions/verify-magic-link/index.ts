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

    // Get or create user in Supabase auth with proper error handling
    console.log(`🔄 Looking up existing user for: ${tokenData.email}`);
    let authUser = null;
    
    // First try to find user by listing all users and filtering by email
    // Note: getUserByEmail doesn't exist in current Supabase JS library
    try {
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      
      if (!listError && usersData?.users) {
        authUser = usersData.users.find(user => user.email === tokenData.email);
        if (authUser) {
          console.log(`✅ Found existing user: ${authUser.id}`);
        } else {
          console.log(`❌ No existing user found for: ${tokenData.email}`);
        }
      } else {
        console.log(`⚠️ Error listing users: ${listError?.message}`);
      }
    } catch (error) {
      console.log(`⚠️ Error looking up user: ${error.message}`);
    }

    if (!authUser) {
      console.log(`🔐 Creating Supabase auth user for: ${tokenData.email}`);
      
      // Create user with email confirmation already set
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: tokenData.email,
        email_confirm: true,
        user_metadata: {
          subscription_tier: tokenData.tier,
          source: 'magic_link',
          verified_at: new Date().toISOString()
        }
      });

      if (createError) {
        console.log(`⚠️ Create user error: ${createError.message}`);
        // If user already exists, try to find them again
        if (createError.message?.includes('already been registered') || createError.message?.includes('email_exists')) {
          console.log(`🔄 User already exists, re-fetching: ${tokenData.email}`);
          try {
            const { data: retryUsersData, error: retryListError } = await supabase.auth.admin.listUsers();
            if (!retryListError && retryUsersData?.users) {
              authUser = retryUsersData.users.find(user => user.email === tokenData.email);
              if (authUser) {
                console.log(`✅ Successfully found existing user on retry: ${authUser.id}`);
              } else {
                throw new Error('User exists but could not be found');
              }
            } else {
              throw new Error(`Failed to list users: ${retryListError?.message}`);
            }
          } catch (retryError) {
            console.error('❌ Failed to fetch existing user on retry:', retryError);
            const errorResponse = req.method === 'POST' 
              ? JSON.stringify({ success: false, error: 'Authentication system error' })
              : 'Authentication system error';
            return new Response(errorResponse, { 
              status: 500,
              headers: req.method === 'POST' ? { 'content-type': 'application/json', ...corsHeaders } : {}
            });
          }
        } else {
          console.error('❌ Failed to create user:', createError);
          const errorResponse = req.method === 'POST' 
            ? JSON.stringify({ success: false, error: 'Failed to authenticate user' })
            : 'Failed to authenticate user';
          return new Response(errorResponse, { 
            status: 500,
            headers: req.method === 'POST' ? { 'content-type': 'application/json', ...corsHeaders } : {}
          });
        }
      } else {
        authUser = newUser.user;
        console.log(`✅ Successfully created new user: ${tokenData.email}`);
      }
    }

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