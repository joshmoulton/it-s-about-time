import { useState, useEffect } from 'react';
import { useOptimizedQuery } from './useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';

interface Alert {
  id: string;
  coin: string;
  marketType: string;
  positionDirection: 'Long' | 'Short';
  entryPrice: number | null;
  stopLoss: number | null;
  target: number | null;
  caller: string;
  createdAt: string;
  status: 'active_trade' | 'entry_triggered' | 'awaiting_confirmation';
}

interface AlertsData {
  alerts: Alert[];
  tradingCount: number;
  awaitingCount: number;
  totalCount: number;
}

interface UseActiveAlertsRestReturn {
  alerts: Alert[];
  tradingAlerts: Alert[];
  awaitingAlerts: Alert[];
  tradingCount: number;
  awaitingCount: number;
  totalCount: number;
  isConnected: boolean; // Always true for REST
  isConnecting: boolean;
  error: string | null;
  reconnect: () => void;
}

export function useActiveAlertsRest(): UseActiveAlertsRestReturn {
  const [tradingAlerts, setTradingAlerts] = useState<Alert[]>([]);
  const [awaitingAlerts, setAwaitingAlerts] = useState<Alert[]>([]);
  const [tradingCount, setTradingCount] = useState(0);
  const [awaitingCount, setAwaitingCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const {
    data: alertsData,
    isLoading,
    error: queryError,
    refetch
  } = useOptimizedQuery<AlertsData>({
    queryKey: ['active-alerts-rest'],
    queryFn: async () => {
      console.log('🔄 Fetching alerts from REST endpoint...');
      
      // Get the current session to include auth headers
      const { data: sessionData } = await supabase.auth.getSession();
      const authHeaders: Record<string, string> = {};
      
      if (sessionData?.session?.access_token) {
        authHeaders['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }
      
      const response = await fetch('https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/active-alerts-widget', {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      });
      
      if (!response.ok) {
        // Suppress 401 errors for free users (expected behavior)
        if (response.status === 401) {
          console.log('ℹ️ Premium content access restricted for current user tier');
          return { alerts: [], tradingCount: 0, awaitingCount: 0, totalCount: 0 };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 REST API Response:', data);
      return data;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute (formerly cacheTime)
    refetchInterval: 45000, // Refetch every 45 seconds
    retry: 2
  });

  useEffect(() => {
    if (alertsData) {
      console.log('📊 Processing alerts data:', alertsData);
      
      const allAlerts = alertsData.alerts || [];
      
      // Debug: Log first few alerts to see their structure
      if (allAlerts.length > 0) {
        console.log('🔍 First alert structure:', allAlerts[0]);
        console.log('🔍 Alert statuses:', allAlerts.map(a => a.status));
      }
      
      // Validate alert data completeness
      const incompleteAlerts = allAlerts.filter(alert => 
        alert.entryPrice === null || alert.stopLoss === null || alert.target === null
      );
      
      if (incompleteAlerts.length > 0) {
        console.warn('⚠️ Found alerts with missing data:', incompleteAlerts.length, incompleteAlerts);
      }
      
      // Filter based on the status field from API
      // "active_trade" and "entry_triggered" are trading alerts
      // "awaiting_confirmation" are awaiting alerts
      const tradingFiltered = allAlerts.filter(alert => 
        alert.status === 'active_trade' || alert.status === 'entry_triggered'
      );
      
      const awaitingFiltered = allAlerts.filter(alert => 
        alert.status === 'awaiting_confirmation'
      );
      
      console.log('🔍 Trading alerts filtered:', tradingFiltered.length, tradingFiltered);
      console.log('🔍 Awaiting alerts filtered:', awaitingFiltered.length, awaitingFiltered);
      
      setTradingAlerts(tradingFiltered);
      setAwaitingAlerts(awaitingFiltered);
      
      setTradingCount(alertsData.tradingCount || tradingFiltered.length);
      setAwaitingCount(alertsData.awaitingCount || awaitingFiltered.length);
      setTotalCount(alertsData.totalCount || allAlerts.length);
    }
  }, [alertsData]);

  const reconnect = () => {
    console.log('🔄 Manual refresh triggered');
    refetch();
  };

  return {
    alerts: [...tradingAlerts, ...awaitingAlerts],
    tradingAlerts,
    awaitingAlerts,
    tradingCount,
    awaitingCount,
    totalCount,
    isConnected: true, // REST is always "connected"
    isConnecting: isLoading,
    error: queryError?.message || null,
    reconnect
  };
}