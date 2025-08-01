
export interface TelegramMessage {
  message_id: number;
  message_thread_id?: number;
  chat: {
    id: number;
    type: string;
  };
  from?: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  text?: string;
  photo?: Array<{
    file_id: string;
    width: number;
    height: number;
  }>;
  document?: {
    file_id: string;
    file_name?: string;
    mime_type?: string;
  };
  reply_to_message?: {
    message_id: number;
  };
  forward_from?: {
    username?: string;
    first_name?: string;
  };
  date: number;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export interface ProcessedMessage {
  telegram_message_id: number;
  chat_id: number;
  user_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  message_text?: string;
  message_type: string;
  message_thread_id?: number;
  topic_name?: string;
  reply_to_message_id?: number;
  forwarded_from?: string;
  media_url?: string;
  media_type?: string;
  timestamp: string;
}
