
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

// Helper function to get blacklisted newsletter IDs (via RPC due to RLS)
export const getBlacklistedNewsletterIds = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase.rpc('get_blacklisted_newsletter_ids');

    if (error) {
      console.error('Error fetching blacklisted newsletters (RPC):', error);
      return [];
    }

    // data should be an array of rows with beehiiv_post_id
    const ids = Array.isArray(data) ? data.map((item: { beehiiv_post_id: string }) => item.beehiiv_post_id) : [];
    return ids;
  } catch (error) {
    console.error('Failed to fetch blacklisted newsletters (RPC):', error);
    return [];
  }
};

// Helper function to filter out blacklisted newsletters
export const filterBlacklistedNewsletters = (newsletters: any[], blacklistedIds: string[]): any[] => {
  return newsletters.filter(newsletter => 
    newsletter.beehiiv_post_id && !blacklistedIds.includes(newsletter.beehiiv_post_id)
  );
};

// Helper function to check if a newsletter is blacklisted (via RPC due to RLS)
export const isNewsletterBlacklisted = async (beehiivPostId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_newsletter_blacklisted', {
      p_beehiiv_post_id: beehiivPostId
    });

    if (error) {
      console.error('Error checking newsletter blacklist (RPC):', error);
      return false;
    }

    // data should be a boolean
    return Boolean(data);
  } catch (error) {
    console.error('Failed to check newsletter blacklist (RPC):', error);
    return false;
  }
};
