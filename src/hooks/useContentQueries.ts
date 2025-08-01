
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';


interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

export function useContentQueries(subscriber: Subscriber, isFullView: boolean = false) {

  // Fetch newsletters
  const newsletters = useQuery({
    queryKey: ['published-newsletters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(2);
        
      if (error) throw error;
      return data;
    }
  });

  // Fetch videos
  const videos = useQuery({
    queryKey: ['published-videos', subscriber.subscription_tier, isFullView],
    queryFn: async () => {
      let query = supabase
        .from('video_tutorials')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
        
      // Only apply limit for overview, not for full view
      if (!isFullView) {
        query = query.limit(2);
      }
        
      const { data, error } = await query;
        
      if (error) throw error;
      return data?.filter(video => {
        if (video.required_tier === 'free') return true;
        if (video.required_tier === 'paid' && ['paid', 'premium'].includes(subscriber.subscription_tier)) return true;
        if (video.required_tier === 'premium' && subscriber.subscription_tier === 'premium') return true;
        return false;
      });
    }
  });

  // Fetch courses
  const courses = useQuery({
    queryKey: ['published-courses', subscriber.subscription_tier],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(2);
        
      if (error) throw error;
      return data?.filter(course => {
        if (course.required_tier === 'free') return true;
        if (course.required_tier === 'paid' && ['paid', 'premium'].includes(subscriber.subscription_tier)) return true;
        if (course.required_tier === 'premium' && subscriber.subscription_tier === 'premium') return true;
        return false;
      });
    }
  });

  // Fetch articles
  const articles = useQuery({
    queryKey: ['published-articles', subscriber.subscription_tier],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(2);
        
      if (error) throw error;
      return data?.filter(article => {
        if (article.required_tier === 'free') return true;
        if (article.required_tier === 'paid' && ['paid', 'premium'].includes(subscriber.subscription_tier)) return true;
        if (article.required_tier === 'premium' && subscriber.subscription_tier === 'premium') return true;
        return false;
      });
    }
  });

  return { newsletters, videos, courses, articles };
}
