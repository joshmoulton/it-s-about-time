
import { useEnhancedMessageSync } from '@/hooks/useEnhancedMessageSync';
import { useTelegramIntegration } from '@/hooks/useTelegramIntegration';

export function useLiveChatSync() {
  const { syncMessages, isSyncing, lastSync } = useEnhancedMessageSync();
  const { syncTopicNames, isSyncingTopics } = useTelegramIntegration();

  // Enhanced sync function with comprehensive cleanup and topic discovery
  const handleSync = async (refetchTopics: () => void) => {
    try {
      console.log('🔄 Starting comprehensive sync with topic discovery...');
      
      // First sync topic names to ensure topics are up to date
      await syncTopicNames();
      await refetchTopics();
      
      // Then perform enhanced sync with topic discovery
      syncMessages({ 
        includeCleanup: true, 
        forceRefresh: true,
        includeTopicDiscovery: true
      });
      
      console.log('✅ Enhanced sync completed successfully');
    } catch (error) {
      console.error('❌ Failed to perform enhanced sync:', error);
    }
  };

  return {
    handleSync,
    isSyncing: isSyncing || isSyncingTopics,
    lastSync
  };
}
