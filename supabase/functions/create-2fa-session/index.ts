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

    const { adminEmail, expiresMinutes = 15 } = await req.json()

    if (!adminEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing adminEmail' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🔐 Creating 2FA session for admin: ${adminEmail}`)

    // Generate secure session token
    const sessionToken = crypto.randomUUID() + '-' + Date.now()
    const expiresAt = new Date(Date.now() + (expiresMinutes * 60 * 1000)).toISOString()

    // Get client info from headers
    const userAgent = req.headers.get('user-agent') || null
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null

    // Clean up expired sessions first
    await supabaseClient
      .from('admin_2fa_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())

    // Create new session
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('admin_2fa_sessions')
      .insert({
        admin_email: adminEmail,
        session_token: sessionToken,
        expires_at: expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
        verified_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('❌ Failed to create 2FA session:', sessionError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create session' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log security event
    await supabaseClient
      .from('admin_security_events')
      .insert({
        admin_email: adminEmail,
        event_type: '2fa_session_created',
        success: true,
        event_details: {
          session_id: sessionData.id,
          expires_at: expiresAt,
          timestamp: new Date().toISOString(),
          user_agent: userAgent,
          ip_address: ipAddress
        }
      })

    console.log('✅ 2FA session created successfully')
    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionToken,
        expiresAt,
        expiresMinutes
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in create-2fa-session function:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})