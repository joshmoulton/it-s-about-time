import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { token, email } = await req.json();

    if (!token || !email) {
      return json({ success: false, error: 'Token and email are required' }, { status: 400 });
    }

    console.log(`🔍 Magic link verify called with token: ${token?.substring(0, 8)}... and email: ${email}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate the magic link token
    const { data: tokenData, error: tokenError } = await supabase
      .from('magic_link_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .single();

    if (tokenError || !tokenData) {
      console.log('❌ Invalid or expired token:', tokenError);
      return json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 400 });
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (now > expiresAt) {
      console.log('❌ Token has expired');
      return json({ 
        success: false, 
        error: 'Token has expired' 
      }, { status: 400 });
    }

    // Check if token has already been used
    if (tokenData.used) {
      console.log('❌ Token has already been used');
      return json({ 
        success: false, 
        error: 'Token has already been used' 
      }, { status: 400 });
    }

    // Mark token as used
    const { error: updateError } = await supabase
      .from('magic_link_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token);

    if (updateError) {
      console.error('❌ Error marking token as used:', updateError);
      return json({ 
        success: false, 
        error: 'Failed to process token' 
      }, { status: 500 });
    }

    // Find or create user in auth.users
    let authUser;
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
    
    if (existingUser.user) {
      authUser = existingUser.user;
      console.log('✅ Found existing Supabase user');
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          subscription_tier: tokenData.tier,
          source: 'magic_link'
        }
      });

      if (createError || !newUser.user) {
        console.error('❌ Error creating auth user:', createError);
        return json({ 
          success: false, 
          error: 'Failed to create user account' 
        }, { status: 500 });
      }

      authUser = newUser.user;
      console.log('✅ Created new Supabase user');
    }

    // Update user metadata with latest tier
    const { error: metadataError } = await supabase.auth.admin.updateUserById(authUser.id, {
      user_metadata: {
        ...authUser.user_metadata,
        subscription_tier: tokenData.tier,
        source: 'magic_link',
        last_magic_link_login: new Date().toISOString()
      }
    });

    if (metadataError) {
      console.warn('⚠️ Could not update user metadata:', metadataError);
    }

    // Upsert subscriber data
    const { error: subscriberError } = await supabase
      .from('beehiiv_subscribers')
      .upsert({
        email: email,
        subscription_tier: tokenData.tier,
        status: 'active',
        metadata: {
          source: 'magic_link',
          verified_at: new Date().toISOString()
        }
      }, { 
        onConflict: 'email' 
      });

    if (subscriberError) {
      console.warn('⚠️ Could not upsert subscriber:', subscriberError);
    }

    // Generate session tokens for the frontend
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: 'https://www.weeklywizdom.com/dashboard'
      }
    });

    console.log('✅ Magic link verification successful');

    return json({
      success: true,
      user: {
        id: authUser.id,
        email: email,
        subscription_tier: tokenData.tier,
        source: 'magic_link'
      },
      session: sessionData?.properties ? {
        access_token: sessionData.properties.access_token,
        refresh_token: sessionData.properties.refresh_token
      } : null
    });

  } catch (error) {
    console.error('❌ Magic link verification error:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});