
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function getUserPermissions(
  supabase: ReturnType<typeof createClient>,
  userEmail: string
): Promise<any> {
  try {
    console.log('🔐 Checking permissions for:', userEmail);

    // First check if user is an admin - admins get full access immediately
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select(`
        id,
        is_active,
        role,
        email,
        beehiiv_subscribers!inner(email)
      `)
      .or(`email.eq.${userEmail},beehiiv_subscribers.email.eq.${userEmail}`)
      .eq('is_active', true)
      .single();

    if (adminUser) {
      console.log('✅ Admin user detected, granting full access');
      return {
        canSend: true,
        permissions: {
          dailyLimit: 999,
          messagesSentToday: 0,
          remainingMessages: 999,
          requiresApproval: false,
          isApproved: true,
          bannedUntil: null
        }
      };
    }

    // Check if user has Whop authentication
    const { data: whopUser } = await supabase
      .from('whop_authenticated_users')
      .select('*')
      .eq('user_email', userEmail)
      .single();

    if (whopUser) {
      console.log('✅ Whop authenticated user found');
      
      // Get user from beehiiv_subscribers for user_id
      const { data: subscriber } = await supabase
        .from('beehiiv_subscribers')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (!subscriber) {
        console.log('❌ Whop user not found in beehiiv_subscribers');
        return { canSend: false, error: 'User account not found' };
      }

      // Get or create user permissions for Whop users
      let { data: permissions } = await supabase
        .from('user_telegram_permissions')
        .select('*')
        .eq('user_id', subscriber.id)
        .single();

      if (!permissions) {
        // Create default permissions for Whop users
        const { data: newPermissions, error } = await supabase
          .from('user_telegram_permissions')
          .insert({
            user_id: subscriber.id,
            user_email: userEmail,
            can_send_messages: true,
            requires_approval: false,
            is_approved: true,
            daily_message_limit: 50
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating permissions:', error);
          return { canSend: false, error: 'Failed to create user permissions' };
        }

        permissions = newPermissions;
      }

      const canSend = permissions.can_send_messages && 
                     (!permissions.requires_approval || permissions.is_approved) &&
                     (!permissions.banned_until || new Date(permissions.banned_until) <= new Date());

      const remainingMessages = Math.max(0, permissions.daily_message_limit - permissions.messages_sent_today);

      return {
        canSend,
        permissions: {
          dailyLimit: permissions.daily_message_limit,
          messagesSentToday: permissions.messages_sent_today,
          remainingMessages,
          requiresApproval: permissions.requires_approval,
          isApproved: permissions.is_approved,
          bannedUntil: permissions.banned_until
        }
      };
    }

    // Get user from beehiiv_subscribers for fallback checks
    const { data: subscriber } = await supabase
      .from('beehiiv_subscribers')
      .select('id, subscription_tier')
      .eq('email', userEmail)
      .single();

    if (!subscriber) {
      console.log('❌ User not found in beehiiv_subscribers');
      return { canSend: false, error: 'User not found' };
    }

    // For non-Whop users, check if they have premium tier (legacy fallback)
    if (subscriber.subscription_tier === 'premium') {
      console.log('✅ Legacy premium user detected');
      
      // Get or create user permissions for premium users
      let { data: permissions } = await supabase
        .from('user_telegram_permissions')
        .select('*')
        .eq('user_id', subscriber.id)
        .single();

      if (!permissions) {
        // Create default permissions for premium users
        const { data: newPermissions, error } = await supabase
          .from('user_telegram_permissions')
          .insert({
            user_id: subscriber.id,
            user_email: userEmail,
            can_send_messages: true,
            requires_approval: false,
            is_approved: true,
            daily_message_limit: 50
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating permissions:', error);
          return { canSend: false, error: 'Failed to create user permissions' };
        }

        permissions = newPermissions;
      }

      const canSend = permissions.can_send_messages && 
                     (!permissions.requires_approval || permissions.is_approved) &&
                     (!permissions.banned_until || new Date(permissions.banned_until) <= new Date());

      const remainingMessages = Math.max(0, permissions.daily_message_limit - permissions.messages_sent_today);

      return {
        canSend,
        permissions: {
          dailyLimit: permissions.daily_message_limit,
          messagesSentToday: permissions.messages_sent_today,
          remainingMessages,
          requiresApproval: permissions.requires_approval,
          isApproved: permissions.is_approved,
          bannedUntil: permissions.banned_until
        }
      };
    }

    // For non-premium users without Whop verification
    console.log('❌ Non-premium user without Whop verification');
    return { 
      canSend: false, 
      error: 'Whop purchase verification required',
      requiresWhopAuth: true 
    };

  } catch (error) {
    console.error('Error getting user permissions:', error);
    return { canSend: false, error: 'Failed to check permissions' };
  }
}
