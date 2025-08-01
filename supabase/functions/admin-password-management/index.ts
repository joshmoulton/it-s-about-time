import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, userEmail, userType, password, requireReset, sessionId } = await req.json()

    console.log('🔐 Password management action:', { action, userEmail, userType })

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

    let result = { success: false, message: '' }

    switch (action) {
      case 'set_password':
        result = await setCustomPassword(supabaseClient, userEmail, userType, password, requireReset)
        break
      
      case 'generate_password':
        result = await generateRandomPassword(supabaseClient, userEmail, userType, requireReset)
        break
      
      case 'unlock_account':
        result = await unlockAccount(supabaseClient, userEmail, userType)
        break
      
      case 'revoke_sessions':
        result = await revokeAllSessions(supabaseClient, userEmail, userType)
        break
      
      case 'revoke_single_session':
        result = await revokeSingleSession(supabaseClient, sessionId)
        break
      
      case 'reset_2fa':
        result = await reset2FA(supabaseClient, userEmail)
        break
      
      default:
        result = { success: false, message: 'Unknown action' }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Password management error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function setCustomPassword(supabaseClient: any, userEmail: string, userType: string, password: string, requireReset: boolean) {
  const passwordHash = await hashPassword(password)
  
  try {
    if (userType === 'beehiiv' || userType === 'beehiiv_admin') {
      const { error } = await supabaseClient
        .from('beehiiv_subscribers')
        .update({
          password_hash: passwordHash,
          requires_password_setup: requireReset,
          locked_until: null,
          login_attempts: 0
        })
        .eq('email', userEmail)

      if (error) throw error
    } else if (userType === 'whop' || userType === 'whop_admin') {
      // For Whop users, we might need to store in a different table
      // This depends on your Whop integration setup
      return { success: false, message: 'Password setting not available for Whop users' }
    } else if (userType === 'supabase_auth' || userType === 'supabase_admin') {
      // For Supabase auth users, we need to find the user ID first
      const { data: users } = await supabaseClient.auth.admin.listUsers()
      const user = users.users.find((u: any) => u.email === userEmail)
      
      if (!user) {
        return { success: false, message: 'User not found in Supabase auth' }
      }

      const { error } = await supabaseClient.auth.admin.updateUserById(user.id, {
        password: password,
        password_confirm: password
      })

      if (error) throw error

      if (requireReset) {
        const { error: adminError } = await supabaseClient
          .from('admin_users')
          .update({ requires_password_reset: true })
          .eq('email', userEmail)

        if (adminError) console.warn('Could not set password reset requirement:', adminError)
      }
    } else {
      return { success: false, message: `Unsupported user type: ${userType}` }
    }

    return { success: true, message: 'Password set successfully' }
  } catch (error) {
    console.error('Error setting password:', error)
    return { success: false, message: 'Failed to set password' }
  }
}

async function generateRandomPassword(supabaseClient: any, userEmail: string, userType: string, requireReset: boolean) {
  const tempPassword = generateSecurePassword()
  const result = await setCustomPassword(supabaseClient, userEmail, userType, tempPassword, requireReset)
  
  if (result.success) {
    return { success: true, message: 'Random password generated', tempPassword }
  }
  
  return result
}

async function unlockAccount(supabaseClient: any, userEmail: string, userType: string) {
  try {
    if (userType === 'beehiiv' || userType === 'beehiiv_admin') {
      const { error } = await supabaseClient
        .from('beehiiv_subscribers')
        .update({
          locked_until: null,
          login_attempts: 0
        })
        .eq('email', userEmail)

      if (error) throw error
    } else {
      const { error } = await supabaseClient
        .from('admin_users')
        .update({
          locked_until: null,
          failed_2fa_attempts: 0
        })
        .eq('email', userEmail)

      if (error) throw error
    }

    return { success: true, message: 'Account unlocked successfully' }
  } catch (error) {
    console.error('Error unlocking account:', error)
    return { success: false, message: 'Failed to unlock account' }
  }
}

async function revokeAllSessions(supabaseClient: any, userEmail: string, userType: string) {
  try {
    // For Supabase auth users, we can revoke sessions via admin API
    if (userType === 'supabase_auth') {
      const { data: users } = await supabaseClient.auth.admin.listUsers()
      const user = users.users.find((u: any) => u.email === userEmail)
      
      if (user) {
        await supabaseClient.auth.admin.signOut(user.id)
      }
    }

    // Also clean up any custom session records
    const { error } = await supabaseClient
      .from('admin_secure_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('admin_email', userEmail)

    if (error) console.warn('Could not revoke admin sessions:', error)

    return { success: true, message: 'All sessions revoked successfully' }
  } catch (error) {
    console.error('Error revoking sessions:', error)
    return { success: false, message: 'Failed to revoke sessions' }
  }
}

async function revokeSingleSession(supabaseClient: any, sessionId: string) {
  try {
    const { error } = await supabaseClient
      .from('admin_secure_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (error) throw error

    return { success: true, message: 'Session revoked successfully' }
  } catch (error) {
    console.error('Error revoking session:', error)
    return { success: false, message: 'Failed to revoke session' }
  }
}

async function reset2FA(supabaseClient: any, userEmail: string) {
  try {
    const { error } = await supabaseClient
      .from('admin_2fa_secrets')
      .update({ is_enabled: false })
      .eq('admin_email', userEmail)

    if (error) throw error

    return { success: true, message: '2FA reset successfully' }
  } catch (error) {
    console.error('Error resetting 2FA:', error)
    return { success: false, message: 'Failed to reset 2FA' }
  }
}

function generateSecurePassword(): string {
  const length = 12
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  return password
}

async function hashPassword(password: string): Promise<string> {
  // Use the secure database function for password hashing instead of SHA-256
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  const { data, error } = await supabaseClient.rpc('hash_password', {
    password: password
  })
  
  if (error) {
    console.error('Password hashing error:', error)
    throw new Error('Failed to hash password')
  }
  
  return data
}