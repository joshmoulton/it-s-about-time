
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUserCountStats() {
  return useQuery({
    queryKey: ['user-count-stats'],
    queryFn: async (): Promise<number> => {
      console.log('📊 Fetching accurate user count statistics...');
      
      try {
        // Get counts from secure system tables
        const [adminResult, whopResult] = await Promise.all([
          supabase.from('admin_users').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('whop_authenticated_users').select('*', { count: 'exact', head: true })
        ]);
        
        const count = (adminResult.count || 0) + (whopResult.count || 0);
        console.log('✅ Secure user count calculated:', count);
        return count;
        
      } catch (error) {
        console.error('❌ User count fetch error:', error);
        return 0;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - more frequent updates for accuracy
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: 500,
    throwOnError: false,
    initialData: 0,
  });
}
