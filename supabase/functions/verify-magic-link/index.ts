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
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const redirect = url.searchParams.get('redirect') || 'https://www.weeklywizdom.com/dashboard';

    if (!token) {
      console.log('❌ No token provided');
      return new Response('Invalid or missing token', { status: 400 });
    }

    console.log(`🔍 Validating magic link token for: ${token.substring(0, 8)}...`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('magic_link_tokens')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      console.log('❌ Invalid or expired token:', tokenError);
      return new Response('Invalid or expired token', { status: 403 });
    }

    console.log(`✅ Token validated for: ${tokenData.email}`);

    // Mark token as used
    await supabase
      .from('magic_link_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    // Get or create user in Supabase auth with real session
    let authUser;
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    authUser = existingUsers.users.find(u => u.email === tokenData.email);

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
        console.error('❌ Error creating Supabase user:', createError);
        return new Response('Failed to create user account', { status: 500 });
      }

      authUser = newUser.user;
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

    console.log(`✅ Magic link verified successfully for ${tokenData.email}, creating Supabase session...`);
    
    // Generate a real Supabase auth session
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: tokenData.email,
      options: {
        redirectTo: redirect
      }
    });

    if (sessionError || !sessionData.properties?.action_link) {
      console.error('❌ Error generating Supabase session:', sessionError);
      
      // Fallback: redirect with unified auth session data
      const unifiedSessionData = {
        email: tokenData.email,
        tier: tokenData.tier,
        source: 'magic_link',
        timestamp: new Date().toISOString(),
        supabase_user_id: authUser.id
      };

      const redirectUrl = new URL(redirect);
      redirectUrl.searchParams.set('session', btoa(JSON.stringify(unifiedSessionData)));
      redirectUrl.searchParams.set('verified', 'true');
      
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl.toString(),
          ...corsHeaders
        }
      });
    }

    console.log(`🎯 Redirecting to Supabase auth link for session creation`);
    
    // Redirect to Supabase magic link which will create the session and redirect to dashboard
    return new Response(null, {
      status: 302,
      headers: {
        'Location': sessionData.properties.action_link,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('❌ Verify magic link error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});