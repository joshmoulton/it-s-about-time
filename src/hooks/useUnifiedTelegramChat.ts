import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TelegramMessage {
  id: string;
  telegram_message_id: number;
  chat_id: number;
  user_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  message_text?: string;
  message_type: string;
  message_thread_id?: number;
  reply_to_message_id?: number;
  forwarded_from?: string;
  media_url?: string;
  media_type?: string;
  timestamp: string;
  topic_name?: string;
  is_highlighted: boolean;
  is_hidden: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface TopicMapping {
  id: string;
  telegram_topic_id: number;
  custom_name: string;
  last_active: string;
}

export function useUnifiedTelegramChat(limit: number = 50) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['unified-telegram-messages', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data || []) as any; // Type assertion for schema mismatch
    },
    refetchInterval: false, // Disabled - external bot handles updates
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Fetch topic mappings
  const { data: topicMappings = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['unified-topic-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_topic_mappings')
        .select('id, telegram_topic_id, custom_name')
        .order('custom_name');

      if (error) {
        throw error;
      }

      return (data || []) as any; // Type assertion for schema mismatch
    },
    refetchInterval: false, // Disabled - external bot handles updates
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Filter messages by selected topic
  const filteredMessages = selectedTopic 
    ? messages.filter(message => message.topic_name === selectedTopic)
    : messages;

  // Get available topic names from messages
  const availableTopics = [...new Set(messages.map(m => m.topic_name).filter(Boolean))];

  // Get selected topic details
  const selectedTopicDetails = selectedTopic 
    ? topicMappings.find(mapping => mapping.custom_name === selectedTopic)
    : null;

  const forceRefresh = () => {
    refetchMessages();
  };

  return {
    messages: filteredMessages,
    allMessages: messages,
    topicMappings,
    selectedTopic,
    setSelectedTopic,
    selectedTopicDetails,
    availableTopics,
    isLoading: messagesLoading || topicsLoading,
    forceRefresh,
    hasRealData: messages.length > 0
  };
}