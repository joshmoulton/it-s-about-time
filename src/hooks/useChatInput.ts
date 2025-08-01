
import { useState, useRef, useEffect } from 'react';
import { useSendTelegramMessage } from '@/hooks/useSendTelegramMessage';
import { useTelegramPermissions } from '@/hooks/useTelegramPermissions';
// BeehiIV subscriber removed - simplified auth
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

interface UseChatInputProps {
  selectedTopic?: string | null;
  topicName?: string | null;
  messageThreadId?: number | null;
}

export function useChatInput({ selectedTopic, topicName, messageThreadId }: UseChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Subscriber removed - using simplified auth
  const { currentUser } = useEnhancedAuth();
  const { data: permissions, isLoading: permissionsLoading, refetch: refetchPermissions } = useTelegramPermissions();
  const sendMessageMutation = useSendTelegramMessage();

  const maxLength = 4000;
  const charactersLeft = maxLength - message.length;
  const isAdmin = currentUser?.user_type === 'supabase_admin';

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || sendMessageMutation.isPending) return;

    try {
      await sendMessageMutation.mutateAsync({
        message: message.trim(),
        messageThreadId: selectedTopic ? messageThreadId : null,
        topicName: selectedTopic ? topicName : null
      });
      setMessage('');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return {
    message,
    setMessage,
    textareaRef,
    // subscriber removed
    currentUser,
    permissions,
    permissionsLoading,
    refetchPermissions,
    sendMessageMutation,
    maxLength,
    charactersLeft,
    isAdmin,
    handleSend,
    handleKeyDown
  };
}
