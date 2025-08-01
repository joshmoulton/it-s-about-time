import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BridgeAuthRequest {
  session_token: string;
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🌉 Bridge auth session request received');
    
    const { session_token, email }: BridgeAuthRequest = await req.json();
    
    if (!session_token || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing session_token or email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Validate session token against user_sessions table
    console.log('🔍 Validating session token for:', email);
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select(`
        *,
        beehiiv_subscribers!inner(*)
      `)
      .eq('session_token', session_token)
      .eq('beehiiv_subscribers.email', email)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      console.log('❌ Invalid session token or expired');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Session token validated for:', email);
    
    // Check if Supabase user exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    let supabaseUser;
    
    if (existingUser?.user) {
      // Update existing user
      console.log('🔄 Updating existing Supabase user:', email);
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.user.id,
        {
          user_metadata: {
            subscription_tier: sessionData.beehiiv_subscribers.subscription_tier,
            auth_method: 'enhanced_whop',
            last_bridge_at: new Date().toISOString()
          }
        }
      );
      
      if (updateError) {
        console.error('❌ Error updating user:', updateError);
        throw updateError;
      }
      
      supabaseUser = updatedUser.user;
    } else {
      // Create new Supabase user
      console.log('🆕 Creating new Supabase user for:', email);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          subscription_tier: sessionData.beehiiv_subscribers.subscription_tier,
          auth_method: 'enhanced_whop',
          created_via_bridge: true,
          last_bridge_at: new Date().toISOString()
        }
      });
      
      if (createError) {
        console.error('❌ Error creating user:', createError);
        throw createError;
      }
      
      supabaseUser = newUser.user;
    }

    // Generate access token for the user
    console.log('🎫 Generating access token for user:', supabaseUser?.id);
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateAccessToken(
      supabaseUser!.id
    );

    if (tokenError) {
      console.error('❌ Error generating access token:', tokenError);
      throw tokenError;
    }

    console.log('✅ Access token generated successfully');

    // Update last activity in user_sessions
    await supabaseAdmin
      .from('user_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('session_token', session_token);

    // Return the access token and user data
    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        user: {
          id: supabaseUser!.id,
          email: supabaseUser!.email,
          subscription_tier: sessionData.beehiiv_subscribers.subscription_tier
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Bridge auth session error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});