import { supabase } from '@/integrations/supabase/client';

export async function triggerComprehensiveResync() {
  try {
    console.log('🔄 Starting comprehensive newsletter resync...');
    
    const { data, error } = await supabase.functions.invoke('newsletter-sync', {
      body: {
        action: 'sync_newsletters',
        comprehensive: true,
        force_refresh: true
      }
    });

    if (error) {
      console.error('❌ Resync error:', error);
      throw error;
    }

    console.log('✅ Comprehensive resync completed:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to trigger comprehensive resync:', error);
    throw error;
  }
}

// Make available globally for testing
(window as any).triggerComprehensiveResync = triggerComprehensiveResync;