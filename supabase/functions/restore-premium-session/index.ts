import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

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
    const { email } = await req.json();
    
    if (!email) {
      throw new Error('Email is required');
    }

    console.log('🔄 Restoring premium session for:', email);

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, use our secure function to create/update the user in auth.users
    const { data: sessionData, error: sessionError } = await supabaseAdmin.rpc(
      'create_premium_user_session',
      { p_email: email }
    );

    if (sessionError || !sessionData?.success) {
      console.error('❌ Failed to create premium session:', sessionError);
      throw new Error(sessionData?.error || 'Failed to create premium session');
    }

    console.log('✅ Premium user session prepared:', sessionData);

    // Generate a JWT token for the user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://www.weeklywizdom.com'}/auth/callback`
      }
    });

    if (authError) {
      console.error('❌ Failed to generate auth link:', authError);
      throw new Error('Failed to generate authentication link');
    }

    console.log('✅ Magic link generated successfully');

    // Extract the actual session tokens from the magic link
    const linkUrl = new URL(authData.properties.action_link);
    const accessToken = linkUrl.searchParams.get('access_token');
    const refreshToken = linkUrl.searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      throw new Error('Failed to extract session tokens');
    }

    console.log('🎯 Session tokens extracted successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Premium session restored successfully',
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: sessionData.user_id,
          email: sessionData.email,
          subscription_tier: sessionData.subscription_tier
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('❌ Premium session restoration error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Session restoration failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});