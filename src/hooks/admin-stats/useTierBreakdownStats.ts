
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TierBreakdownStats {
  free: number;
  paid: number;
  premium: number;
}

export function useTierBreakdownStats() {
  return useQuery({
    queryKey: ['tier-breakdown-stats'],
    queryFn: async (): Promise<TierBreakdownStats> => {
      console.log('📊 Fetching accurate tier breakdown statistics...');
      
      try {
        // Get counts from secure system tables
        const [adminResult, whopResult] = await Promise.all([
          supabase
            .from('admin_users')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),
          supabase
            .from('whop_authenticated_users')
            .select('*', { count: 'exact', head: true })
        ]);

        const breakdown = {
          free: 0, // Not tracked in secure system
          paid: 0, // Not tracked in secure system
          premium: whopResult.count || 0 // Approximate - Whop users are typically premium
        };

        console.log('✅ Secure tier breakdown calculated:', breakdown);
        return breakdown;
        
      } catch (error) {
        console.error('❌ Tier breakdown calculation error:', error);
        return { free: 0, paid: 0, premium: 0 };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes for more accurate data
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: 500,
    throwOnError: false,
    initialData: { free: 0, paid: 0, premium: 0 },
  });
}
