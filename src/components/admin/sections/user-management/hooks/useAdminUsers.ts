
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AdminUser } from '../types';

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users-with-details-v3'],
    queryFn: async (): Promise<AdminUser[]> => {
      try {
        console.log('Fetching admin users...');
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('is_active', true);
          
        if (error) {
          console.error('Error fetching admin users:', error);
          return [];
        }
        
        // Transform the data for the new secure system
        const transformedData = data?.map(admin => ({
          ...admin,
          display_email: admin.email || 'No email',
          admin_type: 'secure_admin',
          beehiiv_subscribers: { email: admin.email } // For compatibility
        })) || [];
        
        console.log('Admin users fetched:', transformedData.length);
        return transformedData;
      } catch (error) {
        console.error('Admin users query failed:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}
