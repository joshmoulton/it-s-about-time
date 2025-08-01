import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  content: {
    newsletters: number;
    videos: number;
    courses: number;
    articles: number;
    newslettersChange: number;
    videosChange: number;
    coursesChange: number;
    articlesChange: number;
  };
  users: {
    totalUsers: number;
    tierBreakdown: {
      free: number;
      paid: number;
      premium: number;
    };
    statusBreakdown: {
      active: number;
      inactive: number;
      other: number;
    };
    recentSignups: number;
  };
  syncJobs: Array<{
    id: string;
    status: string;
    created_at: string;
    completed_at: string | null;
    error_message: string | null;
    processed_records: number | null;
    synced_records: number | null;
    job_type: string;
  }>;
}

export function useOptimizedDashboardStats() {
  return useQuery({
    queryKey: ['optimized-dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      console.log('🚀 Fetching optimized dashboard stats...');
      
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      try {
        // Execute all queries in parallel using Promise.allSettled for better error handling
        const [
          // Content counts (current)
          newslettersResult,
          videosResult,
          coursesResult,
          articlesResult,
          // Content counts (last week)
          lastWeekNewslettersResult,
          lastWeekVideosResult,
          lastWeekCoursesResult,
          lastWeekArticlesResult,
          // User stats
          totalUsersResult,
          freeUsersResult,
          paidUsersResult,
          premiumUsersResult,
          activeUsersResult,
          recentSignupsResult,
          // Sync jobs
          syncJobsResult
        ] = await Promise.allSettled([
          // Current content counts
          supabase.from('newsletters').select('*', { count: 'exact', head: true }),
          supabase.from('video_tutorials').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('articles').select('*', { count: 'exact', head: true }),
          // Last week content counts
          supabase.from('newsletters').select('*', { count: 'exact', head: true }).lt('created_at', lastWeek.toISOString()),
          supabase.from('video_tutorials').select('*', { count: 'exact', head: true }).lt('created_at', lastWeek.toISOString()),
          supabase.from('courses').select('*', { count: 'exact', head: true }).lt('created_at', lastWeek.toISOString()),
          supabase.from('articles').select('*', { count: 'exact', head: true }).lt('created_at', lastWeek.toISOString()),
          // User counts from secure system
          supabase.from('admin_users').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('whop_authenticated_users').select('*', { count: 'exact', head: true }),
          Promise.resolve({ status: 'fulfilled', value: { count: 0 } }), // free users - not tracked in secure system
          Promise.resolve({ status: 'fulfilled', value: { count: 0 } }), // premium users - approximated elsewhere
          Promise.resolve({ status: 'fulfilled', value: { count: 0 } }), // active users - approximated elsewhere
          Promise.resolve({ status: 'fulfilled', value: { count: 0 } }), // recent signups - not tracked in secure system
          // Placeholder for removed sync jobs
          Promise.resolve({ status: 'fulfilled', value: { data: [] } })
        ]);

        const getCount = (result: PromiseSettledResult<any>) => {
          if (result.status === 'fulfilled' && result.value.count !== null) {
            return result.value.count;
          }
          return 0;
        };

        const getData = (result: PromiseSettledResult<any>) => {
          if (result.status === 'fulfilled' && result.value.data) {
            return result.value.data;
          }
          return [];
        };

        // Content stats
        const newsletters = getCount(newslettersResult);
        const videos = getCount(videosResult);
        const courses = getCount(coursesResult);
        const articles = getCount(articlesResult);

        const lastWeekNewsletters = getCount(lastWeekNewslettersResult);
        const lastWeekVideos = getCount(lastWeekVideosResult);
        const lastWeekCourses = getCount(lastWeekCoursesResult);
        const lastWeekArticles = getCount(lastWeekArticlesResult);

        // User stats from secure system
        const adminUsers = getCount(totalUsersResult);
        const whopUsers = getCount(freeUsersResult);
        const totalUsers = adminUsers + whopUsers;
        const freeUsers = 0; // Not tracked in secure system
        const paidUsers = 0; // Not tracked in secure system
        const premiumUsers = whopUsers; // Approximate
        const activeUsers = adminUsers; // Approximate
        const recentSignups = 0; // Not tracked in secure system

        // Sync jobs
        const syncJobs = getData(syncJobsResult);

        const stats: DashboardStats = {
          content: {
            newsletters,
            videos,
            courses,
            articles,
            newslettersChange: newsletters - lastWeekNewsletters,
            videosChange: videos - lastWeekVideos,
            coursesChange: courses - lastWeekCourses,
            articlesChange: articles - lastWeekArticles,
          },
          users: {
            totalUsers,
            tierBreakdown: {
              free: freeUsers,
              paid: paidUsers,
              premium: premiumUsers
            },
            statusBreakdown: {
              active: activeUsers,
              inactive: totalUsers - activeUsers,
              other: 0
            },
            recentSignups
          },
          syncJobs
        };

        console.log('✅ Optimized dashboard stats:', stats);
        return stats;
      } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        // Return default values on error
        return {
          content: {
            newsletters: 0,
            videos: 0,
            courses: 0,
            articles: 0,
            newslettersChange: 0,
            videosChange: 0,
            coursesChange: 0,
            articlesChange: 0,
          },
          users: {
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
          },
          syncJobs: []
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - much more reasonable
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: false, // Use cached data on mount if available
    retry: 1, // Reduce retries
    retryDelay: 2000,
  });
}