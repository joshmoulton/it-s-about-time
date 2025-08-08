
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!


interface AuthRequest {
  action: 'password_login' | 'setup_password' | 'reset_password'
  email: string
  password?: string
  reset_token?: string
  new_password?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { action, email, password, reset_token, new_password }: AuthRequest = await req.json()

    console.log(`🔐 Enhanced auth request: ${action} for ${email}`)

    switch (action) {
      case 'password_login':
        return await handlePasswordLogin(supabase, email, password!)
      case 'setup_password':
        return await handlePasswordSetup(supabase, email, password!)
      case 'reset_password':
        return await handlePasswordReset(supabase, email, reset_token, new_password)
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('❌ Enhanced auth error:', error)
    
    // Don't expose internal error details to client
    const sanitizedError = error instanceof Error && error.message.includes('rate limit') 
      ? 'Too many attempts. Please try again later.'
      : 'Authentication failed. Please try again.';
    
    return new Response(
      JSON.stringify({ success: false, error: sanitizedError }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handlePasswordLogin(supabase: any, email: string, password: string) {
  console.log(`🔑 Password login attempt for: ${email}`)

  // First verify with Beehiiv API before proceeding with password login
  console.log(`🔍 Verifying ${email} with Beehiiv API first...`)
  
  const { data: verificationData, error: verifyError } = await supabase.functions.invoke('unified-auth-verify', {
    body: { email: email.toLowerCase() }
  })

  if (verifyError || !verificationData.success) {
    console.error('❌ Beehiiv verification failed:', verifyError || verificationData.error)
    await logAuthEvent(supabase, email, 'password', 'login_failed_beehiiv_verification')
    return new Response(
      JSON.stringify({ success: false, error: 'Email not found in subscriber database' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!verificationData.verified) {
    console.error('❌ User not verified in Beehiiv or Whop')
    await logAuthEvent(supabase, email, 'password', 'login_failed_subscription_required')
    return new Response(
      JSON.stringify({ success: false, error: 'Access denied - subscription required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log(`✅ Beehiiv verification successful - Tier: ${verificationData.tier}, Source: ${verificationData.source}`)

  // Check if account is locked
  const { data: lockCheck } = await supabase.rpc('is_account_locked', { p_email: email })
  if (lockCheck) {
    await logAuthEvent(supabase, email, 'password', 'login_failed_locked')
    return new Response(
      JSON.stringify({ success: false, error: 'Account is temporarily locked' }),
      { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get or create user record, update with latest Beehiiv data
  let { data: user, error: userError } = await supabase
    .from('beehiiv_subscribers')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (userError || !user) {
    // Create new user based on Beehiiv verification
    const { data: newUser, error: createError } = await supabase
      .from('beehiiv_subscribers')
      .insert({
        email: email.toLowerCase(),
        status: 'active',
        subscription_tier: verificationData.tier,
        requires_password_setup: true,
        metadata: {
          created_from_beehiiv_verification: new Date().toISOString(),
          verification_source: verificationData.source
        }
      })
      .select()
      .single()

    if (createError || !newUser) {
      await logAuthEvent(supabase, email, 'password', 'login_failed_user_creation')
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    user = newUser
  } else {
    // Update existing user with latest Beehiiv data
    await supabase
      .from('beehiiv_subscribers')
      .update({
        subscription_tier: verificationData.tier,
        status: 'active',
        updated_at: new Date().toISOString(),
        metadata: {
          ...user.metadata,
          last_beehiiv_verification: new Date().toISOString(),
          verification_source: verificationData.source
        }
      })
      .eq('id', user.id)

    // Update user object with new tier
    user.subscription_tier = verificationData.tier
  }

  // Check if password setup is required
  if (user.requires_password_setup || !user.password_hash) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Password setup required',
        requires_setup: true 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify password using pgcrypto
  const { data: passwordValid } = await supabase.rpc('verify_password', {
    email: email.toLowerCase(),
    password: password
  })

  if (!passwordValid) {
    // Increment login attempts
    const newAttempts = (user.login_attempts || 0) + 1
    const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null // 15 minutes

    await supabase
      .from('beehiiv_subscribers')
      .update({ 
        login_attempts: newAttempts,
        locked_until: lockUntil?.toISOString()
      })
      .eq('id', user.id)

    await logAuthEvent(supabase, email, 'password', 'login_failed_invalid_password')
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid email or password' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Use the tier from Beehiiv verification (already checked Whop and Beehiiv)
  let finalTier = verificationData.tier
  
  // Check beta access expiration for legacy beta users
  if (user.beta_user && user.beta_access_expires_at) {
    const betaExpired = new Date(user.beta_access_expires_at) < new Date()
    if (betaExpired) {
      console.log(`⏰ Beta access expired for ${email}, using Beehiiv tier: ${finalTier}`)
      // Update beta access status
      await supabase
        .from('beehiiv_subscribers')
        .update({ 
          beta_access_granted: false,
          subscription_tier: finalTier
        })
        .eq('id', user.id)
    } else {
      console.log(`✅ Beta access still valid for ${email}, upgrading to premium`)
      finalTier = 'premium' // Beta users get premium access
    }
  }

  // Successful login - reset attempts and update last login
  await supabase
    .from('beehiiv_subscribers')
    .update({ 
      login_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
      subscription_tier: finalTier
    })
    .eq('id', user.id)

  // Create session
  const sessionToken = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  await supabase
    .from('user_sessions')
    .insert({
      subscriber_id: user.id,
      session_token: sessionToken,
      auth_method: 'password',
      expires_at: expiresAt.toISOString()
    })

  await logAuthEvent(supabase, email, 'password', 'login_success')

  return new Response(
    JSON.stringify({
      success: true,
      user: { ...user, subscription_tier: finalTier },
      session_token: sessionToken,
      auth_method: 'password'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}


async function handlePasswordSetup(supabase: any, email: string, password: string) {
  console.log(`🔧 Password setup for: ${email}`)

  // Validate password strength
  const { data: isValid } = await supabase.rpc('validate_password_strength', { password })
  if (!isValid) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Password must be at least 8 characters with letters and numbers' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Hash password using pgcrypto
  const { data: hashedPassword } = await supabase.rpc('hash_password', { password })

  // Update user record
  const { error } = await supabase
    .from('beehiiv_subscribers')
    .update({
      password_hash: hashedPassword,
      requires_password_setup: false,
      login_attempts: 0,
      locked_until: null
    })
    .eq('email', email.toLowerCase())

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to setup password' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  await logAuthEvent(supabase, email, 'password', 'password_setup_complete')

  return new Response(
    JSON.stringify({ success: true, message: 'Password setup complete' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handlePasswordReset(supabase: any, email: string, resetToken?: string, newPassword?: string) {
  if (!resetToken && !newPassword) {
    // Generate reset token
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

    await supabase
      .from('beehiiv_subscribers')
      .update({
        password_reset_token: token,
        password_reset_expires_at: expiresAt.toISOString()
      })
      .eq('email', email.toLowerCase())

    await logAuthEvent(supabase, email, 'password', 'reset_token_generated')

    // TODO: Send reset email (integrate with email service)
    return new Response(
      JSON.stringify({ success: true, message: 'Reset token generated', token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } else {
    // Validate reset token and update password
    const { data: user } = await supabase
      .from('beehiiv_subscribers')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password_reset_token', resetToken)
      .gt('password_reset_expires_at', new Date().toISOString())
      .single()

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired reset token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate new password
    const { data: isValid } = await supabase.rpc('validate_password_strength', { password: newPassword })
    if (!isValid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Password must be at least 8 characters with letters and numbers' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash new password and clear reset token
    const { data: hashedPassword } = await supabase.rpc('hash_password', { password: newPassword })

    await supabase
      .from('beehiiv_subscribers')
      .update({
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_expires_at: null,
        login_attempts: 0,
        locked_until: null
      })
      .eq('id', user.id)

    await logAuthEvent(supabase, email, 'password', 'password_reset_complete')

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset complete' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}


async function logAuthEvent(supabase: any, email: string, method: string, action: string, metadata = {}) {
  await supabase.rpc('log_auth_event', {
    p_user_email: email,
    p_auth_method: method,
    p_action_type: action,
    p_metadata: metadata
  })
}
