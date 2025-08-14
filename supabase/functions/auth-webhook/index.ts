import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
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
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type }
    } = await req.json();

    if (email_action_type !== 'magiclink') {
      console.log(`Skipping non-magiclink email: ${email_action_type}`);
      return json({ success: true });
    }

    console.log(`📧 Intercepting magic link email for: ${user.email}`);

    // Get Beehiiv tier info
    const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
    const publicationId = 'pub_e08d5f43-7f7c-4c24-b546-f301ccd42a77';
    
    let tier = 'free';
    if (beehiivApiKey) {
      try {
        const beehiivUrl = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/by_email/${encodeURIComponent(user.email)}`;
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

    // Create the magic link URL from Supabase's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const magicLinkUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    // Send email using Resend with our custom template
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const html = await renderAsync(
      React.createElement(MagicLinkEmail, {
        magicLink: magicLinkUrl,
        userTier: tier,
        email: user.email,
      })
    );

    const emailResult = await resend.emails.send({
      from: 'Weekly Wizdom <noreply@weeklywizdom.app>',
      to: [user.email],
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

    // Update user metadata with tier info when they click the link
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const serviceSupabase = createClient(supabaseUrl!, serviceKey!);
    
    await serviceSupabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        subscription_tier: tier,
        source: 'beehiiv',
        verified_at: new Date().toISOString()
      }
    });

    return json({ success: true });

  } catch (error) {
    console.error('❌ Auth webhook error:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});