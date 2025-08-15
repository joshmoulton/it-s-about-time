import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from 'npm:resend@2.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { MagicLinkEmail } from './_templates/magic-link.tsx';

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", ...corsHeaders },
    ...init,
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`📧 Processing magic link request for: ${normalizedEmail}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // SERVER-SIDE RATE LIMITING: Check for recent tokens
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const { data: recentTokens } = await supabase
      .from('magic_link_tokens')
      .select('email, created_at')
      .eq('email', normalizedEmail)
      .gt('created_at', thirtySecondsAgo)
      .gt('expires_at', new Date().toISOString());

    if (recentTokens && recentTokens.length > 0) {
      console.log(`🚫 Rate limit: Recent token exists for ${normalizedEmail} (${recentTokens.length} found)`);
      return json({ 
        success: true, 
        message: 'Magic link already sent. Please check your email or wait 30 seconds before requesting again.',
        rateLimited: true
      });
    }

    // Get Beehiiv tier info
    const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
    const publicationId = 'pub_e08d5f43-7f7c-4c24-b546-f301ccd42a77';
    
    let tier = 'free';
    if (beehiivApiKey) {
      try {
        const beehiivUrl = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/by_email/${encodeURIComponent(email)}`;
        const beehiivResponse = await fetch(beehiivUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${beehiivApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (beehiivResponse.ok) {
          const beehiivData = await beehiivResponse.json();
          if (beehiivData?.data) {
            const subscription = beehiivData.data;
            const apiTier = subscription.subscription_tier;
            
            if (
              apiTier === 'premium' ||
              apiTier === 'Premium' ||
              (Array.isArray(subscription.subscription_premium_tier_names) && subscription.subscription_premium_tier_names.length > 0)
            ) {
              tier = 'premium';
            } else if (apiTier === 'paid' || apiTier === 'Paid') {
              tier = 'paid';
            }
          }
        }
      } catch (error) {
        console.warn('Could not fetch Beehiiv data:', error);
      }
    }

    if (tier === 'free') {
      return json({ 
        success: false, 
        error: 'Email not found in our subscription list. Please check your email or sign up for Weekly Wizdom newsletter first.' 
      }, { status: 400 });
    }

    // Generate Supabase magic link using admin.generateLink
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: {
        redirectTo: 'https://www.weeklywizdom.com/auth/callback',
        data: {
          subscription_tier: tier,
          source: 'magic_link'
        }
      }
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('❌ Error generating magic link:', linkError);
      return json({ success: false, error: 'Failed to generate magic link' }, { status: 500 });
    }

    const magicLinkUrl = linkData.properties.action_link;
    console.log(`🔗 Generated Supabase magic link URL: ${magicLinkUrl}`);

    // Send email using Resend with our custom template
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const html = await renderAsync(
      React.createElement(MagicLinkEmail, {
        magicLink: magicLinkUrl,
        userTier: tier,
        email: normalizedEmail,
      })
    );

    const emailResult = await resend.emails.send({
      from: 'Weekly Wizdom <noreply@weeklywizdom.app>',
      to: [normalizedEmail],
      subject: 'Access Your Weekly Wizdom Account',
      html,
    });

    if (emailResult.error) {
      console.error('❌ Resend email error:', emailResult.error);
      return json({ 
        success: false, 
        error: 'Failed to send email' 
      }, { status: 500 });
    }

    console.log('✅ Magic link email sent via Resend:', emailResult.data?.id);

    return json({ 
      success: true, 
      tier: tier,
      message: 'Magic link sent successfully',
      action_link: magicLinkUrl
    });

  } catch (error) {
    console.error('❌ Send magic link error:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});