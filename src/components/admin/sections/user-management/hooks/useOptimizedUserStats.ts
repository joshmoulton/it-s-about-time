
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserStats } from '../types';

export function useOptimizedUserStats() {
  return useQuery({
    queryKey: ['optimized-user-stats-v3'],
    queryFn: async (): Promise<UserStats> => {
      console.log('🚀 Fetching ultra-optimized user statistics...');
      try {
        // Use highly optimized parallel queries
        const [
          adminResult,
          whopResult
        ] = await Promise.allSettled([
          supabase.from('admin_users').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('whop_authenticated_users').select('*', { count: 'exact', head: true })
        ]);

        const getCount = (result: PromiseSettledResult<any>) => {
          if (result.status === 'fulfilled' && result.value.count !== null) {
            return result.value.count;
          }
          return 0;
        };

        const adminUsers = getCount(adminResult);
        const whopUsers = getCount(whopResult);
        const totalUsers = adminUsers + whopUsers;

        const stats: UserStats = {
          totalUsers,
          tierBreakdown: {
            free: 0, // Not tracked in secure system
            paid: 0, // Not tracked in secure system  
            premium: whopUsers // Approximate
          },
          statusBreakdown: {
            active: adminUsers,
            inactive: 0,
            other: whopUsers
          },
          recentSignups: 0 // Not tracked in secure system
        };

        console.log('🚀 Ultra-optimized stats:', stats);
        return stats;
      } catch (error) {
        console.error('❌ Error in ultra-optimized stats:', error);
        return {
          totalUsers: 0,
          tierBreakdown: {
            free: 0,
            paid: 0,
            premium: 0
          },
          statusBreakdown: {
            active: 0,
            inactive: 0,
            other: 0
          },
          recentSignups: 0
        };
      }
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
}
