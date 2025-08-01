
import { useContentStats } from './admin-stats/useContentStats';
import { useUserCountStats } from './admin-stats/useUserCountStats';
import { useTierBreakdownStats } from './admin-stats/useTierBreakdownStats';

interface AdminStats {
  totalUsers: number;
  publishedContent: {
    newsletters: number;
    videos: number;
    courses: number;
    articles: number;
  };
  usersByTier: {
    free: number;
    paid: number;
    premium: number;
  };
}

export function useOptimizedAdminStats() {
  const { data: contentStats, isLoading: contentLoading, error: contentError } = useContentStats();
  const { data: userCount, isLoading: userLoading, error: userError } = useUserCountStats();
  const { data: tierStats, isLoading: tierLoading, error: tierError } = useTierBreakdownStats();

  // Show loading only if we have no cached data at all
  const isLoading = (contentLoading || userLoading || tierLoading) && 
                   (!contentStats && !userCount && !tierStats);
  
  const error = contentError || userError || tierError;

  const data: AdminStats = {
    totalUsers: userCount || 0,
    publishedContent: {
      newsletters: contentStats?.newsletters || 0,
      videos: contentStats?.videos || 0,
      courses: contentStats?.courses || 0,
      articles: contentStats?.articles || 0,
    },
    usersByTier: {
      free: tierStats?.free || 0,
      paid: tierStats?.paid || 0,
      premium: tierStats?.premium || 0,
    }
  };

  console.log('📊 Optimized Admin Stats:', data);

  return {
    data,
    isLoading,
    error,
    // Individual hook data for more granular access if needed
    contentStats,
    userCount,
    tierStats,
  };
}
