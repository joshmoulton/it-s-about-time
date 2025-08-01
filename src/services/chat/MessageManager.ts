import { supabase } from '@/integrations/supabase/client';
import type { ChatMessage } from './types';

export class MessageManager {
  private messages: ChatMessage[] = [];
  private lastLoadTime: Date | null = null;

  async loadInitialMessages(): Promise<ChatMessage[]> {
    try {
      console.log('📥 Loading messages from database...');
      
      const { data, error } = await supabase
        .from('telegram_messages')
        .select('*')
        .order('message_time', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Error loading messages:', error);
        throw error;
      }

      this.messages = (data || []).map((msg: any) => ({
        id: String(msg.id),
        telegram_message_id: msg.telegram_message_id || 0,
        chat_id: msg.chat_id || 0,
        user_id: msg.user_id,
        first_name: msg.first_name || null,
        last_name: msg.last_name || null,
        username: msg.username || null,
        message_text: msg.message_text,
        message_type: msg.message_type || 'text',
        message_thread_id: msg.message_thread_id || null,
        reply_to_message_id: msg.reply_to_message_id || null,
        forwarded_from: msg.forwarded_from || null,
        media_url: msg.media_url || null,
        media_type: msg.media_type || null,
        timestamp: msg.timestamp || msg.message_time || new Date().toISOString(),
        message_time: msg.message_time || msg.timestamp || new Date().toISOString(),
        topic_name: msg.topic_name || null,
        is_highlighted: msg.is_highlighted || false,
        is_hidden: msg.is_hidden || false,
        likes_count: msg.likes_count || 0,
        created_at: msg.created_at || new Date().toISOString(),
        updated_at: msg.updated_at || new Date().toISOString()
      }));

      this.lastLoadTime = new Date();
      console.log('✅ Successfully loaded', this.messages.length, 'messages');
      
      return this.messages;
    } catch (error) {
      console.error('❌ Failed to load initial messages:', error);
      return [];
    }
  }

  handleNewMessage(message: ChatMessage): void {
    // Add new message to the beginning of the array
    this.messages.unshift(message);
    
    // Keep only the latest 100 messages to prevent memory issues
    if (this.messages.length > 100) {
      this.messages = this.messages.slice(0, 100);
    }
    
    console.log('📨 Added new message, total:', this.messages.length);
  }

  handleMessageUpdate(updatedMessage: ChatMessage): void {
    const index = this.messages.findIndex(msg => msg.id === updatedMessage.id);
    if (index !== -1) {
      this.messages[index] = updatedMessage;
      console.log('📝 Updated message at index:', index);
    } else {
      // If message not found, add it as new
      this.handleNewMessage(updatedMessage);
    }
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  getMessageCount(): number {
    return this.messages.length;
  }

  getLastLoadTime(): Date | null {
    return this.lastLoadTime;
  }
}
