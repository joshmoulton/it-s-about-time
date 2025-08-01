
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // This function is now deprecated since we're using the official Whop React SDK
  // The WhopCheckoutEmbed component handles all checkout functionality directly
  return new Response(
    JSON.stringify({ 
      error: 'This endpoint is deprecated. Please use the Whop React SDK directly.',
      message: 'The WhopCheckoutEmbed component now handles all checkout functionality.'
    }),
    { 
      status: 410, // Gone
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
})
