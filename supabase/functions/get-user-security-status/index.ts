import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userEmail } = await req.json()

    // Verify admin permissions
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin
    const { data: adminUser } = await supabaseClient
      .from('admin_users')
      .select('role')
      .eq('email', user.email)
      .single()

    if (!adminUser) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let securityStatus = {
      isLocked: false,
      failedAttempts: 0,
      has2FA: false,
      requiresPasswordReset: false,
      lastLogin: null
    }

    // Check beehiiv subscribers
    const { data: beehiivUser } = await supabaseClient
      .from('beehiiv_subscribers')
      .select('locked_until, login_attempts, last_login_at')
      .eq('email', userEmail)
      .single()

    if (beehiivUser) {
      securityStatus.isLocked = beehiivUser.locked_until && new Date(beehiivUser.locked_until) > new Date()
      securityStatus.failedAttempts = beehiivUser.login_attempts || 0
      securityStatus.lastLogin = beehiivUser.last_login_at
    }

    // Check admin users
    const { data: adminUserData } = await supabaseClient
      .from('admin_users')
      .select('locked_until, failed_2fa_attempts, last_login_at, requires_password_reset')
      .eq('email', userEmail)
      .single()

    if (adminUserData) {
      securityStatus.isLocked = securityStatus.isLocked || (adminUserData.locked_until && new Date(adminUserData.locked_until) > new Date())
      securityStatus.failedAttempts = Math.max(securityStatus.failedAttempts, adminUserData.failed_2fa_attempts || 0)
      securityStatus.requiresPasswordReset = adminUserData.requires_password_reset
      securityStatus.lastLogin = securityStatus.lastLogin || adminUserData.last_login_at
    }

    // Check 2FA status
    const { data: twoFAStatus } = await supabaseClient
      .from('admin_2fa_secrets')
      .select('is_enabled')
      .eq('admin_email', userEmail)
      .single()

    if (twoFAStatus) {
      securityStatus.has2FA = twoFAStatus.is_enabled
    }

    return new Response(JSON.stringify(securityStatus), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Get user security status error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})