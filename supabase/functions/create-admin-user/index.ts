
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 create-admin-user function started')
    
    // Create Supabase client with service role for admin operations
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

    console.log('✅ Service role client created')

    // Since JWT verification should be disabled, we'll handle authentication manually
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('❌ No Authorization header found')
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Authorization header found')

    // Extract the token
    const token = authHeader.replace('Bearer ', '')
    console.log('🔑 Token extracted, length:', token.length)
    
    // Create an anon client to verify the token
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    // Verify the token
    const { data: { user }, error: tokenError } = await anonClient.auth.getUser(token)
    
    if (tokenError) {
      console.error('❌ Token verification failed:', tokenError)
      return new Response(
        JSON.stringify({ error: `Token verification failed: ${tokenError.message}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!user) {
      console.log('❌ No user found in token')
      return new Response(
        JSON.stringify({ error: 'No user found in authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User verified:', user.email)

    // Check if the requesting user is an admin using service role
    const { data: adminUsers, error: adminCheckError } = await supabaseAdmin
      .from('admin_users')
      .select('role, is_active')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    console.log('🔍 Admin check result:', { adminUsers, adminCheckError, userEmail: user.email })

    if (adminCheckError || !adminUsers) {
      console.error('❌ Admin check failed:', adminCheckError)
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions - admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Admin verification passed')

    // Parse request body
    const { email, password, role } = await req.json()
    console.log('📝 Request data:', { email, role })

    if (!email || !password || !role) {
      console.log('❌ Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Email, password, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔄 Creating user in Supabase Auth...')

    // Create the user in Supabase Auth using service role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        user_type: 'supabase_admin'
      }
    })

    if (authError) {
      console.error('❌ Error creating user in auth:', authError)
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authData.user) {
      console.log('❌ User creation failed - no user data returned')
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User created in auth:', authData.user.id)
    console.log('🔄 Creating admin user record...')

    // Create standalone admin user record
    const { error: adminUserError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        email: email.toLowerCase().trim(),
        role,
        user_type: 'supabase_admin',
        is_active: true,
        subscriber_id: null // Explicitly set to null for standalone admins
      })

    if (adminUserError) {
      console.error('❌ Error creating admin user:', adminUserError)
      // Clean up the auth user if admin creation fails
      console.log('🔄 Cleaning up auth user...')
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: `Failed to create admin user: ${adminUserError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Admin user record created successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Standalone admin user created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role,
          user_type: 'supabase_admin'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('🚨 Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
