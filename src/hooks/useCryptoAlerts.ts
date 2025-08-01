import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { liveAlertsSupabase } from '@/integrations/supabase/liveAlertsClient';
import { supabase } from '@/integrations/supabase/client';

export interface CryptoAlert {
  id: string;
  symbol: string;
  position_type: string;
  trader_name: string;
  entry_price: number;
  target_price: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  entry_activated: boolean;
  is_active: boolean;
  created_at: string;
  triggered_at?: string;
  current_price?: number;
  quantity?: number;
  profit_loss?: number;
  profit_percentage?: number;
  trade_status?: string;
  updated_at?: string;
  metadata?: any;
  stopped_out?: boolean;
  invalidated?: boolean;
  // Legacy fields for backward compatibility  
  coin?: string;
  caller?: string;
}

export function useCryptoAlerts(limit: number = 20) {
  return useQuery({
    queryKey: ['crypto-alerts', limit],
    queryFn: async (): Promise<CryptoAlert[]> => {
      console.log('🔍 Fetching crypto alerts from main database...');
      const { data, error } = await supabase
        .from('crypto_alerts')
        .select('*')
        .or('is_active.eq.true,entry_activated.eq.true')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching crypto alerts:', error);
        throw error;
      }
      
      console.log('✅ Crypto alerts data:', data);
      return data as CryptoAlert[];
    },
    refetchInterval: 60000, // Increased from 10 seconds to reduce background load
    staleTime: 5000,
    retry: 3, // More retries for better reliability
    refetchOnWindowFocus: false, // Don't refetch on focus for background service
    refetchOnMount: true, // Always fetch on mount
    gcTime: 1000 * 60 * 5, // Keep cache for 5 minutes
  });
}

export function useActiveCryptoAlerts() {
  return useQuery({
    queryKey: ['active-crypto-alerts'],
    queryFn: async (): Promise<CryptoAlert[]> => {
      console.log('🔍 Fetching active crypto alerts from main database...');
      const { data, error } = await supabase
        .from('crypto_alerts')
        .select('*')
        .eq('is_active', true)
        .eq('entry_activated', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      return data as CryptoAlert[];
    },
    refetchInterval: 60000, // Increased background service interval
    staleTime: 5000,
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    gcTime: 1000 * 60 * 5,
  });
}

export function usePendingCryptoAlerts() {
  return useQuery({
    queryKey: ['pending-crypto-alerts'],
    queryFn: async (): Promise<CryptoAlert[]> => {
      console.log('🔍 Fetching pending crypto alerts from main database...');
      
      const { data, error } = await supabase
        .from('crypto_alerts')
        .select('*')
        .eq('is_active', true)
        .eq('entry_activated', false)
        .order('created_at', { ascending: false });

      console.log('📊 Pending alerts query result:', { data, error });
      console.log('🔍 Query conditions: is_active=true, entry_activated=false');
      
      if (error) {
        console.error('❌ Error fetching pending alerts:', error);
        throw error;
      }
      
      // Transform data to match interface expectations
      const transformedData = data?.map(alert => ({
        ...alert,
        coin: alert.symbol, // Legacy field mapping
        caller: alert.trader_name, // Legacy field mapping
      })) || [];
      
      console.log('✅ Pending alerts data:', transformedData);
      return transformedData as CryptoAlert[];
    },
    refetchInterval: 60000, // Increased background service interval
    staleTime: 5000,
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    gcTime: 1000 * 60 * 5,
  });
}

// Real-time subscription hook for live alerts
export function useRealtimeCryptoAlerts() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    console.log('🔌 Setting up real-time subscription for crypto alerts...');
    
    const channel = supabase
      .channel('alerts-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'crypto_alerts' 
      }, (payload) => {
        console.log('🔥 Alert updated:', payload);
        
        // Invalidate and refetch all crypto alert queries
        queryClient.invalidateQueries({ queryKey: ['crypto-alerts'] });
        queryClient.invalidateQueries({ queryKey: ['active-crypto-alerts'] });
        queryClient.invalidateQueries({ queryKey: ['pending-crypto-alerts'] });
      })
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}