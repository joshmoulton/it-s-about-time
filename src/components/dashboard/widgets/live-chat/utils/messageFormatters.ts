
import type { ChatMessage } from '@/services/chat/types';

export const formatAuthorName = (message: ChatMessage): string => {
  if (message.username) return `@${message.username}`;
  return `${message.first_name || 'User'} ${message.last_name || ''}`.trim();
};

export const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
  return `${Math.floor(diffMinutes / 1440)}d`;
};
