import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BeehiivSegment {
  id: string
  name: string
  description: string
  status: string
  created: number
  updated: number
}

interface BeehiivSubscriber {
  id: string
  email: string
  status: 'active' | 'inactive' | 'pending'
  subscription_tier: 'free' | 'premium'
  created: number
  stripe_customer_id?: string
}

interface VerificationResult {
  success: boolean
  verified: boolean
  tier: 'free' | 'premium'
  segments: string[]
  error?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY')
    const beehiivPubId = Deno.env.get('BEEHIIV_PUBLICATION_ID')

    if (!beehiivApiKey || !beehiivPubId) {
      console.error('Missing Beehiiv credentials')
      return new Response(
        JSON.stringify({ error: 'Missing Beehiiv API credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔍 Starting segment-based verification for: ${email}`)

    // Step 1: Fetch all segments
    const segmentsResponse = await fetch(
      `https://api.beehiiv.com/v2/publications/${beehiivPubId}/segments`,
      {
        headers: {
          'Authorization': `Bearer ${beehiivApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!segmentsResponse.ok) {
      throw new Error(`Failed to fetch segments: ${segmentsResponse.status}`)
    }

    const segmentsData = await segmentsResponse.json()
    const segments: BeehiivSegment[] = segmentsData.data || []

    console.log(`📊 Found ${segments.length} segments`)

    // Step 2: Check each segment for the user's email
    const userSegments: string[] = []
    let isPremium = false

    for (const segment of segments) {
      if (segment.status !== 'active') continue

      console.log(`🔍 Checking segment: ${segment.name}`)

      try {
        const segmentSubscribersResponse = await fetch(
          `https://api.beehiiv.com/v2/publications/${beehiivPubId}/segments/${segment.id}/subscriptions`,
          {
            headers: {
              'Authorization': `Bearer ${beehiivApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!segmentSubscribersResponse.ok) {
          console.warn(`⚠️ Failed to fetch subscribers for segment ${segment.name}: ${segmentSubscribersResponse.status}`)
          continue
        }

        const segmentData = await segmentSubscribersResponse.json()
        const subscribers: BeehiivSubscriber[] = segmentData.data || []

        // Check if user is in this segment
        const userInSegment = subscribers.some(sub => sub.email.toLowerCase() === email.toLowerCase())

        if (userInSegment) {
          userSegments.push(segment.name)
          console.log(`✅ User found in segment: ${segment.name}`)

          // Check if this is the premium segment
          if (segment.name.toLowerCase().includes('premium')) {
            isPremium = true
          }
        }
      } catch (error) {
        console.error(`❌ Error checking segment ${segment.name}:`, error)
        continue
      }
    }

    // Step 3: Determine tier and verification status
    const verified = userSegments.length > 0
    const tier = isPremium ? 'premium' : 'free'

    console.log(`🎯 Verification result - Email: ${email}, Verified: ${verified}, Tier: ${tier}, Segments: ${userSegments.join(', ')}`)

    // Step 4: Log verification (no personal data stored)
    await supabase.from('authentication_audit_log').insert({
      user_email: email,
      auth_method: 'beehiiv_segment_check',
      action_type: 'segment_verification',
      metadata: {
        verified,
        tier,
        segments_count: userSegments.length,
        segments: userSegments,
        verification_timestamp: new Date().toISOString()
      }
    })

    const result: VerificationResult = {
      success: true,
      verified,
      tier,
      segments: userSegments
    }

    if (!verified) {
      result.error = 'No newsletter subscription found in any segment'
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: verified ? 200 : 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Beehiiv segment verification error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        verified: false, 
        tier: 'free', 
        segments: [],
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})