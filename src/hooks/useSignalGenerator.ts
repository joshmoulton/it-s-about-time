
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SignalFormData {
  analystName: string;
  market: string;
  tradeType: string;
  tradeDirection: string;
  ticker: string;
  riskPercentage: number;
  entryType: string;
  entryPrice?: number;
  entryConditions?: string;
  riskManagement: string;
  stopLossPrice?: number;
  stopLossConditions?: string;
  fullDescription: string;
}

interface CreateSignalData extends SignalFormData {
  targets: string[];
  analystPhoto?: File | null;
}

export const useSignalGenerator = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [formattedOutput, setFormattedOutput] = useState<string>('');
  
  // Get current admin user's analyst info
  const { data: currentAdmin } = useQuery({
    queryKey: ['current-admin-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return null;

      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select(`
          *,
          analysts (
            name,
            display_name
          )
        `)
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return adminUser;
    },
  });

  const [formData, setFormData] = useState<SignalFormData>({
    analystName: '',
    market: '',
    tradeType: '',
    tradeDirection: '',
    ticker: '',
    riskPercentage: 2.5,
    entryType: '',
    entryPrice: undefined,
    entryConditions: '',
    riskManagement: '',
    stopLossPrice: undefined,
    stopLossConditions: '',
    fullDescription: '',
  });

  // Auto-populate analyst name for analyst users
  useEffect(() => {
    if (currentAdmin && currentAdmin.role === 'analyst' && currentAdmin.analysts) {
      setFormData(prev => ({
        ...prev,
        analystName: currentAdmin.analysts.display_name || currentAdmin.analysts.name
      }));
    }
  }, [currentAdmin]);

  const updateFormData = (updates: Partial<SignalFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const generateFormattedOutput = (data: SignalFormData, targets: string[]) => {
    const entryDisplay = (data.entryType === 'conditional' || data.entryType === 'trigger') 
      ? 'Read Further.' 
      : data.entryPrice?.toString() || 'Market';

    const invalidationDisplay = data.riskManagement === 'conditional' 
      ? 'Read Further.' 
      : data.stopLossPrice?.toString() || 'See Description';

    const targetsDisplay = targets.length > 0 ? targets.join(', ') : 'See Description';

    return `MARKET: ${data.market.toUpperCase()} ${data.ticker.toUpperCase()} ${data.entryType.toUpperCase()} ${data.tradeDirection.toUpperCase()}

Entry: ${entryDisplay}
Invalidation: ${invalidationDisplay}
Targets: ${targetsDisplay}

Risk: ${data.riskPercentage}%

${data.fullDescription}`;
  };

  const generatePreview = (data: CreateSignalData) => {
    const formatted = generateFormattedOutput(data, data.targets);
    setFormattedOutput(formatted);
  };

  const createSignal = async (data: CreateSignalData) => {
    setIsCreating(true);
    try {
      // Upload analyst photo if provided
      let photoUrl = null;
      if (data.analystPhoto) {
        const fileExt = data.analystPhoto.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assets')
          .upload(`analyst-photos/${fileName}`, data.analystPhoto);

        if (uploadError) throw uploadError;
        
        const { data: publicUrl } = supabase.storage
          .from('assets')
          .getPublicUrl(uploadData.path);
        
        photoUrl = publicUrl.publicUrl;
      }

      // Create the formatted output
      const formatted = generateFormattedOutput(data, data.targets);

      // Insert the signal with correct column names matching the database schema
      const { data: signalData, error } = await supabase
        .from('analyst_signals')
        .insert({
          analyst_name: data.analystName,  // This matches the database column
          analyst_photo_url: photoUrl,
          market: data.market as any,
          trade_type: data.tradeType as any,
          trade_direction: data.tradeDirection as any,
          ticker: data.ticker,
          risk_percentage: data.riskPercentage,
          entry_type: data.entryType as any,
          entry_price: data.entryPrice,
          entry_conditions: data.entryConditions,
          risk_management: data.riskManagement as any,
          stop_loss_price: data.stopLossPrice,
          stop_loss_conditions: data.stopLossConditions,
          targets: data.targets,
          full_description: data.fullDescription,
          formatted_output: formatted,
        })
        .select()
        .single();

      if (error) throw error;

      // Automatically send to Telegram
      try {
        const { error: notificationError } = await supabase.functions.invoke('degen-call-notifier', {
          body: {
            analyst_signal_id: signalData.id,
            trigger_type: 'auto_creation'
          }
        });

        if (notificationError) {
          console.error('Failed to send Telegram notification:', notificationError);
          toast.success('Trading signal created successfully, but failed to send Telegram notification');
        } else {
          toast.success('Trading signal created and sent to Telegram successfully!');
        }
      } catch (notificationError) {
        console.error('Error sending Telegram notification:', notificationError);
        toast.success('Trading signal created successfully, but failed to send Telegram notification');
      }
      
      // Reset form
      setFormData({
        analystName: '',
        market: '',
        tradeType: '',
        tradeDirection: '',
        ticker: '',
        riskPercentage: 2.5,
        entryType: '',
        entryPrice: undefined,
        entryConditions: '',
        riskManagement: '',
        stopLossPrice: undefined,
        stopLossConditions: '',
        fullDescription: '',
      });
      setFormattedOutput('');

      // Invalidate queries to refresh the management dashboard
      queryClient.invalidateQueries({ queryKey: ['analyst-signals'] });
    } catch (error) {
      console.error('Error creating signal:', error);
      toast.error('Failed to create trading signal');
    } finally {
      setIsCreating(false);
    }
  };

  return {
    formData,
    updateFormData,
    createSignal,
    isCreating,
    formattedOutput,
    generatePreview,
    currentAdmin,
  };
};
