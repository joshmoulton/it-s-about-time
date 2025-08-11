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

    // Require authenticated admin (verify_jwt is enabled by default)
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: userData, error: userErr } = await supabaseClient.auth.getUser(token)
    if (userErr || !userData?.user?.email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid auth token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const adminEmail = userData.user.email!

    const { data: adminRow, error: adminCheckErr } = await supabaseClient
      .from('admin_users')
      .select('id, is_active')
      .eq('email', adminEmail)
      .eq('is_active', true)
      .single()

    if (adminCheckErr || !adminRow) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { expiresMinutes = 15 } = await req.json().catch(() => ({ expiresMinutes: 15 }))

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
        verified_at: null
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