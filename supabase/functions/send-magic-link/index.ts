
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4.0.0'
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

// Rate limiting cache to prevent duplicate requests
const pendingRequests = new Map();
const rateLimitCache = new Map();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  const startTime = Date.now();
  let email: string;

  try {
    const body = await req.json();
    email = body.email?.toLowerCase().trim();
    
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting - only allow one request per email per 10 seconds
    const now = Date.now();
    const rateLimitKey = `rate_limit_${email}`;
    const lastRequestTime = rateLimitCache.get(rateLimitKey) || 0;
    
    if (now - lastRequestTime < 10000) {
      console.log(`🚫 Rate limited: ${email} - last request was ${now - lastRequestTime}ms ago`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Please wait before requesting another magic link' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for pending requests for this email
    if (pendingRequests.has(email)) {
      console.log(`🔄 Request already in progress for: ${email}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'A magic link request is already being processed for this email' 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Mark request as pending
    pendingRequests.set(email, startTime);
    rateLimitCache.set(rateLimitKey, now);

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

    // Create simple HTML email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${isNewUser ? 'Welcome to Weekly Wizdom!' : 'Access your Weekly Wizdom account'}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a73e8; margin: 0;">Weekly Wizdom</h1>
          </div>
          
          ${isNewUser ? `
            <h2 style="color: #333; text-align: center;">Welcome to Weekly Wizdom! 🎉</h2>
            <p>Thank you for joining our community! We've created your free subscription and you're all set to start receiving valuable crypto insights.</p>
            <p>Click the button below to access your dashboard and explore all the features available to you:</p>
          ` : `
            <h2 style="color: #333; text-align: center;">Access Your Account</h2>
            <p>Click the button below to securely access your Weekly Wizdom account:</p>
          `}
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${redirectUrl}" style="background-color: #1a73e8; color: white; text-decoration: none; padding: 16px 32px; border-radius: 6px; display: inline-block; font-weight: bold;">
              ${isNewUser ? 'Get Started Now' : 'Sign In to Your Account'}
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 12px; border-radius: 4px; border: 1px solid #e9ecef; font-size: 14px;">${redirectUrl}</p>
          
          ${isNewUser ? `
            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; margin: 24px 0; padding: 20px;">
              <p style="margin: 8px 0; font-weight: bold;">What's Next?</p>
              <p style="margin: 8px 0; font-size: 14px;">
                • Access your personalized dashboard<br/>
                • Read our latest newsletter insights<br/>
                • Explore premium features<br/>
                • Join our community discussions
              </p>
            </div>
          ` : ''}
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 32px;">
            This link will expire in 30 minutes for security. If you didn't request this email, you can safely ignore it.
          </p>
          
          <div style="border-top: 1px solid #f0f0f0; padding-top: 20px; text-align: center; font-size: 12px; color: #898989; margin-top: 32px;">
            <a href="https://www.weeklywizdom.app" style="color: #1a73e8; text-decoration: none;">Weekly Wizdom</a><br/>
            Your trusted source for crypto insights and trading signals.
          </div>
        </body>
      </html>
    `

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
  } finally {
    // Always clean up pending request
    if (email) {
      pendingRequests.delete(email);
    }
  }
})
