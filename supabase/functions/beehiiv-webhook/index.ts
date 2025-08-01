
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface BeehiivWebhookEvent {
  id: string;
  type: string;
  created: number;
  data: {
    subscriber?: {
      id: string;
      email: string;
      status: string;
      subscription_tier?: string;
      created: number;
      updated?: number;
    };
    subscription?: {
      id: string;
      subscriber_id: string;
      tier: string;
      status: string;
      created: number;
      updated?: number;
    };
  };
}

async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    console.log('Missing signature or secret');
    return false;
  }

  try {
    // Beehiiv uses HMAC-SHA256 with format: sha256=<hash>
    const expectedSignature = signature.replace('sha256=', '');
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(body);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return computedSignature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

async function processSubscriberEvent(event: BeehiivWebhookEvent) {
  const { subscriber } = event.data;
  if (!subscriber) return;

  console.log(`Processing subscriber event: ${event.type} for ${subscriber.email}`);

  // Map Beehiiv status to our status
  const statusMapping: Record<string, string> = {
    'active': 'active',
    'inactive': 'inactive',
    'unsubscribed': 'unsubscribed',
    'pending': 'pending',
    'validating': 'validating'
  };

  // Map Beehiiv tier to our tier
  const tierMapping: Record<string, string> = {
    'free': 'free',
    'paid': 'paid',
    'premium': 'premium'
  };

  const mappedStatus = statusMapping[subscriber.status] || subscriber.status;
  const mappedTier = tierMapping[subscriber.subscription_tier || 'free'] || 'free';

  try {
    // Upsert subscriber with webhook tracking
    const { error: upsertError } = await supabase
      .from('beehiiv_subscribers')
      .upsert({
        email: subscriber.email,
        beehiiv_subscriber_id: subscriber.id,
        status: mappedStatus,
        subscription_tier: mappedTier,
        last_webhook_update: new Date().toISOString(),
        webhook_version: (Date.now() / 1000) | 0, // Unix timestamp as version
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      });

    if (upsertError) {
      throw upsertError;
    }

    console.log(`✅ Successfully processed ${event.type} for ${subscriber.email}`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Error processing subscriber event:`, error);
    throw error;
  }
}

async function processSubscriptionEvent(event: BeehiivWebhookEvent) {
  const { subscription } = event.data;
  if (!subscription) return;

  console.log(`Processing subscription event: ${event.type} for subscriber ${subscription.subscriber_id}`);

  // Map subscription tier
  const tierMapping: Record<string, string> = {
    'free': 'free',
    'paid': 'paid',
    'premium': 'premium'
  };

  const mappedTier = tierMapping[subscription.tier] || 'free';

  try {
    // Update subscriber tier based on subscription change
    const { error: updateError } = await supabase
      .from('beehiiv_subscribers')
      .update({
        subscription_tier: mappedTier,
        last_webhook_update: new Date().toISOString(),
        webhook_version: (Date.now() / 1000) | 0,
        updated_at: new Date().toISOString()
      })
      .eq('beehiiv_subscriber_id', subscription.subscriber_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Successfully updated subscription tier to ${mappedTier} for subscriber ${subscription.subscriber_id}`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Error processing subscription event:`, error);
    throw error;
  }
}

async function logWebhookEvent(
  event: BeehiivWebhookEvent,
  status: string,
  errorMessage?: string
) {
  const subscriberEmail = event.data.subscriber?.email || 
                         (event.data.subscription ? 'subscription_event' : 'unknown');

  await supabase
    .from('beehiiv_webhook_logs')
    .insert({
      event_type: event.type,
      event_id: event.id,
      webhook_data: event,
      status,
      error_message: errorMessage,
      subscriber_email: subscriberEmail
    });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get webhook settings
    const { data: webhookSettings } = await supabase
      .from('system_settings')
      .select('setting_value')
      .in('setting_key', ['beehiiv_webhook_secret', 'beehiiv_webhook_enabled']);

    const webhookSecret = webhookSettings?.find(s => s.setting_key === 'beehiiv_webhook_secret')?.setting_value?.value;
    const webhookEnabled = webhookSettings?.find(s => s.setting_key === 'beehiiv_webhook_enabled')?.setting_value?.enabled;

    if (!webhookEnabled) {
      console.log('🚫 Beehiiv webhooks are disabled');
      return new Response('Webhooks disabled', { 
        status: 200,
        headers: corsHeaders 
      });
    }

    // Get request body and signature
    const body = await req.text();
    const signature = req.headers.get('beehiiv-signature') || req.headers.get('x-beehiiv-signature');

    console.log('🔐 Verifying webhook signature...');

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = await verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.log('❌ Invalid webhook signature');
        return new Response('Invalid signature', { 
          status: 401,
          headers: corsHeaders 
        });
      }
      console.log('✅ Webhook signature verified');
    } else if (webhookSecret) {
      console.log('⚠️ Webhook secret configured but no signature provided');
      return new Response('Missing signature', { 
        status: 401,
        headers: corsHeaders 
      });
    } else {
      console.log('⚠️ No webhook secret configured - processing without verification');
    }

    // Parse webhook event
    const event: BeehiivWebhookEvent = JSON.parse(body);
    console.log(`📨 Received webhook event: ${event.type} (ID: ${event.id})`);

    let result = { success: true };

    // Process different event types
    switch (event.type) {
      case 'subscriber.created':
      case 'subscriber.updated':
      case 'subscriber.status_changed':
        result = await processSubscriberEvent(event);
        break;
        
      case 'subscription.upgraded':
      case 'subscription.downgraded':
      case 'subscription.cancelled':
      case 'subscription.created':
        result = await processSubscriptionEvent(event);
        break;
        
      case 'post.published':
      case 'post.updated':
        // Trigger newsletter sync when a new post is published
        console.log(`📰 Newsletter post event: ${event.type}`);
        const { error: syncError } = await supabase.functions.invoke('newsletter-sync', {
          body: { action: 'sync_newsletters' }
        });
        if (syncError) {
          console.error('Failed to trigger newsletter sync:', syncError);
        } else {
          console.log('✅ Triggered newsletter sync');
        }
        result = { success: true };
        break;
        
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
        result = { success: true }; // Don't fail for unknown events
    }

    // Log successful processing
    await logWebhookEvent(event, 'success');

    return new Response(JSON.stringify({ 
      success: true, 
      processed: result.success,
      event_type: event.type 
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);

    // Try to log the error if we can parse the event
    try {
      const body = await req.text();
      const event = JSON.parse(body);
      await logWebhookEvent(event, 'error', error.message);
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return new Response(JSON.stringify({ 
      error: 'Webhook processing failed',
      message: error.message 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    });
  }
});
