
import { supabase } from '@/integrations/supabase/client';

export const getLogoUrl = async () => {
  try {
    // Check if logo.jpg exists in the assets bucket
    const { data, error } = await supabase.storage
      .from('assets')
      .list('', {
        search: 'logo.jpg'
      });
    
    if (error) {
      console.error('Error checking for logo.jpg:', error);
      return null;
    }
    
    // If logo.jpg exists, return its public URL
    const logoFile = data?.find(file => file.name === 'logo.jpg');
    if (logoFile) {
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl('logo.jpg');
      
      return urlData.publicUrl;
    }
    
    console.log('logo.jpg not found in assets bucket');
    return null;
  } catch (error) {
    console.error('Error getting logo URL:', error);
    return null;
  }
};
