import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupConfirmationEmail } from './_templates/signup-confirmation.tsx'
import { MagicLinkEmail } from './_templates/magic-link.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('AUTH_EMAIL_HOOK_SECRET') as string

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    // If webhook secret is configured, verify the webhook
    let eventData: any
    if (hookSecret) {
      const wh = new Webhook(hookSecret)
      eventData = wh.verify(payload, headers)
    } else {
      // Fallback for direct API calls
      eventData = JSON.parse(payload)
    }

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url },
    } = eventData

    console.log('📧 Processing auth email:', { 
      email: user.email, 
      action_type: email_action_type,
      redirect_to 
    })

    let emailTemplate: any
    let subject: string

    // Determine which template to use based on action type
    switch (email_action_type) {
      case 'signup':
        emailTemplate = React.createElement(SignupConfirmationEmail, {
          supabase_url: site_url || Deno.env.get('SUPABASE_URL') || '',
          token,
          token_hash,
          redirect_to: redirect_to || 'https://weeklywizdom.app/dashboard',
          email_action_type,
          user_email: user.email,
        })
        subject = 'Confirm your Weekly Wizdom account'
        break
      
      case 'magiclink':
        emailTemplate = React.createElement(MagicLinkEmail, {
          supabase_url: site_url || Deno.env.get('SUPABASE_URL') || '',
          token,
          token_hash,
          redirect_to: redirect_to || 'https://weeklywizdom.app/dashboard',
          email_action_type,
          user_email: user.email,
        })
        subject = 'Your Weekly Wizdom sign-in link'
        break
      
      default:
        // Default to magic link for any unrecognized type
        emailTemplate = React.createElement(MagicLinkEmail, {
          supabase_url: site_url || Deno.env.get('SUPABASE_URL') || '',
          token,
          token_hash,
          redirect_to: redirect_to || 'https://weeklywizdom.app/dashboard',
          email_action_type,
          user_email: user.email,
        })
        subject = 'Your Weekly Wizdom authentication link'
    }

    const html = await renderAsync(emailTemplate)

    const emailResult = await resend.emails.send({
      from: 'Weekly Wizdom <noreply@weeklywizdom.app>',
      to: [user.email],
      subject,
      html,
    })

    if (emailResult.error) {
      console.error('❌ Resend error:', emailResult.error)
      throw emailResult.error
    }

    console.log('✅ Auth email sent successfully:', emailResult.data?.id)

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: emailResult.data?.id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error: any) {
    console.error('❌ Error in auth-emails function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
        },
      }),
      {
        status: error.code === 'WEBHOOK_VERIFICATION_ERROR' ? 401 : 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})