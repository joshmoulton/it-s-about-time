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
  
  // Fetch messages with topic filtering at database level
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['unified-telegram-messages', limit, selectedTopic],
    queryFn: async () => {
      let query = supabase
        .from('telegram_messages')
        .select('*')
        .order('timestamp', { ascending: false });

      // Apply topic filter at database level if topic is selected
      if (selectedTopic && selectedTopic !== 'all') {
        query = query.eq('topic_name', selectedTopic);
      }

      const { data, error } = await query.limit(limit);

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      console.log(`🔍 Fetched ${data?.length || 0} messages for topic "${selectedTopic || 'all'}"`);
      return (data || []) as any;
    },
    refetchInterval: 30000,
    staleTime: 10000,
    refetchOnWindowFocus: true,
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
    refetchInterval: 60000, // Poll every 60 seconds for topic mappings
    staleTime: 30000, // Topic mappings are fresh for 30 seconds
    refetchOnWindowFocus: false,
  });

  // Messages are already filtered at database level, so use them directly
  const filteredMessages = messages;

  // Get available topic names from all messages (fetch separately for topic list)
  const { data: allMessagesForTopics = [] } = useQuery({
    queryKey: ['all-telegram-messages-topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_messages')
        .select('topic_name')
        .not('topic_name', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(1000); // Get more messages just for topic discovery

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000, // Cache topic list for 1 minute
  });

  const availableTopics = [...new Set(allMessagesForTopics.map(m => m.topic_name).filter(Boolean))];

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