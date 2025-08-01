// Type assertion utility to handle schema mismatches
// This is a temporary solution to resolve build errors due to database schema changes

export function asTelegramMessage(data: any): any {
  if (!data) return null;
  
  return {
    ...data,
    id: String(data.id),
    telegram_message_id: data.telegram_message_id || data.id,
    username: data.username || 'Unknown',
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    timestamp: data.timestamp || data.message_time,
    topic_name: data.topic_name || '',
    likes_count: data.likes_count || 0,
    chat_id: data.chat_id || 0,
    message_type: data.message_type || 'text'
  };
}

export function asTopicMapping(data: any): any {
  if (!data) return null;
  
  return {
    ...data,
    id: String(data.id),
    last_active: data.last_active || new Date().toISOString(),
    category: data.category || 'general',
    is_active: data.is_active !== undefined ? data.is_active : true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString()
  };
}

export function asChatMessage(data: any): any {
  if (!data) return null;
  
  return {
    ...data,
    id: String(data.id),
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    username: data.username || 'Unknown',
    timestamp: data.timestamp || data.message_time,
    topic_name: data.topic_name || '',
    message_thread_id: data.message_thread_id || null,
    likes_count: data.likes_count || 0,
    message_type: data.message_type || 'text'
  };
}

export function withSchemaFallbacks<T>(data: T[]): any[] {
  return (data || []).map((item: any) => ({
    ...item,
    id: String(item.id || ''),
    username: item.username || 'Unknown',
    first_name: item.first_name || '',
    last_name: item.last_name || '',
    timestamp: item.timestamp || item.message_time || new Date().toISOString(),
    topic_name: item.topic_name || '',
    likes_count: item.likes_count || 0,
    telegram_message_id: item.telegram_message_id || item.id,
    chat_id: item.chat_id || 0,
    message_type: item.message_type || 'text',
    last_active: item.last_active || new Date().toISOString(),
    category: item.category || 'general',
    is_active: item.is_active !== undefined ? item.is_active : true,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString()
  }));
}