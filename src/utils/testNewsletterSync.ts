import { supabase } from '@/integrations/supabase/client';

export async function syncSpecificNewsletter(postId: string) {
  try {
    console.log('🔄 Syncing newsletter with post ID:', postId);
    
    const { data, error } = await supabase.functions.invoke('newsletter-sync', {
      body: {
        action: 'sync_specific_newsletter',
        beehiiv_post_id: postId
      }
    });

    if (error) {
      console.error('❌ Sync error:', error);
      throw error;
    }

    console.log('✅ Sync result:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to sync newsletter:', error);
    throw error;
  }
}

// Function to test from browser console
(window as any).syncNewsletter = syncSpecificNewsletter;