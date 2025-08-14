import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Create local user request received')

    const { email, role = 'free', temporaryPassword } = await req.json()
    
    console.log('📝 Request data:', { email, role, hasPassword: !!temporaryPassword })

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

    // Validate role - should be subscription_tier values
    const validTiers = ['free', 'paid', 'premium']
    if (!validTiers.includes(role)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid subscription tier. Must be one of: ${validTiers.join(', ')}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify requesting user is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check admin permissions using authenticated client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    console.log('🔍 Checking admin permissions...')
    const { data: adminCheck, error: adminCheckError } = await supabase.rpc('is_current_user_admin')

    if (adminCheckError) {
      console.error('❌ Admin check error:', adminCheckError)
      return new Response(
        JSON.stringify({ success: false, error: `Admin check failed: ${adminCheckError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!adminCheck) {
      console.error('❌ User is not admin')
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Admin permissions verified')

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user already exists
    console.log('🔍 Checking if user already exists...')
    const { data: existingAuth } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    
    if (existingAuth.user) {
      console.log('⚠️ User already exists in auth')
      
      // Check if they have a beehiiv_subscribers record
      const { data: existingSubscriber } = await supabaseAdmin
        .from('beehiiv_subscribers')
        .select('*')
        .eq('email', email)
        .single()
      
      if (existingSubscriber) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'User already exists with subscription record' 
          }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      // User exists in auth but not in beehiiv_subscribers, so create the subscriber record
      console.log('🔧 Creating subscriber record for existing auth user...')
      const { error: subscriberError } = await supabaseAdmin
        .from('beehiiv_subscribers')
        .insert({
          email: email,
          subscription_tier: role,
          status: 'active'
        })

      if (subscriberError) {
        console.error('❌ Error creating subscriber record:', subscriberError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to create subscriber record: ${subscriberError.message}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: existingAuth.user.id,
            email: existingAuth.user.email,
            subscription_tier: role
          },
          message: 'Subscriber record created for existing user'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate password if not provided
    const password = temporaryPassword || generateSecurePassword()
    
    console.log('🔑 Creating new user account...')

    // Create the user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })

    if (authError) {
      console.error('❌ Auth error:', authError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create user account: ${authError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!authData.user) {
      console.error('❌ No user data returned')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User creation succeeded but no user data returned' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Auth user created successfully')

    // Create beehiiv subscriber record for the new user
    console.log('📝 Creating subscriber record...')
    const { error: subscriberError } = await supabaseAdmin
      .from('beehiiv_subscribers')
      .insert({
        email: email,
        subscription_tier: role,
        status: 'active'
      })

    if (subscriberError) {
      console.error('❌ Error creating subscriber record:', subscriberError)
      // Don't fail completely - auth user was created successfully
      console.log('⚠️ Auth user created but subscriber record failed')
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `User created but failed to create subscriber record: ${subscriberError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Subscriber record created successfully')
    
    console.log('✅ Local user created successfully')

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          subscription_tier: role
        },
        temporaryPassword: password,
        message: 'Local user created successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An unexpected error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}