import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useBulkActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const bulkDelete = async (userIds: string[]) => {
    console.log('🗑️ Starting bulk delete for userIds:', userIds);
    setIsProcessing(true);
    try {
      // Separate real UUIDs from synthetic email-based IDs
      const realUUIDs: string[] = [];
      const adminEmails: string[] = [];
      const whopEmails: string[] = [];
      const authEmails: string[] = [];

      userIds.forEach(id => {
        if (id.startsWith('admin-')) {
          adminEmails.push(id.replace('admin-', ''));
        } else if (id.startsWith('whop-')) {
          whopEmails.push(id.replace('whop-', ''));
        } else if (id.startsWith('auth-')) {
          authEmails.push(id.replace('auth-', ''));
        } else {
          // This is a real UUID from beehiiv_subscribers
          realUUIDs.push(id);
        }
      });

      console.log('📧 Parsed IDs:', { realUUIDs, adminEmails, whopEmails, authEmails });

      let deletedCount = 0;
      const allEmails = [...adminEmails, ...whopEmails, ...authEmails];

      // Delete admin users by email
      if (adminEmails.length > 0) {
        const { error: adminError } = await supabase
          .from('admin_users')
          .delete()
          .in('email', adminEmails);

        if (adminError) {
          console.warn('Some admin users could not be deleted:', adminError);
        } else {
          deletedCount += adminEmails.length;
          console.log(`✅ Deleted ${adminEmails.length} admin users`);
        }
      }

      // Delete whop users by email
      if (whopEmails.length > 0) {
        const { error: whopError } = await supabase
          .from('whop_authenticated_users')
          .delete()
          .in('user_email', whopEmails);

        if (whopError) {
          console.warn('Some Whop users could not be deleted:', whopError);
        } else {
          deletedCount += whopEmails.length;
          console.log(`✅ Deleted ${whopEmails.length} whop users`);
        }
      }

      // No local subscriber data to delete in secure system
      if (realUUIDs.length > 0) {
        console.log(`ℹ️ Secure system: ${realUUIDs.length} subscriber references noted but no local data to delete`);
      }

      // Delete from Supabase Auth if applicable
      console.log('📡 Calling admin-user-actions edge function...');
      const { error: authError } = await supabase.functions.invoke('admin-user-actions', {
        body: {
          action: 'bulk_delete',
          userEmails: allEmails,
          userIds: realUUIDs.length > 0 ? realUUIDs : undefined
        }
      });

      if (authError) {
        console.error('❌ Auth deletion error:', authError);
        console.warn('Some auth users could not be deleted:', authError);
      } else {
        console.log('✅ Auth deletion completed successfully');
      }

      toast({
        title: "Users Deleted",
        description: `Successfully deleted ${deletedCount} user${deletedCount !== 1 ? 's' : ''}`,
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete users",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  const bulkTierChange = async (userIds: string[], newTier: 'free' | 'paid' | 'premium') => {
    setIsProcessing(true);
    try {
      // Only update beehiiv subscribers (real UUIDs)
      const realUUIDs = userIds.filter(id => !id.startsWith('admin-') && !id.startsWith('whop-') && !id.startsWith('auth-'));
      
      if (realUUIDs.length === 0) {
        toast({
          title: "No Updates",
          description: "Tier changes only apply to newsletter subscribers",
        });
        return { success: true };
      }

      // No local tier updates in secure system
      toast({
        title: "Secure System",
        description: "Tier changes are handled through Beehiiv segments in the secure system",
      });
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Tier Update Failed",
        description: error.message || "Failed to update user tiers",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  const bulkStatusChange = async (userIds: string[], newStatus: 'active' | 'inactive') => {
    setIsProcessing(true);
    try {
      let updatedCount = 0;
      
      // Separate different user types
      const realUUIDs: string[] = [];
      const adminEmails: string[] = [];
      
      userIds.forEach(id => {
        if (id.startsWith('admin-')) {
          adminEmails.push(id.replace('admin-', ''));
        } else if (!id.startsWith('whop-') && !id.startsWith('auth-')) {
          // This is a real UUID from beehiiv_subscribers
          realUUIDs.push(id);
        }
      });

      // No local status updates in secure system
      if (realUUIDs.length > 0) {
        console.log(`ℹ️ Secure system: ${realUUIDs.length} subscriber status changes noted but handled externally`);
      }

      // Update admin users
      if (adminEmails.length > 0) {
        const isActive = newStatus === 'active';
        const { error } = await supabase
          .from('admin_users')
          .update({ is_active: isActive })
          .in('email', adminEmails);

        if (error) throw error;
        updatedCount += adminEmails.length;
      }

      if (updatedCount === 0) {
        toast({
          title: "No Updates",
          description: "No supported users selected for status change",
        });
        return { success: true };
      }

      toast({
        title: "Status Updated",
        description: `Successfully updated ${updatedCount} user${updatedCount !== 1 ? 's' : ''} to ${newStatus} status`,
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Status Update Failed",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  const bulkPasswordReset = async (userEmails: string[], userTypes: string[]) => {
    setIsProcessing(true);
    try {
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < userEmails.length; i++) {
        const email = userEmails[i];
        const userType = userTypes[i];

        // Only send password reset for local_auth and supabase_auth users
        if (userType === 'local_auth' || userType === 'supabase_auth') {
          try {
            const { error } = await supabase.functions.invoke('admin-user-actions', {
              body: {
                action: 'reset_password',
                userEmail: email,
                userType: userType,
                generatePassword: false
              }
            });

            if (error) {
              failureCount++;
            } else {
              successCount++;
            }
          } catch {
            failureCount++;
          }
        }
      }

      if (successCount > 0) {
        toast({
          title: "Password Reset Sent",
          description: `Password reset links sent to ${successCount} user${successCount !== 1 ? 's' : ''}${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
        });
      }

      if (failureCount > 0 && successCount === 0) {
        toast({
          title: "Password Reset Failed",
          description: `Failed to send password reset links to ${failureCount} user${failureCount !== 1 ? 's' : ''}`,
          variant: "destructive",
        });
      }

      return { success: successCount > 0 };
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to send password reset links",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  const removeBetaUsers = async () => {
    console.log('🧹 Starting beta users removal...');
    setIsProcessing(true);
    try {
      console.log('📡 Calling admin-user-actions edge function for beta removal...');
      const { error } = await supabase.functions.invoke('admin-user-actions', {
        body: {
          action: 'remove_beta_users'
        }
      });

      if (error) {
        console.error('❌ Beta removal error:', error);
        throw error;
      }

      console.log('✅ Beta users removed successfully');
      toast({
        title: "Beta Users Removed",
        description: "Successfully removed all beta/test users from the system",
      });

      return { success: true };
    } catch (error: any) {
      console.error('❌ Beta removal failed:', error);
      toast({
        title: "Beta User Removal Failed",
        description: error.message || "Failed to remove beta users",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    bulkDelete,
    bulkTierChange,
    bulkStatusChange,
    bulkPasswordReset,
    removeBetaUsers,
    isProcessing
  };
}