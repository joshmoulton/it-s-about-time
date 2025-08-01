
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleWebhookCleanup(
  params: any,
  supabase: ReturnType<typeof createClient>,
  botToken: string
) {
  console.log('🗑️ Handling webhook cleanup...');
  
  try {
    // Delete webhook
    const deleteWebhookUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
    const deleteResponse = await fetch(deleteWebhookUrl, { method: 'POST' });
    const deleteResult = await deleteResponse.json();
    
    console.log('🗑️ Webhook deletion result:', deleteResult);
    
    // Get webhook info to confirm
    const getWebhookUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const infoResponse = await fetch(getWebhookUrl);
    const infoResult = await infoResponse.json();
    
    console.log('ℹ️ Webhook info after deletion:', infoResult);
    
    return {
      success: deleteResult.ok,
      webhook_deleted: deleteResult.ok,
      webhook_info: infoResult.result,
      message: deleteResult.ok ? 'Webhook successfully deleted' : 'Failed to delete webhook'
    };
    
  } catch (error) {
    console.error('❌ Error cleaning up webhook:', error);
    return {
      success: false,
      webhook_deleted: false,
      error: error.message,
      message: 'Error during webhook cleanup'
    };
  }
}
