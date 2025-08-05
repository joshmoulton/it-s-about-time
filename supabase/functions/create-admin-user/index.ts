
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
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

    // Since JWT verification is disabled, we need to manually verify the admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the token and verify it manually using service role
    const token = authHeader.replace('Bearer ', '')
    
    // Create a client to verify the JWT token
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    // Verify the token by setting it in the client
    const { data: { user }, error: tokenError } = await authClient.auth.getUser(token)
    
    if (tokenError || !user) {
      console.error('Token verification failed:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the requesting user is an admin using service role
    const { data: adminUsers, error: adminCheckError } = await supabaseAdmin
      .from('admin_users')
      .select('role, is_active')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    console.log('Admin check result:', { adminUsers, adminCheckError, userEmail: user.email })

    if (adminCheckError || !adminUsers) {
      console.error('Admin check failed:', adminCheckError)
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions - admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email, password, role } = await req.json()

    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
      console.error('Error creating user in auth:', authError)
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
      console.error('Error creating admin user:', adminUserError)
      // Clean up the auth user if admin creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: `Failed to create admin user: ${adminUserError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
