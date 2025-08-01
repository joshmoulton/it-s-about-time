import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  action: 'reset_password' | 'bulk_delete' | 'delete_user' | 'update_user' | 'remove_beta_users';
  userEmail?: string;
  userType?: string;
  generatePassword?: boolean;
  userIds?: string[];
  userEmails?: string[];
  userId?: string;
  updates?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, userEmail, userType, generatePassword, userIds, userEmails, userId, updates }: RequestBody = await req.json()

    console.log('Admin user action:', { action, userEmail, userType, userIds, userEmails, userId })

    switch (action) {
      case 'remove_beta_users':
        console.log('🧹 Starting beta users cleanup...');
        
        try {
          // Get beta/test users from beehiiv_subscribers
          const { data: betaUsers, error: fetchError } = await supabaseClient
            .from('beehiiv_subscribers')
            .select('id, email')
            .or(
              'email.ilike.%beta%,email.ilike.%test%,email.ilike.%temp%,email.eq.test@example.com'
            );

          if (fetchError) {
            console.error('❌ Error fetching beta users:', fetchError);
            throw fetchError;
          }

          if (!betaUsers || betaUsers.length === 0) {
            console.log('✅ No beta users found to remove');
            return new Response(
              JSON.stringify({ success: true, message: 'No beta users found' }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 
              }
            );
          }

          console.log(`🎯 Found ${betaUsers.length} beta users to remove:`, betaUsers.map(u => u.email));

          // Delete from Supabase Auth first
          let authDeleteCount = 0;
          for (const user of betaUsers) {
            try {
              const { data: authUsers } = await supabaseClient.auth.admin.listUsers({
                perPage: 1000
              });
              
              const authUser = authUsers.users.find(u => u.email === user.email);
              if (authUser) {
                const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(authUser.id);
                if (!authDeleteError) {
                  authDeleteCount++;
                } else {
                  console.warn(`Failed to delete auth user ${user.email}:`, authDeleteError);
                }
              }
            } catch (error) {
              console.warn(`Error deleting auth user ${user.email}:`, error);
            }
          }

          // Delete from beehiiv_subscribers (cascade will handle related data)
          const { error: deleteError } = await supabaseClient
            .from('beehiiv_subscribers')
            .delete()
            .in('id', betaUsers.map(u => u.id));

          if (deleteError) {
            console.error('❌ Error deleting beta users from beehiiv_subscribers:', deleteError);
            throw deleteError;
          }

          console.log('✅ Beta users cleanup completed successfully');
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `Successfully removed ${betaUsers.length} beta/test users (${authDeleteCount} from auth)`,
              removedCount: betaUsers.length,
              authDeleteCount
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );

        } catch (error) {
          console.error('❌ Beta users cleanup error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to remove beta users', details: error.message }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }

      case 'reset_password':
        if (!userEmail) {
          throw new Error('User email is required for password reset')
        }

        // Send password reset email
        const { error: resetError } = await supabaseClient.auth.admin.generateLink({
          type: 'recovery',
          email: userEmail,
        })

        if (resetError) {
          console.error('Password reset error:', resetError)
          throw new Error(`Failed to send password reset: ${resetError.message}`)
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Password reset email sent' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'bulk_delete':
        console.log('Processing bulk delete for:', { userIds, userEmails })

        // Use userEmails if provided, otherwise try to extract emails from userIds
        let emailsToDelete: string[] = []
        
        if (userEmails && userEmails.length > 0) {
          emailsToDelete = userEmails
        } else if (userIds && userIds.length > 0) {
          // Handle real UUIDs - get emails from database
          const realUUIDs = userIds.filter(id => !id.includes('@'))
          if (realUUIDs.length > 0) {
            const { data: userData, error: fetchError } = await supabaseClient
              .from('beehiiv_subscribers')
              .select('email')
              .in('id', realUUIDs)

            if (!fetchError && userData) {
              emailsToDelete.push(...userData.map(user => user.email))
            }
          }
        }

        if (emailsToDelete.length === 0) {
          console.log('No emails found for auth deletion')
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'No auth users to delete',
              authDeleteCount: 0 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          )
        }

        console.log('Deleting auth users for emails:', emailsToDelete)

        // Delete from Supabase Auth
        let authDeleteCount = 0
        for (const email of emailsToDelete) {
          try {
            const { data: authUsers } = await supabaseClient.auth.admin.listUsers({
              perPage: 1000
            })
            
            const authUser = authUsers.users.find(u => u.email === email)
            if (authUser) {
              const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(authUser.id)
              if (!authDeleteError) {
                authDeleteCount++
                console.log(`✅ Deleted auth user: ${email}`)
              } else {
                console.warn(`Failed to delete auth user ${email}:`, authDeleteError)
              }
            } else {
              console.log(`Auth user not found for email: ${email}`)
            }
          } catch (error) {
            console.warn(`Error deleting auth user ${email}:`, error)
          }
        }

        console.log(`Deleted ${authDeleteCount} users from Supabase Auth`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Bulk delete completed. Deleted ${authDeleteCount} auth users.`,
            authDeleteCount 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'delete_user':
        if (!userId) {
          throw new Error('User ID is required for user deletion')
        }

        // Get user email first
        const { data: user, error: userError } = await supabaseClient
          .from('beehiiv_subscribers')
          .select('email')
          .eq('id', userId)
          .single()

        if (userError || !user) {
          console.warn('User not found in beehiiv_subscribers:', userError)
        }

        // Delete from Supabase Auth if email exists
        if (user?.email) {
          try {
            const { data: authUsers } = await supabaseClient.auth.admin.listUsers({
              perPage: 1000
            })
            
            const authUser = authUsers.users.find(u => u.email === user.email)
            if (authUser) {
              const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(authUser.id)
              if (authDeleteError) {
                console.warn('Failed to delete from auth:', authDeleteError)
              }
            }
          } catch (error) {
            console.warn('Error deleting from auth:', error)
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User deletion completed'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'update_user':
        if (!userId || !updates) {
          throw new Error('User ID and updates are required')
        }

        // Update user in beehiiv_subscribers
        const { error: updateError } = await supabaseClient
          .from('beehiiv_subscribers')
          .update(updates)
          .eq('id', userId)

        if (updateError) {
          throw new Error(`Failed to update user: ${updateError.message}`)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User updated successfully'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Admin user action error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})