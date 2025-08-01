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

interface BeehiivResponse {
  success: boolean;
  verified: boolean;
  tier: 'free' | 'paid' | 'premium';
  tags?: string[];
  error?: string;
}

// Map Beehiiv tags to subscription tiers
function mapTagsToTier(tags: string[]): 'free' | 'paid' | 'premium' {
  if (!tags || tags.length === 0) return 'free';
  
  const lowerTags = tags.map(tag => tag.toLowerCase());
  
  // Check for premium indicators
  if (lowerTags.some(tag => 
    tag.includes('premium') || 
    tag.includes('vip') || 
    tag.includes('platinum')
  )) {
    return 'premium';
  }
  
  // Check for paid indicators
  if (lowerTags.some(tag => 
    tag.includes('paid') || 
    tag.includes('pro') || 
    tag.includes('subscriber') ||
    tag.includes('member')
  )) {
    return 'paid';
  }
  
  return 'free';
}

async function verifyBeehiivSubscriber(email: string): Promise<BeehiivResponse> {
  try {
    const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
    const publicationId = Deno.env.get('BEEHIIV_PUBLICATION_ID');
    
    if (!beehiivApiKey) {
      console.error('BEEHIIV_API_KEY not configured');
      return { success: false, verified: false, tier: 'free', error: 'API configuration error' };
    }

    if (!publicationId) {
      console.error('BEEHIIV_PUBLICATION_ID not configured');
      return { success: false, verified: false, tier: 'free', error: 'Publication ID not configured' };
    }

    console.log(`🔍 Verifying Beehiiv subscriber: ${email}`);

    // Use the correct API endpoint format from documentation
    const url = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/by_email/${encodeURIComponent(email)}`;
    console.log(`📡 Making API request to: ${url.replace(beehiivApiKey, 'REDACTED')}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${beehiivApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Beehiiv API error: ${response.status} ${response.statusText}`, errorText);
      
      if (response.status === 404) {
        console.log(`✅ Email not found in Beehiiv: ${email}`);
        return { success: true, verified: false, tier: 'free' };
      }
      
      return { success: false, verified: false, tier: 'free', error: `API error: ${response.status}` };
    }

    const data = await response.json();
    console.log(`✅ Beehiiv API response for ${email}:`, JSON.stringify(data, null, 2));

    if (!data || !data.data) {
      return { success: true, verified: false, tier: 'free' };
    }

    const subscription = data.data;
    const isActive = subscription.status === 'active';
    
    // Use the correct API fields: subscription_tier and subscription_premium_tier_names
    let tier: 'free' | 'paid' | 'premium' = 'free';
    
    if (subscription.subscription_tier === 'premium' || 
        (subscription.subscription_premium_tier_names && subscription.subscription_premium_tier_names.length > 0)) {
      tier = 'premium';
    } else if (subscription.subscription_tier === 'paid') {
      tier = 'paid';
    }
    
    // Keep tags for backward compatibility (though they don't exist in this API response)
    const tags = subscription.tags || [];
    
    // If direct tier detection fails, fall back to tag-based detection
    if (tier === 'free' && tags.length > 0) {
      tier = mapTagsToTier(tags);
    }

    console.log(`✅ Beehiiv verification complete - Email: ${email}, Active: ${isActive}, Tier: ${tier}, Direct API Tier: ${subscription.subscription_tier}, Premium Tiers: ${JSON.stringify(subscription.subscription_premium_tier_names)}`);

    // Log the verification for audit purposes
    await supabase.from('authentication_audit_log').insert({
      user_email: email,
      auth_method: 'beehiiv_verify',
      action_type: 'verify_subscriber',
      metadata: {
        verified: isActive,
        tier,
        subscription_tier: subscription.subscription_tier,
        premium_tier_names: subscription.subscription_premium_tier_names,
        tags,
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: true,
      verified: isActive,
      tier: tier,
      tags: tags
    };

  } catch (error) {
    console.error('Beehiiv verification error:', error);
    return { 
      success: false, 
      verified: false, 
      tier: 'free', 
      error: 'Verification failed' 
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const result = await verifyBeehiivSubscriber(normalizedEmail);

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
        verified: false, 
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