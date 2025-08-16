import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from 'npm:resend@2.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { MagicLinkEmail } from './_templates/magic-link.tsx';

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key",
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

  // Only accept POST requests
  if (req.method !== 'POST') {
    return json({ 
      success: false, 
      error: 'Method not allowed. Only POST requests are accepted.' 
    }, { status: 405 });
  }

  // Extract idempotency key from headers
  const idempotencyKey = req.headers.get('X-Idempotency-Key') || req.headers.get('x-idempotency-key');
  const requestId = idempotencyKey || crypto.randomUUID();
  
  console.log(`🔄 Processing magic link request [${requestId}]`);

  try {
    const { email } = await req.json();

    if (!email) {
      console.error(`❌ [${requestId}] Email is required`);
      return json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`📧 [${requestId}] Processing magic link request for: ${normalizedEmail}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Server-side idempotency check - this is the critical fix!
    if (idempotencyKey) {
      console.log(`🔍 [${requestId}] Checking idempotency for key: ${idempotencyKey}`);
      
      // Check if this exact request was already processed
      const { data: existingRequest, error: checkError } = await supabase
        .from('magic_link_idempotency')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        console.error(`❌ [${requestId}] Error checking idempotency:`, checkError);
        // Continue processing - don't fail on idempotency check errors
      } else if (existingRequest) {
        console.log(`🔄 [${requestId}] Duplicate request detected - returning cached response`);
        
        if (existingRequest.status === 'completed' && existingRequest.response_data) {
          return json({ 
            ...existingRequest.response_data,
            deduped: true,
            original_request_id: requestId
          }, { status: 202 });
        } else if (existingRequest.status === 'failed') {
          return json({ 
            success: false, 
            error: 'Previous request failed. Please try again.',
            deduped: true 
          }, { status: 400 });
        } else {
          // Still processing
          return json({ 
            success: false, 
            error: 'Request is still being processed. Please wait.',
            deduped: true 
          }, { status: 429 });
        }
      }

      // Record this request as being processed
      const { error: insertError } = await supabase
        .from('magic_link_idempotency')
        .insert({
          idempotency_key: idempotencyKey,
          email: normalizedEmail,
          status: 'processing',
          request_timestamp: new Date().toISOString()
        });

      if (insertError) {
        console.error(`❌ [${requestId}] Error recording idempotency:`, insertError);
        // Continue processing - don't fail on idempotency recording errors
      }
    } else {
      console.warn(`⚠️ [${requestId}] No idempotency key provided - proceeding without deduplication`);
    }

    // Rate limiting is handled by frontend deduplication logic

    // Get Beehiiv tier info
    const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
    const publicationId = 'pub_e08d5f43-7f7c-4c24-b546-f301ccd42a77';
    
    let tier = 'free';
    let isValidSubscriber = false;
    
    if (beehiivApiKey) {
      try {
        const beehiivUrl = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/by_email/${encodeURIComponent(normalizedEmail)}`;
        console.log(`🔍 [${requestId}] Checking Beehiiv subscription for: ${normalizedEmail}`);
        
        const beehiivResponse = await fetch(beehiivUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${beehiivApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (beehiivResponse.ok) {
          const beehiivData = await beehiivResponse.json();
          console.log(`📊 [${requestId}] Beehiiv API response for ${normalizedEmail}:`, beehiivData);
          
          if (beehiivData?.data) {
            isValidSubscriber = true; // Found in Beehiiv = valid subscriber
            const subscription = beehiivData.data;
            const apiTier = subscription.subscription_tier;
            
            console.log(`📋 [${requestId}] Subscription details - tier: ${apiTier}, status: ${subscription.status}`);
            
            // Determine tier based on subscription
            if (
              apiTier === 'premium' ||
              apiTier === 'Premium' ||
              (Array.isArray(subscription.subscription_premium_tier_names) && subscription.subscription_premium_tier_names.length > 0)
            ) {
              tier = 'premium';
            } else if (apiTier === 'paid' || apiTier === 'Paid') {
              tier = 'paid';
            } else {
              // Free tier subscriber - still valid!
              tier = 'free';
            }
            
            console.log(`✅ [${requestId}] Valid ${tier} subscriber found: ${normalizedEmail}`);
          } else {
            console.log(`❌ [${requestId}] No subscription data found for: ${normalizedEmail}`);
          }
        } else {
          console.error(`❌ [${requestId}] Beehiiv API error: ${beehiivResponse.status} - ${beehiivResponse.statusText}`);
          const errorText = await beehiivResponse.text();
          console.error(`❌ [${requestId}] Beehiiv API error response:`, errorText);
        }
      } catch (error) {
        console.error(`❌ [${requestId}] Beehiiv API request failed:`, error);
      }
    }

    // Only reject if NOT found in Beehiiv (not a subscriber at all)
    if (!isValidSubscriber) {
      console.log(`❌ [${requestId}] User not found in subscription list: ${normalizedEmail}`);
      
      // Update idempotency record with failure
      if (idempotencyKey) {
        await supabase
          .from('magic_link_idempotency')
          .update({ 
            status: 'failed',
            response_data: { 
              success: false, 
              error: 'Email not found in our subscription list. Please check your email or sign up for Weekly Wizdom newsletter first.' 
            }
          })
          .eq('idempotency_key', idempotencyKey);
      }
      
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
      console.error(`❌ [${requestId}] Error generating magic link:`, linkError);
      
      // Update idempotency record with failure
      if (idempotencyKey) {
        await supabase
          .from('magic_link_idempotency')
          .update({ 
            status: 'failed',
            response_data: { success: false, error: 'Failed to generate magic link' }
          })
          .eq('idempotency_key', idempotencyKey);
      }
      
      return json({ success: false, error: 'Failed to generate magic link' }, { status: 500 });
    }

    const magicLinkUrl = linkData.properties.action_link;
    console.log(`🔗 [${requestId}] Generated Supabase magic link URL: ${magicLinkUrl}`);

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
      tags: [
        { name: 'request_id', value: requestId },
        { name: 'tier', value: tier }
      ]
    });

    if (emailResult.error) {
      console.error(`❌ [${requestId}] Resend email error:`, emailResult.error);
      
      // Update idempotency record with failure
      if (idempotencyKey) {
        await supabase
          .from('magic_link_idempotency')
          .update({ 
            status: 'failed',
            response_data: { success: false, error: 'Failed to send email' }
          })
          .eq('idempotency_key', idempotencyKey);
      }
      
      return json({ 
        success: false, 
        error: 'Failed to send email' 
      }, { status: 500 });
    }

    console.log(`✅ [${requestId}] Magic link email sent via Resend:`, emailResult.data?.id);

    const successResponse = { 
      success: true, 
      tier: tier,
      message: 'Magic link sent successfully',
      action_link: magicLinkUrl,
      request_id: requestId,
      email_id: emailResult.data?.id
    };

    // Update idempotency record with success (WITHOUT sensitive action_link)
    if (idempotencyKey) {
      const sanitizedResponse = {
        success: true,
        tier: tier,
        message: 'Magic link sent successfully',
        request_id: requestId,
        email_id: emailResult.data?.id
        // NOTE: action_link intentionally omitted for security
      };
      
      await supabase
        .from('magic_link_idempotency')
        .update({ 
          status: 'completed',
          response_data: sanitizedResponse
        })
        .eq('idempotency_key', idempotencyKey);
    }

    return json(successResponse);

  } catch (error) {
    console.error(`❌ [${requestId}] Send magic link error:`, error);
    
    // Update idempotency record with failure
    if (idempotencyKey) {
      try {
        await supabase
          .from('magic_link_idempotency')
          .update({ 
            status: 'failed',
            response_data: { success: false, error: 'Internal server error' }
          })
          .eq('idempotency_key', idempotencyKey);
      } catch (updateError) {
        console.error(`❌ [${requestId}] Failed to update idempotency record:`, updateError);
      }
    }
    
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});