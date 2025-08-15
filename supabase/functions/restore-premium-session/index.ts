import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    console.log('⚠️ restore-premium-session function is deprecated');
    console.log('➡️ Please use send-magic-link function instead');

    // Redirect to our custom magic link system
    return new Response(
      JSON.stringify({
        success: false,
        error: 'This function is deprecated. Please use the magic link system from the homepage.',
        redirect_to: 'magic_link_system'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 410, // Gone
      },
    );

  } catch (error) {
    console.error('❌ Premium session restoration error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'This function is deprecated. Please use the magic link system from the homepage.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 410,
      },
    );
  }
});