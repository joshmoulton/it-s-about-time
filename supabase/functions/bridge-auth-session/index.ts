import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface BridgeRequest {
  session_token: string;
  email: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_token, email }: BridgeRequest = await req.json();

    if (!session_token || !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session token and email required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate session token exists and is active
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', session_token)
      .eq('email', email)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      console.log('❌ Invalid session token:', sessionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired session' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get or create Supabase auth user
    let userId: string | null = null;

    // First try to find existing user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (!listError) {
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        userId = existingUser.id;
        console.log('✅ Found existing Supabase user:', userId);
      }
    }

    // Create user if doesn't exist
    if (!userId) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          auth_source: 'magic_link',
          session_token: session_token.substring(0, 8) + '...'
        }
      });

      if (createError) {
        console.error('❌ Failed to create user:', createError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create user session' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      userId = newUser.user?.id;
      console.log('✅ Created new Supabase user:', userId);
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get user ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Generate Supabase session tokens
    const { data: sessionResult, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: 'https://www.weeklywizdom.com/dashboard'
      }
    });

    if (tokenError || !sessionResult) {
      console.error('❌ Failed to generate session:', tokenError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate session tokens' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Extract tokens from the magic link
    const magicLink = sessionResult.properties?.action_link || '';
    const urlParams = new URL(magicLink).searchParams;
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      console.error('❌ Failed to extract tokens from magic link');
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to extract session tokens' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`✅ Session bridged successfully for ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        access_token: accessToken,
        refresh_token: refreshToken,
        user_id: userId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Bridge session error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});