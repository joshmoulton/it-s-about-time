import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referring_site?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, first_name, last_name, utm_source, utm_medium, utm_campaign, referring_site }: CreateSubscriptionRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
    if (!beehiivApiKey) {
      console.error('BEEHIIV_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Beehiiv API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create subscription in Beehiiv
    const customFields = [];
    if (first_name) customFields.push({ name: 'First Name', value: first_name });
    if (last_name) customFields.push({ name: 'Last Name', value: last_name });

    const subscriptionData = {
      email: email.toLowerCase().trim(),
      reactivate_existing: true,
      send_welcome_email: false,
      utm_source: utm_source || 'Weekly Wizdom App',
      utm_medium: utm_medium || 'signup',
      utm_campaign: utm_campaign || 'free_signup',
      referring_site: referring_site || 'app.weeklywizdom.com',
      custom_fields: customFields
    };

    console.log('Creating Beehiiv subscription for:', email);
    
    const beehiivResponse = await fetch(
      'https://api.beehiiv.com/v2/publications/pub_e08d5f43-7f7c-4c24-b546-f301ccd42a77/subscriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${beehiivApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      }
    );

    const beehiivResult = await beehiivResponse.json();
    
    if (!beehiivResponse.ok) {
      console.error('Beehiiv API error:', beehiivResult);
      
      // If user already exists, that's okay
      if (beehiivResult.error?.message?.includes('already exists') || 
          beehiivResult.error?.message?.includes('duplicate')) {
        console.log('User already exists in Beehiiv, continuing...');
      } else {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create Beehiiv subscription',
            details: beehiivResult.error?.message || 'Unknown error'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    console.log('Successfully created Beehiiv subscription for:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscriber created successfully',
        beehiiv_data: beehiivResponse.ok ? beehiivResult.data : null
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in beehiiv-create-subscription:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});