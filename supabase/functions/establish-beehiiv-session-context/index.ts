import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SessionRequest {
  email: string
  subscription_tier: 'free' | 'paid' | 'premium'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { email, subscription_tier }: SessionRequest = await req.json()

    console.log(`🔧 Establishing Supabase session context for: ${email} (${subscription_tier})`)

    // Call the database function to establish session context
    const { data, error } = await supabase.rpc('establish_beehiiv_session_context', {
      p_email: email.toLowerCase().trim(),
      p_subscription_tier: subscription_tier
    })

    if (error) {
      console.error('❌ Failed to establish session context:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to establish session context',
          details: error.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Session context established successfully:', data)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data,
        message: 'Session context established successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Session context error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Session context failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})