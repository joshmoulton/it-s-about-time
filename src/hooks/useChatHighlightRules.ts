
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatHighlightRule {
  id: string;
  rule_name: string;
  rule_type: 'user' | 'keyword' | 'topic' | 'engagement' | 'time' | 'ai_sentiment' | 'ai_importance';
  rule_config: Record<string, any>;
  priority: number;
  is_active: boolean;
  highlight_color: string;
  highlight_style: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export function useChatHighlightRules() {
  return useQuery({
    queryKey: ['chat-highlight-rules'],
    queryFn: async (): Promise<ChatHighlightRule[]> => {
      const { data, error } = await supabase
        .from('chat_highlight_rules')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ChatHighlightRule[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useChatHighlightActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRule = useMutation({
    mutationFn: async (rule: Omit<ChatHighlightRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('chat_highlight_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-highlight-rules'] });
      toast({
        title: "Highlight Rule Created",
        description: "New highlight rule has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Rule",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChatHighlightRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('chat_highlight_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-highlight-rules'] });
      toast({
        title: "Rule Updated",
        description: "Highlight rule has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Rule",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chat_highlight_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-highlight-rules'] });
      toast({
        title: "Rule Deleted",
        description: "Highlight rule has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Rule",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    createRule: createRule.mutate,
    updateRule: updateRule.mutate,
    deleteRule: deleteRule.mutate,
    isCreating: createRule.isPending,
    isUpdating: updateRule.isPending,
    isDeleting: deleteRule.isPending,
  };
}
