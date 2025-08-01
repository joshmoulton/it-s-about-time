import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current user's JWT to verify admin status
    const authHeader = req.headers.get('Authorization')!
    const jwt = authHeader.replace('Bearer ', '')
    
    // Verify user is admin before proceeding
    const { data: user } = await supabaseClient.auth.getUser(jwt)
    if (!user.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: adminCheck } = await supabaseClient
      .from('admin_users')
      .select('role')
      .eq('email', user.user.email)
      .eq('is_active', true)
      .single()

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Fetching all users for admin dashboard...')
    
    // Fetch BeehiIV subscribers
    const { data: beehiivUsers, error: beehiivError } = await supabaseClient
      .from('beehiiv_subscribers')
      .select('*')
      .order('created_at', { ascending: false })

    if (beehiivError) {
      console.error('Error fetching BeehiIV users:', beehiivError)
      throw beehiivError
    }

    // Fetch Whop authenticated users
    const { data: whopUsers, error: whopError } = await supabaseClient
      .from('whop_authenticated_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (whopError) {
      console.error('Error fetching Whop users:', whopError)
      throw whopError
    }

    // Fetch Supabase auth users (admin users)
    const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      throw authError
    }

    // Fetch admin user mappings
    const { data: adminUsers, error: adminUsersError } = await supabaseClient
      .from('admin_users')
      .select('*')

    if (adminUsersError) {
      console.error('Error fetching admin users:', adminUsersError)
      throw adminUsersError
    }

    // Transform and combine all users
    const allUsers = []

    // Add BeehiIV subscribers
    beehiivUsers?.forEach(user => {
      const adminUser = adminUsers?.find(admin => admin.subscriber_id === user.id)
      allUsers.push({
        id: user.id,
        email: user.email,
        display_email: user.email,
        subscription_tier: user.subscription_tier,
        status: user.status,
        user_type: adminUser ? 'beehiiv_admin' : 'beehiiv_subscriber',
        role: adminUser?.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        metadata: user.metadata,
        source: 'beehiiv'
      })
    })

    // Add Whop users
    whopUsers?.forEach(user => {
      const adminUser = adminUsers?.find(admin => admin.email === user.user_email)
      allUsers.push({
        id: user.id,
        email: user.user_email,
        display_email: user.user_email,
        subscription_tier: user.subscription_tier,
        status: 'active',
        user_type: adminUser ? 'whop_admin' : 'whop_user',
        role: adminUser?.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        whop_user_id: user.whop_user_id,
        whop_purchase_id: user.whop_purchase_id,
        source: 'whop'
      })
    })

    // Add Supabase auth users (local admins)
    authUsers.users?.forEach(user => {
      const adminUser = adminUsers?.find(admin => admin.email === user.email)
      if (adminUser) { // Only include if they're actually admin users
        allUsers.push({
          id: user.id,
          email: user.email,
          display_email: user.email,
          subscription_tier: 'free',
          status: user.email_confirmed_at ? 'active' : 'pending',
          user_type: 'supabase_admin',
          role: adminUser.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_sign_in_at: user.last_sign_in_at,
          source: 'supabase'
        })
      }
    })

    // Remove duplicates based on email
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.email === user.email)
    )

    console.log(`✅ Successfully fetched ${uniqueUsers.length} unique users from all sources`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        users: uniqueUsers,
        count: uniqueUsers.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in list-all-users function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})