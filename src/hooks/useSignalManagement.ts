
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSignalManagement = () => {
  const queryClient = useQueryClient();

  const { data: signals, isLoading } = useQuery({
    queryKey: ['analyst-signals'],
    queryFn: async () => {
      // Check if user is admin
      const { data: adminCheck } = await supabase.rpc('is_current_user_admin');
      
      let query = supabase.from('analyst_signals').select('*');
      
      // If not admin, only show signals created by current user
      if (!adminCheck) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq('created_by', user.id);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['analyst-signals-stats'],
    queryFn: async () => {
      // Check if user is admin
      const { data: adminCheck } = await supabase.rpc('is_current_user_admin');
      
      let query = supabase.from('analyst_signals').select('status, analyst_name, created_at, created_by');
      
      // If not admin, only show signals created by current user
      if (!adminCheck) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq('created_by', user.id);
        }
      }
      
      const { data, error } = await query;

      if (error) throw error;

      const total = data.length;
      const active = data.filter(signal => signal.status === 'active').length;
      const thisWeek = data.filter(signal => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(signal.created_at) > weekAgo;
      }).length;
      const analysts = new Set(data.map(signal => signal.analyst_name)).size;

      return { total, active, thisWeek, analysts };
    },
    enabled: !!signals,
  });

  const updateSignalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('analyst_signals')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyst-signals'] });
      queryClient.invalidateQueries({ queryKey: ['analyst-signals-stats'] });
      toast.success('Signal updated successfully');
    },
    onError: (error) => {
      console.error('Error updating signal:', error);
      toast.error('Failed to update signal');
    },
  });

  const deleteSignalMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, delete related degen call notifications
      const { error: notificationError } = await supabase
        .from('degen_call_notifications')
        .delete()
        .eq('analyst_signal_id', id);

      if (notificationError) {
        console.error('Error deleting related notifications:', notificationError);
        throw new Error(`Failed to delete related notifications: ${notificationError.message}`);
      }

      // Then delete the analyst signal
      const { error } = await supabase
        .from('analyst_signals')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete signal: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyst-signals'] });
      queryClient.invalidateQueries({ queryKey: ['analyst-signals-stats'] });
      toast.success('Signal deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting signal:', error);
      const errorMessage = error.message || 'Failed to delete signal';
      toast.error(errorMessage);
    },
  });

  const sendToTelegramMutation = useMutation({
    mutationFn: async (signalId: string) => {
      const { error } = await supabase.functions.invoke('degen-call-notifier', {
        body: {
          analyst_signal_id: signalId,
          trigger_type: 'manual'
        }
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyst-signals'] });
      toast.success('Signal sent to Telegram successfully!');
    },
    onError: (error) => {
      console.error('Error sending signal to Telegram:', error);
      toast.error('Failed to send signal to Telegram');
    },
  });

  const updateSignalStatus = (id: string, status: string) => {
    updateSignalMutation.mutate({ id, status });
  };

  const deleteSignal = (id: string) => {
    if (confirm('Are you sure you want to delete this signal?')) {
      deleteSignalMutation.mutate(id);
    }
  };

  const sendToTelegram = (signalId: string) => {
    sendToTelegramMutation.mutate(signalId);
  };

  return {
    signals,
    isLoading,
    stats,
    updateSignalStatus,
    deleteSignal,
    sendToTelegram,
  };
};
