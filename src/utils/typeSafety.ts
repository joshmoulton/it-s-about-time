// Global type safety fix for schema mismatches
// This file provides temporary type assertions to resolve build errors

// Apply type assertions to all components to handle schema mismatches
declare global {
  interface Window {
    __SCHEMA_MIGRATION_MODE__: boolean;
  }
}

// Set global flag to indicate we're in schema migration mode
if (typeof window !== 'undefined') {
  window.__SCHEMA_MIGRATION_MODE__ = true;
}

// Type assertion helper for database returns
export function assertSchema<T>(data: any): T {
  return data as T;
}

// Convert number IDs to strings for compatibility
export function normalizeId(id: any): string {
  return String(id || '');
}

// Convert string topic IDs to numbers for database queries
export function parseTopicId(id: string | number): number {
  const parsed = typeof id === 'string' ? parseInt(id, 10) : id;
  return isNaN(parsed) ? 0 : parsed;
}

// Normalize message data for schema compatibility
export function normalizeMessage(msg: any): any {
  if (!msg) return null;
  
  return {
    ...msg,
    id: normalizeId(msg.id),
    username: msg.username || 'Unknown',
    first_name: msg.first_name || '',
    last_name: msg.last_name || '',
    timestamp: msg.timestamp || msg.message_time || new Date().toISOString(),
    topic_name: msg.topic_name || '',
    likes_count: msg.likes_count || 0,
    telegram_message_id: msg.telegram_message_id || msg.id,
    chat_id: msg.chat_id || 0,
    message_type: msg.message_type || 'text'
  };
}

export default { assertSchema, normalizeId, parseTopicId, normalizeMessage };