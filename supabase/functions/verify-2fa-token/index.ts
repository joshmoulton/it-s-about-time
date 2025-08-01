import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticator } from 'https://esm.sh/otplib@12.0.1'

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

    const { adminEmail, token, tokenType = 'totp' } = await req.json()

    if (!adminEmail || !token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing adminEmail or token' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🔐 Verifying ${tokenType} token for admin: ${adminEmail}`)

    // Get 2FA secrets for the admin
    const { data: secretData, error: secretError } = await supabaseClient
      .from('admin_2fa_secrets')
      .select('secret_key, backup_codes, is_enabled')
      .eq('admin_email', adminEmail)
      .eq('is_enabled', true)
      .single()

    if (secretError || !secretData) {
      console.error('❌ No 2FA secret found for admin:', adminEmail)
      return new Response(
        JSON.stringify({ success: false, error: '2FA not enabled for this admin' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let isValid = false

    if (tokenType === 'backup') {
      // Verify backup code
      const backupCodes = secretData.backup_codes || []
      isValid = backupCodes.includes(token.toUpperCase())
      
      if (isValid) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter(code => code !== token.toUpperCase())
        await supabaseClient
          .from('admin_2fa_secrets')
          .update({ 
            backup_codes: updatedCodes,
            last_used_at: new Date().toISOString()
          })
          .eq('admin_email', adminEmail)
        
        console.log('✅ Backup code verified and removed')
      }
    } else {
      // Verify TOTP token
      try {
        isValid = authenticator.verify({
          token: token,
          secret: secretData.secret_key
        })
        
        if (isValid) {
          // Update last used time
          await supabaseClient
            .from('admin_2fa_secrets')
            .update({ last_used_at: new Date().toISOString() })
            .eq('admin_email', adminEmail)
        }
      } catch (error) {
        console.error('❌ TOTP verification error:', error)
        isValid = false
      }
    }

    // Log security event
    await supabaseClient
      .from('admin_security_events')
      .insert({
        admin_email: adminEmail,
        event_type: '2fa_verification',
        success: isValid,
        event_details: {
          token_type: tokenType,
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent'),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        }
      })

    if (isValid) {
      console.log('✅ 2FA token verified successfully')
      return new Response(
        JSON.stringify({ success: true, message: '2FA token verified' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.log('❌ Invalid 2FA token')
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('❌ Error in verify-2fa-token function:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})