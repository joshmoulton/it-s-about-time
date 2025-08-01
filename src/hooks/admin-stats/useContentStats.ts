
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContentStats {
  newsletters: number;
  videos: number;
  courses: number;
  articles: number;
  newslettersChange: number;
  videosChange: number;
  coursesChange: number;
  articlesChange: number;
}

export function useContentStats() {
  return useQuery({
    queryKey: ['content-stats'],
    queryFn: async (): Promise<ContentStats> => {
      console.log('📊 Fetching content statistics...');
      
      try {
        // Get current counts for all content (not just published)
        const [
          { count: newsletters },
          { count: videos },
          { count: courses },
          { count: articles }
        ] = await Promise.all([
          supabase.from('newsletters').select('*', { count: 'exact', head: true }),
          supabase.from('video_tutorials').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('articles').select('*', { count: 'exact', head: true })
        ]);

        // Get counts from last week for comparison (7 days ago)
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const [
          { count: lastWeekNewsletters },
          { count: lastWeekVideos },
          { count: lastWeekCourses },
          { count: lastWeekArticles }
        ] = await Promise.all([
          supabase.from('newsletters').select('*', { count: 'exact', head: true }).lt('created_at', lastWeek.toISOString()),
          supabase.from('video_tutorials').select('*', { count: 'exact', head: true }).lt('created_at', lastWeek.toISOString()),
          supabase.from('courses').select('*', { count: 'exact', head: true }).lt('created_at', lastWeek.toISOString()),
          supabase.from('articles').select('*', { count: 'exact', head: true }).lt('created_at', lastWeek.toISOString())
        ]);

        // Calculate actual number changes this week (not percentage)
        const calculateWeeklyChange = (current: number, lastWeek: number) => {
          return (current || 0) - (lastWeek || 0);
        };

        const stats = {
          newsletters: newsletters || 0,
          videos: videos || 0,
          courses: courses || 0,
          articles: articles || 0,
          newslettersChange: calculateWeeklyChange(newsletters || 0, lastWeekNewsletters || 0),
          videosChange: calculateWeeklyChange(videos || 0, lastWeekVideos || 0),
          coursesChange: calculateWeeklyChange(courses || 0, lastWeekCourses || 0),
          articlesChange: calculateWeeklyChange(articles || 0, lastWeekArticles || 0),
        };

        console.log('✅ Content stats calculated:', stats);
        return stats;
        
      } catch (error) {
        console.error('❌ Content stats fetch error:', error);
        return {
          newsletters: 0,
          videos: 0,
          courses: 0,
          articles: 0,
          newslettersChange: 0,
          videosChange: 0,
          coursesChange: 0,
          articlesChange: 0,
        };
      }
    },
    staleTime: 0, // Force fresh data fetch
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when window gets focus
    refetchOnMount: true, // Always refetch on mount
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  });
}
