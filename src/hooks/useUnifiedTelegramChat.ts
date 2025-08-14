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

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

export function useUnifiedTelegramChat(limit: number = 50, subscriber?: Subscriber) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Only fetch messages if user has premium access
  const shouldFetchData = subscriber?.subscription_tier === 'premium' || subscriber?.subscription_tier === 'paid';
  
  // Fetch messages with topic filtering at database level
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['unified-telegram-messages', limit, selectedTopic, subscriber?.email],
    queryFn: async () => {
      console.log('🔍 Fetching telegram messages for user:', subscriber?.email, 'tier:', subscriber?.subscription_tier);
      
      if (!shouldFetchData) {
        console.log('❌ User does not have access to telegram messages');
        return [];
      }

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
        console.error('❌ Error fetching telegram messages:', error);
        console.error('❌ Error details:', {
          message: error.message,
          hint: error.hint,
          details: error.details,
          code: error.code
        });
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} telegram messages for topic "${selectedTopic || 'all'}"`);
      return (data || []) as any;
    },
    enabled: shouldFetchData, // Only run query if user has access
    refetchInterval: 15000, // Poll every 15 seconds for new messages
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnMount: true, // Always fetch fresh data on mount
  });

  // Fetch topic mappings
  const { data: topicMappings = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['unified-topic-mappings', subscriber?.email],
    queryFn: async () => {
      if (!shouldFetchData) {
        return [];
      }

      const { data, error } = await supabase
        .from('telegram_topic_mappings')
        .select('id, telegram_topic_id, custom_name')
        .order('custom_name');

      if (error) {
        console.error('❌ Error fetching topic mappings:', error);
        throw error;
      }

      return (data || []) as any; // Type assertion for schema mismatch
    },
    enabled: shouldFetchData,
    refetchInterval: false, // Disable polling to reduce API calls
    staleTime: 300000, // Topic mappings are fresh for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Messages are already filtered at database level, so use them directly
  const filteredMessages = messages;

  // Get available topic names from all messages (fetch separately for topic list)
  const { data: allMessagesForTopics = [] } = useQuery({
    queryKey: ['all-telegram-messages-topics', subscriber?.email],
    queryFn: async () => {
      if (!shouldFetchData) {
        return [];
      }

      const { data, error } = await supabase
        .from('telegram_messages')
        .select('topic_name')
        .not('topic_name', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(1000); // Get more messages just for topic discovery

      if (error) {
        console.error('❌ Error fetching topics:', error);
        throw error;
      }
      return data || [];
    },
    enabled: shouldFetchData,
    staleTime: 300000, // Cache topic list for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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