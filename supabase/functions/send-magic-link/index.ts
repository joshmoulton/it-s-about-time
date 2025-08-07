
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4.0.0'
import React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { MagicLinkEmail } from './magic-link-template.tsx'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!

const resend = new Resend(resendApiKey)

interface MagicLinkRequest {
  email: string
}

// Generate a secure random token
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    const { email }: MagicLinkRequest = await req.json()
    
    console.log(`🪄 Magic link request for: ${email}`)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Use unified auth verification to get proper user tier and create user if needed
    console.log(`🔍 Verifying ${email} with unified auth...`)
    
    const { data: verificationData, error: verifyError } = await supabase.functions.invoke('unified-auth-verify', {
      body: { email: email.toLowerCase() }
    })

    let userTier = 'free'
    let isNewUser = false

    if (verifyError) {
      console.error('❌ Unified auth verification failed:', verifyError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to verify your account. Please try again or contact support.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!verificationData?.success || !verificationData?.verified) {
      // User doesn't exist, auto-enroll them as free subscriber
      console.log(`📝 User not found, creating free subscription...`)
      
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('beehiiv-create-subscription', {
        body: { 
          email: email.toLowerCase(),
          utm_source: 'Weekly Wizdom App',
          utm_medium: 'magic_link_signup',
          utm_campaign: 'auto_enrollment'
        }
      })

      if (subscriptionError || !subscriptionData?.success) {
        console.error('❌ Failed to create Beehiiv subscription:', subscriptionError || subscriptionData?.error)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create your free subscription. Please try again or contact support.' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`✅ Successfully created free subscription for ${email}`)
      userTier = 'free'
      isNewUser = true
    } else {
      // User exists, use their existing tier from unified verification
      userTier = verificationData.tier || 'free'
      console.log(`✅ Existing user found - Tier: ${userTier}, Source: ${verificationData.source}`)
    }

    // Generate secure token for temporary session (no local storage)
    const customToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store only the temporary session token in user_sessions (not user data)
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        session_token: customToken,
        tier: userTier,
        source: 'beehiiv',
        expires_at: expiresAt.toISOString()
      });

    if (sessionError) {
      console.error('❌ Failed to create session token:', sessionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate access token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create custom magic link URL that points to your app
    const redirectUrl = `https://www.weeklywizdom.com/auth/verify?token=${customToken}&email=${encodeURIComponent(email)}`;

    // Render email template with welcome message for new users
    const emailHtml = await renderAsync(
      React.createElement(MagicLinkEmail, {
        supabase_url: '', // Not needed for custom flow
        token: customToken,
        token_hash: customToken,
        redirect_to: 'https://www.weeklywizdom.com/dashboard',
        email_action_type: 'magiclink',
        user_email: email,
        magic_link_url: redirectUrl,
        is_new_user: isNewUser,
        user_tier: userTier
      })
    )

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: 'Weekly Wizdom <noreply@weeklywizdom.app>',
      to: [email],
      subject: isNewUser ? 'Welcome to Weekly Wizdom - Your access link' : 'Your Weekly Wizdom access link',
      html: emailHtml,
    })

    if (emailResult.error) {
      console.error('❌ Resend error:', emailResult.error)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Magic link sent successfully via Resend:', emailResult.data?.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isNewUser ? 'Welcome! Access link sent to your email.' : 'Access link sent successfully',
        email_id: emailResult.data?.id,
        is_new_user: isNewUser,
        tier: userTier
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Magic link error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
