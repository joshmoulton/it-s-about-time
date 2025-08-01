import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TARGET_CHAT_ID = -1002083186778;

export async function sendTelegramMessage(
  message: string,
  botToken: string,
  supabase: ReturnType<typeof createClient>,
  senderUserId: string,
  senderEmail: string,
  senderName?: string,
  messageThreadId?: number | null,
  topicName?: string | null
): Promise<{ success: boolean; telegramMessageId?: number; error?: string }> {
  try {
    console.log('Sending message to Telegram:', { messageThreadId, topicName, senderEmail });

    // Check if user is admin first
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select(`
        id,
        is_active,
        email,
        beehiiv_subscribers!inner(email)
      `)
      .or(`email.eq.${senderEmail},beehiiv_subscribers.email.eq.${senderEmail}`)
      .eq('is_active', true)
      .single();

    if (adminUser) {
      console.log('✅ Admin user - bypassing all permission checks');
    } else {
      // Check user permissions for non-admin users
      const { data: permissions } = await supabase
        .from('user_telegram_permissions')
        .select('*')
        .eq('user_id', senderUserId)
        .single();

      if (!permissions) {
        console.log('No permissions found for user, checking if Whop authenticated');
        
        // Check if user has Whop authentication
        const { data: whopUser } = await supabase
          .from('whop_authenticated_users')
          .select('*')
          .eq('user_email', senderEmail)
          .single();

        if (whopUser) {
          console.log('Whop authenticated user - creating permissions');
          // Create permissions for Whop user
          await supabase
            .from('user_telegram_permissions')
            .insert({
              user_id: senderUserId,
              user_email: senderEmail,
              can_send_messages: true,
              requires_approval: false,
              is_approved: true,
              daily_message_limit: 50
            });
        } else {
          // Check for premium subscription as fallback
          const { data: subscriber } = await supabase
            .from('beehiiv_subscribers')
            .select('subscription_tier')
            .eq('id', senderUserId)
            .single();

          if (!subscriber || subscriber.subscription_tier !== 'premium') {
            return { success: false, error: 'Premium subscription or Whop purchase verification required' };
          }

          // Create permissions for premium user
          await supabase
            .from('user_telegram_permissions')
            .insert({
              user_id: senderUserId,
              user_email: senderEmail,
              can_send_messages: true,
              requires_approval: false,
              is_approved: true,
              daily_message_limit: 50
            });
        }
      } else {
        // Check if user can send messages
        if (!permissions.can_send_messages || (permissions.requires_approval && !permissions.is_approved)) {
          return { success: false, error: 'You do not have permission to send messages' };
        }

        // Check if user is banned
        if (permissions.banned_until && new Date(permissions.banned_until) > new Date()) {
          return { success: false, error: 'You are temporarily banned from sending messages' };
        }

        // Check daily limit
        if (permissions.messages_sent_today >= permissions.daily_message_limit) {
          return { success: false, error: `Daily message limit of ${permissions.daily_message_limit} reached` };
        }
      }
    }

    // Prepare message with sender identification
    const identifiedMessage = `💬 **${senderName || senderEmail}** (from Dashboard):\n\n${message}`;

    // Prepare Telegram API request
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const requestBody: any = {
      chat_id: TARGET_CHAT_ID,
      text: identifiedMessage,
      parse_mode: 'Markdown'
    };

    // Add thread ID if sending to a specific topic
    if (messageThreadId) {
      requestBody.message_thread_id = messageThreadId;
    }

    console.log('Sending to Telegram API:', telegramUrl.replace(botToken, '[REDACTED]'));
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Telegram API response:', data);

    if (!data.ok) {
      console.error('Telegram API error:', data);
      return { success: false, error: `Telegram API error: ${data.description || 'Unknown error'}` };
    }

    const telegramMessageId = data.result.message_id;

    // Store sent message in database
    await supabase
      .from('sent_messages')
      .insert({
        sender_user_id: senderUserId,
        sender_email: senderEmail,
        sender_name: senderName,
        message_text: message,
        chat_id: TARGET_CHAT_ID,
        message_thread_id: messageThreadId,
        topic_name: topicName,
        telegram_message_id: telegramMessageId,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    // The database trigger will automatically update the message count
    // No need for manual increment here as the trigger handles it

    // Log the action
    await supabase
      .from('message_audit_log')
      .insert({
        action_type: 'sent',
        user_id: senderUserId,
        user_email: senderEmail,
        telegram_message_id: telegramMessageId,
        message_content: message,
        chat_id: TARGET_CHAT_ID,
        topic_name: topicName,
        metadata: { messageThreadId, originalMessage: message }
      });

    console.log('Message sent successfully:', telegramMessageId);
    return { success: true, telegramMessageId };

  } catch (error) {
    console.error('Error sending message:', error);
    
    // Store failed message
    try {
      await supabase
        .from('sent_messages')
        .insert({
          sender_user_id: senderUserId,
          sender_email: senderEmail,
          sender_name: senderName,
          message_text: message,
          chat_id: TARGET_CHAT_ID,
          message_thread_id: messageThreadId,
          topic_name: topicName,
          status: 'failed',
          error_message: error.message
        });
    } catch (dbError) {
      console.error('Failed to store failed message:', dbError);
    }

    return { success: false, error: error.message };
  }
}
