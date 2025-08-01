
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TopicMapping {
  id: string;
  telegram_topic_id: number;
  custom_name: string;
  original_name?: string;
  description?: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SyncStatus {
  id: string;
  sync_type: string;
  status: string;
  messages_processed: number;
  messages_synced: number;
  messages_deleted: number;
  errors_count: number;
  created_at: string;
  metadata: any;
}

export function useTopicManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch topic mappings
  const { data: topicMappings, isLoading: mappingsLoading } = useQuery({
    queryKey: ['topic-mappings'],
    queryFn: async (): Promise<TopicMapping[]> => {
      const { data, error } = await supabase
        .from('telegram_topic_mappings')
        .select('*')
        .order('telegram_topic_id');

      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        id: String(item.id),
        category: item.category || 'general',
        is_active: item.is_active !== undefined ? item.is_active : true,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      }));
    },
    staleTime: Infinity,
    refetchInterval: false, // Disabled - external bot handles updates
    refetchOnWindowFocus: false,
  });

  // Fetch sync status
  const { data: syncStatus, isLoading: syncStatusLoading } = useQuery({
    queryKey: ['sync-status'],
    queryFn: async (): Promise<SyncStatus[]> => {
      const { data, error } = await supabase
        .from('telegram_sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: false, // Disabled - external bot handles updates
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Create topic mapping mutation
  const createTopicMapping = useMutation({
    mutationFn: async (mapping: {
      telegram_topic_id: number;
      custom_name: string;
      original_name?: string;
      description?: string;
      category: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: {
          action: 'create_topic_mapping',
          ...mapping
        }
      });

      if (error) throw error;
      return (data || []) as any; // Type assertion for schema mismatch
    },
    onSuccess: () => {
      toast({
        title: "Topic Mapping Created",
        description: "Successfully created topic mapping",
      });
      queryClient.invalidateQueries({ queryKey: ['topic-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['telegram-topics'] });
    },
    onError: (error) => {
      console.error('Create mapping error:', error);
      toast({
        title: "Failed to Create Mapping",
        description: "Could not create topic mapping",
        variant: "destructive",
      });
    }
  });

  // Update topic mapping mutation
  const updateTopicMapping = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('telegram_topic_mappings')
        .update(updates)
        .eq('id', parseInt(id));

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Topic Mapping Updated",
        description: "Successfully updated topic mapping",
      });
      queryClient.invalidateQueries({ queryKey: ['topic-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['telegram-topics'] });
    },
    onError: (error) => {
      console.error('Update mapping error:', error);
      toast({
        title: "Failed to Update Mapping",
        description: "Could not update topic mapping",
        variant: "destructive",
      });
    }
  });

  // Delete topic mapping mutation
  const deleteTopicMapping = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('telegram_topic_mappings')
        .delete()
        .eq('id', parseInt(id));

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Topic Mapping Deleted",
        description: "Successfully deleted topic mapping",
      });
      queryClient.invalidateQueries({ queryKey: ['topic-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['telegram-topics'] });
    },
    onError: (error) => {
      console.error('Delete mapping error:', error);
      toast({
        title: "Failed to Delete Mapping",
        description: "Could not delete topic mapping",
        variant: "destructive",
      });
    }
  });

  // Enhanced sync mutation
  const enhancedSync = useMutation({
    mutationFn: async (options: {
      syncType?: string;
      includeTopicDiscovery?: boolean;
      forceRefresh?: boolean;
    } = {}) => {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: {
          action: 'enhanced_sync',
          sync_type: options.syncType || 'full',
          include_topic_discovery: options.includeTopicDiscovery ?? true,
          force_refresh: options.forceRefresh ?? false
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Enhanced Sync Completed",
        description: `Synced ${data.synced} messages, discovered ${data.topics_discovered || 0} topics`,
      });
      queryClient.invalidateQueries({ queryKey: ['telegram-messages'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-telegram-messages'] });
      queryClient.invalidateQueries({ queryKey: ['telegram-topics'] });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
    onError: (error) => {
      console.error('Enhanced sync error:', error);
      toast({
        title: "Enhanced Sync Failed",
        description: "Failed to perform enhanced sync",
        variant: "destructive",
      });
     }
   });

   // Stop sync mutation
   const stopSync = useMutation({
     mutationFn: async () => {
       const { data, error } = await supabase.functions.invoke('telegram-bot', {
         body: { action: 'force_stop' }
       });

       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       toast({
         title: "Sync Stopped",
         description: "Successfully stopped running sync job",
       });
       queryClient.invalidateQueries({ queryKey: ['sync-status'] });
     },
     onError: (error) => {
       console.error('Stop sync error:', error);
       toast({
         title: "Failed to Stop Sync",
         description: "Could not stop running sync job",
         variant: "destructive",
       });
     }
   });

   return {
     topicMappings,
     syncStatus,
     mappingsLoading,
     syncStatusLoading,
     createTopicMapping: (mapping: any) => createTopicMapping.mutate(mapping),
     updateTopicMapping: (id: string, updates: Partial<TopicMapping>) => 
       updateTopicMapping.mutate({ id, updates }),
     deleteTopicMapping: (id: string) => deleteTopicMapping.mutate(id),
     enhancedSync: (options?: any) => enhancedSync.mutate(options),
     stopSync: () => stopSync.mutate(),
     isCreating: createTopicMapping.isPending,
     isUpdating: updateTopicMapping.isPending,
     isDeleting: deleteTopicMapping.isPending,
     isSyncing: enhancedSync.isPending,
     isStopping: stopSync.isPending,
   };
}
