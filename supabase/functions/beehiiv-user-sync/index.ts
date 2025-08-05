import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BeehiivSegment {
  id: string;
  name: string;
  description: string;
}

interface BeehiivSubscriber {
  id: string;
  email: string;
  status: string;
  created: number;
  subscription_tier?: string;
}

interface VerificationResult {
  success: boolean;
  verified: boolean;
  tier: 'free' | 'premium';
  segments: string[];
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Beehiiv credentials
    const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY')
    if (!beehiivApiKey) {
      console.error('❌ BEEHIIV_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ success: false, error: 'API configuration missing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Parse request body
    const { email } = await req.json()
    
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`🔍 Verifying user subscription in Beehiiv for: ${email}`)

    // First, get all segments from Beehiiv
    const segmentsResponse = await fetch('https://api.beehiiv.com/v2/publications/pub_a1bb80bb-bd2e-4b34-98ee-dd09b06c1be5/segments', {
      headers: {
        'Authorization': `Bearer ${beehiivApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!segmentsResponse.ok) {
      const errorText = await segmentsResponse.text()
      console.error('❌ Failed to fetch segments:', errorText)
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          tier: 'free' as const,
          segments: [],
          error: 'Failed to fetch segments from Beehiiv' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const segmentsData = await segmentsResponse.json()
    const segments: BeehiivSegment[] = segmentsData.data || []
    
    console.log(`📊 Found ${segments.length} segments in Beehiiv`)

    let userVerified = false
    let userTier: 'free' | 'premium' = 'free'
    let userSegments: string[] = []

    // Check each segment for the user
    for (const segment of segments) {
      try {
        console.log(`🔍 Checking segment: ${segment.name}`)
        
        const subscribersResponse = await fetch(`https://api.beehiiv.com/v2/publications/pub_a1bb80bb-bd2e-4b34-98ee-dd09b06c1be5/segments/${segment.id}/subscribers`, {
          headers: {
            'Authorization': `Bearer ${beehiivApiKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (!subscribersResponse.ok) {
          console.warn(`⚠️ Failed to fetch subscribers for segment ${segment.name}`)
          continue
        }

        const subscribersData = await subscribersResponse.json()
        const subscribers: BeehiivSubscriber[] = subscribersData.data || []
        
        // Check if user is in this segment
        const userInSegment = subscribers.find(sub => sub.email.toLowerCase() === email.toLowerCase())
        
        if (userInSegment) {
          console.log(`✅ User found in segment: ${segment.name}`)
          userVerified = true
          userSegments.push(segment.name)
          
          // Check if this is a premium segment (contains "premium", "paid", or similar keywords)
          const segmentName = segment.name.toLowerCase()
          if (segmentName.includes('premium') || segmentName.includes('paid') || segmentName.includes('subscriber')) {
            userTier = 'premium'
            console.log(`💎 Premium tier detected from segment: ${segment.name}`)
          }
        }
      } catch (error) {
        console.error(`❌ Error checking segment ${segment.name}:`, error)
        continue
      }
    }

    const result: VerificationResult = {
      success: true,
      verified: userVerified,
      tier: userTier,
      segments: userSegments
    }

    // Log the verification result to Supabase
    try {
      await supabase.from('authentication_audit_log').insert({
        user_email: email,
        auth_method: 'beehiiv_verification',
        action_type: 'tier_verification',
        metadata: {
          verification_result: result,
          segments_checked: segments.length,
          verified_segments: userSegments
        }
      })
    } catch (auditError) {
      console.error('⚠️ Failed to log audit entry:', auditError)
    }

    console.log(`📋 Verification complete for ${email}:`, result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Beehiiv user sync error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        verified: false, 
        tier: 'free' as const,
        segments: [],
        error: 'Internal server error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})