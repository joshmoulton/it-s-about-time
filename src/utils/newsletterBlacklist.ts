import { supabase } from '@/integrations/supabase/client';

// Helper function to blacklist a newsletter
export const blacklistNewsletter = async (beehiivPostId: string, title: string, reason: string = 'Manually blacklisted') => {
  try {
    const { error } = await supabase.rpc('blacklist_newsletter', {
      p_beehiiv_post_id: beehiivPostId,
      p_title: title,
      p_reason: reason
    });

    if (error) {
      console.error('Error blacklisting newsletter:', error);
      throw error;
    }

    console.log(`Newsletter ${title} (${beehiivPostId}) has been blacklisted`);
  } catch (error) {
    console.error('Failed to blacklist newsletter:', error);
    throw error;
  }
};

// Helper function to get blacklisted newsletter IDs
export const getBlacklistedNewsletterIds = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_blacklist')
      .select('beehiiv_post_id');

    if (error) {
      console.error('Error fetching blacklisted newsletters:', error);
      return [];
    }

    return data?.map(item => item.beehiiv_post_id) || [];
  } catch (error) {
    console.error('Failed to fetch blacklisted newsletters:', error);
    return [];
  }
};

// Helper function to filter out blacklisted newsletters
export const filterBlacklistedNewsletters = (newsletters: any[], blacklistedIds: string[]): any[] => {
  return newsletters.filter(newsletter => 
    newsletter.beehiiv_post_id && !blacklistedIds.includes(newsletter.beehiiv_post_id)
  );
};

// Helper function to check if a newsletter is blacklisted
export const isNewsletterBlacklisted = async (beehiivPostId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_blacklist')
      .select('beehiiv_post_id')
      .eq('beehiiv_post_id', beehiivPostId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking newsletter blacklist:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Failed to check newsletter blacklist:', error);
    return false;
  }
};