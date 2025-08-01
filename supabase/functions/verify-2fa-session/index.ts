import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { sessionToken } = await req.json()

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing sessionToken' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔐 Verifying 2FA session token')

    // Verify session token
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('admin_2fa_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .not('verified_at', 'is', null)
      .single()

    if (sessionError || !sessionData) {
      console.log('❌ Invalid or expired 2FA session')
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid or expired session'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if session is still within the recent verification window
    const verifiedAt = new Date(sessionData.verified_at)
    const now = new Date()
    const maxAgeMinutes = 15
    const isRecentlyVerified = (now.getTime() - verifiedAt.getTime()) < (maxAgeMinutes * 60 * 1000)

    if (!isRecentlyVerified) {
      console.log('❌ 2FA session verification expired')
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Session verification expired'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ 2FA session verified successfully')
    return new Response(
      JSON.stringify({ 
        valid: true,
        adminEmail: sessionData.admin_email,
        expiresAt: sessionData.expires_at,
        verifiedAt: sessionData.verified_at
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in verify-2fa-session function:', error)
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})