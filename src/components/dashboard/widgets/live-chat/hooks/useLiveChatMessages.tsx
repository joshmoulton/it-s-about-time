
import React from 'react';
import { useTopicManagement } from '@/hooks/useTopicManagement';

// Reduced and simplified mock messages for better performance
const mockMessages = [
  {
    id: 'mock-1',
    first_name: 'Jordan',
    username: 'crypto_jordan',
    message_text: 'Anyone else seeing this massive volume spike on SOL? 👀',
    timestamp: new Date(Date.now() - 30 * 1000).toISOString(),
    message_type: 'text'
  },
  {
    id: 'mock-2',
    first_name: 'Maya',
    username: 'maya_trades',
    message_text: 'BTC just broke through $42k resistance! 🚀 Next stop $45k',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    message_type: 'text'
  },
  {
    id: 'mock-3',
    first_name: 'Tony',
    username: 'tonythebull',
    message_text: 'Good morning traders! Ready for another day of gains? ☀️',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    message_type: 'text'
  }
];

export function useLiveChatMessages(liveMessages: any[], selectedTopic: string | null) {
  const { topicMappings } = useTopicManagement();

  // Optimized message filtering with direct topic name matching
  const filteredMessages = React.useMemo(() => {
    console.log('🔍 Filtering messages:', {
      totalMessages: liveMessages?.length || 0,
      selectedTopic,
      sampleMessages: liveMessages?.slice(0, 3).map(m => ({
        id: m.id,
        topic_name: m.topic_name,
        message_text: m.message_text?.substring(0, 50)
      })) || []
    });

    if (!liveMessages || liveMessages.length === 0) {
      console.log('📝 No live messages, using mock data');
      return mockMessages;
    }
    
    if (!selectedTopic || selectedTopic === 'all') {
      console.log('📋 Showing all messages:', liveMessages.length);
      return liveMessages.slice(0, 200);
    }
    
    // Direct topic name filtering - handle both exact matches and variations
    const filtered = liveMessages.filter(message => {
      if (!message.topic_name) return false;
      
      // Handle the specific case differences
      const messageTopicName = message.topic_name;
      let matches = false;
      
      if (selectedTopic === 'Money Glitch') {
        matches = messageTopicName === 'Money Glitch';
      } else if (selectedTopic === 'STOCKS & OPTIONS') {
        // Direct match for database value
        matches = messageTopicName === 'STOCKS & OPTIONS';
      } else {
        // Exact match for other topics
        matches = messageTopicName === selectedTopic;
      }
      
      if (matches) {
        console.log('✅ Message matches filter:', {
          messageId: message.id,
          topicName: message.topic_name,
          selectedTopic,
          messageText: message.message_text?.substring(0, 50)
        });
      }
      
      return matches;
    }).slice(0, 200);

    console.log('📊 Filtering result:', {
      originalCount: liveMessages.length,
      filteredCount: filtered.length,
      selectedTopic,
      topicNamesInData: [...new Set(liveMessages.map(m => m.topic_name).filter(Boolean))]
    });

    return filtered;
  }, [liveMessages, selectedTopic]);

  // Simplified selected topic details
  const selectedTopicDetails = React.useMemo(() => {
    if (!selectedTopic || selectedTopic === 'all' || !topicMappings) return null;
    
    const mapping = topicMappings.find(mapping => mapping.id === selectedTopic);
    if (mapping) {
      return {
        id: mapping.id,
        name: mapping.custom_name,
        telegram_topic_id: mapping.telegram_topic_id
      };
    }
    
    return null;
  }, [selectedTopic, topicMappings]);

  return {
    filteredMessages,
    selectedTopicDetails,
    hasRealData: liveMessages && liveMessages.length > 0
  };
}
