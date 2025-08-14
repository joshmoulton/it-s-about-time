import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
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
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type }
    } = await req.json();

    if (email_action_type !== 'magiclink') {
      console.log(`Skipping non-magiclink email: ${email_action_type}`);
      return json({ success: true });
    }

    console.log(`📧 Skipping Supabase email interception for: ${user.email} - using custom auth flow`);
    
    // Let Supabase handle the default email since we're not using custom templates anymore

    return json({ success: true });

  } catch (error) {
    console.error('❌ Auth webhook error:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});