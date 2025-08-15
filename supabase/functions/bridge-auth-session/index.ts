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

    console.log('⚠️ bridge-auth-session function is deprecated');
    console.log('➡️ Magic link users should use verify-magic-link function instead');

    // For now, return an error directing users to use magic links
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Session bridging is deprecated. Please request a new magic link from the homepage.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 410 }
    );

  } catch (error) {
    console.error('Bridge session error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Function deprecated. Please use magic link system.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 410 }
    );
  }
});