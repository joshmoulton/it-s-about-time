import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Resend } from 'npm:resend@2.0.0'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Send beta invite request received')

    const { email, accessLevel = 'premium' } = await req.json()
    
    console.log('📝 Request data:', { email, accessLevel })

    if (!email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the current user (who is sending the invite)
    const authHeader = req.headers.get('Authorization')
    let invitedBy = null
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      invitedBy = user?.id
    }

    console.log('👤 Invited by user:', invitedBy)

    // Check if invite already exists
    const { data: existingInvite } = await supabase
      .from('beta_invites')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'A pending invite already exists for this email' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the beta invite
    const { data: invite, error: inviteError } = await supabase
      .from('beta_invites')
      .insert({
        email: email,
        invited_by: invitedBy,
        access_level: accessLevel
      })
      .select()
      .single()

    if (inviteError) {
      console.error('❌ Error creating invite:', inviteError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create invite: ${inviteError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Beta invite created:', invite.id)

    // Generate invite URL using production domain
    const inviteUrl = `https://weeklywizdom.app/beta-invite/${invite.invite_token}?email=${encodeURIComponent(email)}`

    console.log('📧 Invite URL generated:', inviteUrl)

    // Send email using Resend
    try {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
      
      const emailResult = await resend.emails.send({
        from: 'Weekly Wizdom <noreply@weeklywizdom.app>',
        to: [email],
        subject: 'You\'re invited to Weekly Wizdom Beta!',
        html: `
          <h1>🎉 Welcome to Weekly Wizdom Beta!</h1>
          <p>You've been invited to test our platform with ${accessLevel} access for 30 days.</p>
          
          <div style="margin: 24px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; font-weight: 600;">Click the button below to accept your beta invite:</p>
          </div>
          
          <a href="${inviteUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">
            Accept Beta Invite
          </a>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${inviteUrl}</p>
          
          <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
            This invite expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
          
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            Weekly Wizdom - Your premium trading community
          </p>
        `,
      })

      if (emailResult.error) {
        console.error('❌ Resend email error:', emailResult.error)
        // Continue anyway - we still created the invite
      } else {
        console.log('✅ Beta invite email sent successfully:', emailResult.data?.id)
      }
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError)
      // Continue anyway - we still created the invite
    }

    return new Response(
      JSON.stringify({
        success: true,
        invite: {
          id: invite.id,
          email: invite.email,
          inviteUrl: inviteUrl,
          expiresAt: invite.expires_at
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An unexpected error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})