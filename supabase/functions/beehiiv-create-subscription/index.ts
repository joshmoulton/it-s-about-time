import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface CreateSubscriptionRequest {
  email: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

interface BeehiivCreateResponse {
  success: boolean;
  subscription_id?: string;
  tier: 'free' | 'paid' | 'premium';
  error?: string;
}

async function createBeehiivSubscription(request: CreateSubscriptionRequest): Promise<BeehiivCreateResponse> {
  try {
    const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
    const publicationId = 'pub_e08d5f43-7f7c-4c24-b546-f301ccd42a77'; // Weekly Wizdom publication ID
    
    if (!beehiivApiKey) {
      console.error('BEEHIIV_API_KEY not configured');
      return { success: false, tier: 'free', error: 'API configuration error' };
    }

    console.log(`📝 Creating Beehiiv subscription for: ${request.email}`);

    // Create subscription via Beehiiv API
    const url = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`;
    
    const subscriptionData = {
      email: request.email.toLowerCase().trim(),
      reactivate_existing: true,
      send_welcome_email: true,
      utm_source: request.utm_source || 'Weekly Wizdom App',
      utm_medium: request.utm_medium || 'app_signup',
      utm_campaign: request.utm_campaign || 'free_tier_auto_enrollment'
    };

    console.log(`📡 Making subscription request to: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${beehiivApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData)
    });

    console.log(`📡 Subscription API Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Beehiiv subscription API error: ${response.status} ${response.statusText}`, errorText);
      
      // If user already exists, that's okay - treat as success
      if (response.status === 400 && errorText.includes('already exists')) {
        console.log(`✅ User already exists in Beehiiv: ${request.email}`);
        return { success: true, tier: 'free', subscription_id: 'existing' };
      }
      
      return { success: false, tier: 'free', error: `Subscription API error: ${response.status}` };
    }

    const data = await response.json();
    console.log(`✅ Beehiiv subscription created for ${request.email}:`, JSON.stringify(data, null, 2));

    // Extract subscription ID from response
    const subscriptionId = data.data?.id;
    
    // All new subscriptions start as free tier
    const tier = 'free';

    // Store the subscription locally for caching
    await supabase.from('beehiiv_subscribers').upsert({
      email: request.email.toLowerCase().trim(),
      subscription_tier: tier,
      status: 'active',
      metadata: {
        source: 'auto_enrollment',
        beehiiv_subscription_id: subscriptionId,
        utm_source: request.utm_source,
        utm_medium: request.utm_medium,
        utm_campaign: request.utm_campaign,
        created_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'email'
    });

    // Log the subscription creation for audit purposes
    await supabase.from('authentication_audit_log').insert({
      user_email: request.email,
      auth_method: 'beehiiv_create',
      action_type: 'create_subscription',
      metadata: {
        tier,
        beehiiv_subscription_id: subscriptionId,
        utm_source: request.utm_source,
        utm_medium: request.utm_medium,
        utm_campaign: request.utm_campaign,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Successfully created and stored subscription for ${request.email} with tier ${tier}`);

    return {
      success: true,
      subscription_id: subscriptionId,
      tier: tier
    };

  } catch (error) {
    console.error('Beehiiv subscription creation error:', error);
    return { 
      success: false, 
      tier: 'free', 
      error: 'Subscription creation failed' 
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: CreateSubscriptionRequest = await req.json();

    if (!request.email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const result = await createBeehiivSubscription(request);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Request processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        tier: 'free', 
        error: 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});