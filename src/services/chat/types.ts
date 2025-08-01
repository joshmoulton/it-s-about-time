
export interface ChatMessage {
  id: string;
  telegram_message_id: number;
  chat_id: number;
  user_id?: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  message_text: string | null;
  message_type: string;
  message_thread_id: number | null;
  reply_to_message_id: number | null;
  forwarded_from: string | null;
  media_url: string | null;
  media_type: string | null;
  timestamp: string;
  message_time: string;
  topic_name: string | null;
  is_highlighted: boolean;
  is_hidden: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  auto_highlights?: any[];
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';
  lastConnected: Date | null;
  lastSyncTime: Date | null;
  error: string | null;
}

export type MessageCallback = (messages: ChatMessage[]) => void;
export type ConnectionCallback = (state: ConnectionState) => void;
