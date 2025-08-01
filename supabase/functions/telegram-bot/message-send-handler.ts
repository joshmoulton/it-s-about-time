
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendTelegramMessage } from './message-sender.ts';

export async function handleSendMessage(
  params: any,
  supabase: ReturnType<typeof createClient>,
  botToken: string
) {
  console.log('📤 Sending message to Telegram...');
  
  const { 
    message, 
    messageThreadId, 
    topicName, 
    userEmail, 
    userName 
  } = params;
  
  if (!message || !userEmail) {
    throw new Error('Message and user email are required');
  }

  // Get user ID from auth or email
  let senderUserId = params.senderUserId;
  
  if (!senderUserId) {
    // Try to get user from current session
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      senderUserId = user.id;
    } else {
      // Fallback: look up user by email
      const { data: subscriber } = await supabase
        .from('beehiiv_subscribers')
        .select('id')
        .eq('email', userEmail)
        .single();
      
      if (subscriber) {
        senderUserId = subscriber.id;
      } else {
        throw new Error('User not found');
      }
    }
  }

  const result = await sendTelegramMessage(
    message,
    botToken,
    supabase,
    senderUserId,
    userEmail,
    userName,
    messageThreadId,
    topicName
  );

  return result;
}
