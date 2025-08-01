import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getBlacklistedNewsletterIds, filterBlacklistedNewsletters } from '@/utils/newsletterBlacklist';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { debugLog } from '@/utils/secureLogger';

interface Newsletter {
  id: string;
  title: string;
  excerpt?: string | null;
  html_content?: string | null;
  plain_content?: string | null;
  status: string;
  published_at?: string | null;
  beehiiv_created_at?: string | null;
  beehiiv_post_id?: string | null;
  featured_image_url?: string | null;
  thumbnail_url?: string | null;
  web_url?: string | null;
  read_time_minutes: number;
  view_count: number;
  analytics_data?: any;
  created_at: string;
  updated_at: string;
  required_tier: 'free' | 'paid' | 'premium';
}

export const useNewsletters = (limit?: number, sortBy: 'newest' | 'oldest' | 'title' = 'newest') => {
  const { user } = useUnifiedAuth();
  
  return useQuery({
    queryKey: ['newsletters', limit, sortBy, user?.subscription_tier],
    queryFn: async () => {
      // Get blacklisted newsletter IDs first
      const blacklistedIds = await getBlacklistedNewsletterIds();
      
      // Database RLS policy should handle tier-based filtering automatically
      // But we'll add client-side filtering as a fallback
      let query = supabase
        .from('newsletters')
        .select('*')
        .eq('status', 'published');

      // Order by the best available date field, handling nulls properly
      if (sortBy === 'newest') {
        query = query
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('beehiiv_created_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false, nullsFirst: false });
      } else if (sortBy === 'oldest') {
        query = query
          .order('published_at', { ascending: true, nullsFirst: false })
          .order('beehiiv_created_at', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true, nullsFirst: false });
      } else if (sortBy === 'title') {
        query = query.order('title', { ascending: true });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching newsletters:', error);
        throw error;
      }

      // Filter out blacklisted newsletters
      const filteredData = filterBlacklistedNewsletters(data || [], blacklistedIds);
      
      // Filter out sneak peek content (non-functional previews)
      const nonSneakPeekData = filteredData.filter(newsletter => {
        const title = newsletter.title?.toLowerCase() || '';
        return !title.includes('sneak peek') && !title.includes('preview');
      });
      
      // Apply limit after filtering if specified
      const finalData = limit ? nonSneakPeekData.slice(0, limit) : nonSneakPeekData;

      // RLS policy now handles tier-based access control automatically
      debugLog.log('📧 NEWSLETTER QUERY RESULT:', {
        userEmail: user?.email || 'unauthenticated',
        userTier: user?.subscription_tier || 'free',
        totalNewsletters: data?.length || 0,
        blacklistedCount: blacklistedIds.length,
        filteredCount: finalData.length,
        newsletters: finalData.map(n => ({ 
          title: n.title, 
          required_tier: n.required_tier,
          id: n.id 
        }))
      });

      return finalData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useNewsletter = (id: string) => {
  return useQuery({
    queryKey: ['newsletter', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching newsletter:', error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });
};

// Auto-sync newsletters from BeehiIV
export const useAutoSyncNewsletters = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['newsletters-auto-sync'],
    queryFn: async () => {
      console.log('🔄 Auto-syncing newsletters from BeehiIV...');
      const { data, error } = await supabase.functions.invoke('newsletter-sync', {
        body: { action: 'sync_newsletters' }
      });

      if (error) {
        console.error('❌ Newsletter auto-sync error:', error);
        return null;
      }
      
      console.log('✅ Newsletter auto-sync completed:', data?.synced || 0, 'newsletters');
      return data;
    },
    staleTime: Infinity,
    refetchInterval: false, // Disabled - external sync handles updates
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useSyncNewsletters = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('🚀 Starting newsletter sync...');
      const { data, error } = await supabase.functions.invoke('newsletter-sync', {
        body: { action: 'sync_newsletters' }
      });

      console.log('📧 Newsletter sync response:', { data, error });
      
      if (error) {
        console.error('❌ Newsletter sync error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      queryClient.invalidateQueries({ queryKey: ['newsletters-auto-sync'] });
      toast.success(`Newsletter sync completed: ${data.synced} newsletters synced`);
    },
    onError: (error: Error) => {
      console.error('Newsletter sync failed:', error);
      toast.error(`Newsletter sync failed: ${error.message}`);
    },
  });
};

export const useIncrementNewsletterViews = () => {
  return useMutation({
    mutationFn: async (newsletterId: string) => {
      const { error } = await supabase.rpc('increment_newsletter_views', {
        newsletter_id: newsletterId
      });

      if (error) throw error;
    },
    onError: (error: Error) => {
      console.error('Failed to increment newsletter views:', error);
    },
  });
};