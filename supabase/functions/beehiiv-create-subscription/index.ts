import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, utm_source = 'Weekly Wizdom App', utm_medium = 'signup', utm_campaign = 'free_signup', referring_site } = await req.json()

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

    console.log(`🆕 Creating Beehiiv subscription for: ${email}`)

    // Create Beehiiv subscription using the provided curl command structure
    const beehiivResponse = await fetch('https://api.beehiiv.com/v2/publications/pub_4c830f49-6c5e-4e8b-b1b5-1e2be2c55d49/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('BEEHIIV_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        reactivate_existing: false,
        send_welcome_email: true,
        utm_source,
        utm_medium,
        utm_campaign,
        referring_site: referring_site || 'https://app.weeklywizdom.com'
      })
    })

    if (!beehiivResponse.ok) {
      const errorData = await beehiivResponse.text()
      console.error(`❌ Beehiiv API error (${beehiivResponse.status}):`, errorData)
      
      // Check if user already exists
      if (beehiivResponse.status === 400 && errorData.includes('already exists')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'EMAIL_EXISTS',
            message: 'This email is already subscribed. Please sign in instead.' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create Beehiiv subscription',
          details: errorData 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const beehiivData = await beehiivResponse.json()
    console.log(`✅ Beehiiv subscription created successfully for: ${email}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Free Beehiiv subscription created successfully',
        data: beehiivData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error creating Beehiiv subscription:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})