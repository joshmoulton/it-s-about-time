
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
// BeehiIV subscriber removed - simplified auth
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

interface SendMessageParams {
  message: string;
  messageThreadId?: number | null;
  topicName?: string | null;
}

export function useSendTelegramMessage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Subscriber removed - using simplified auth
  const { currentUser } = useEnhancedAuth();

  return useMutation({
    mutationFn: async ({ message, messageThreadId, topicName }: SendMessageParams) => {
      // Check authentication
      const userEmail = currentUser?.email;
      const isAdmin = currentUser?.user_type === 'supabase_admin';
      
      if (!userEmail) {
        throw new Error('User not authenticated');
      }

      // Basic content filtering
      const filteredMessage = message.trim();
      if (!filteredMessage) {
        throw new Error('Message cannot be empty');
      }

      if (filteredMessage.length > 4000) {
        throw new Error('Message too long (max 4000 characters)');
      }

      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'send_message',
          message: filteredMessage,
          messageThreadId,
          topicName,
          userEmail: userEmail,
          userName: isAdmin ? 'Admin' : (userEmail.split('@')[0] || 'User')
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the Telegram community",
      });
      
      // Refresh related queries
      queryClient.invalidateQueries({ queryKey: ['telegram-messages'] });
      queryClient.invalidateQueries({ queryKey: ['telegram-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['telegram-stats'] });
    },
    onError: (error) => {
      console.error('Send message error:', error);
      toast({
        title: "Failed to Send Message",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
