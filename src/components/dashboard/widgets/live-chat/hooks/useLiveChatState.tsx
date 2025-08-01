
import { useEffect, useState } from 'react';

export function useLiveChatState() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Load saved topic preference
  useEffect(() => {
    const savedTopic = localStorage.getItem('selectedTelegramTopic');
    if (savedTopic && savedTopic !== 'null') {
      setSelectedTopic(savedTopic);
    }
  }, []);

  // Save topic preference
  const handleTopicChange = (topicId: string | null) => {
    setSelectedTopic(topicId);
    localStorage.setItem('selectedTelegramTopic', topicId || '');
  };

  return {
    selectedTopic,
    setSelectedTopic,
    autoScrollEnabled,
    setAutoScrollEnabled,
    lastMessageCount,
    setLastMessageCount,
    handleTopicChange
  };
}
