import { supabase } from '@/integrations/supabase/client';

export async function debugBeehiivAPI() {
  try {
    console.log('🔍 Calling BeehiIV debug function...');
    
    const { data, error } = await supabase.functions.invoke('beehiiv-debug');

    if (error) {
      console.error('❌ Debug error:', error);
      throw error;
    }

    console.log('✅ Debug result:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to debug BeehiIV API:', error);
    throw error;
  }
}

// Function to test from browser console
(window as any).debugBeehiiv = debugBeehiivAPI;