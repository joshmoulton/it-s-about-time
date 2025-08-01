import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface ConnectionStatus {
  online: boolean;
  downlink?: number;
  effectiveType?: string;
  saveData?: boolean;
}

// Hook for monitoring network connection status
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    online: navigator.onLine,
    downlink: (navigator as any).connection?.downlink,
    effectiveType: (navigator as any).connection?.effectiveType,
    saveData: (navigator as any).connection?.saveData,
  });

  useEffect(() => {
    const updateConnectionStatus = () => {
      const connection = (navigator as any).connection;
      setStatus({
        online: navigator.onLine,
        downlink: connection?.downlink,
        effectiveType: connection?.effectiveType,
        saveData: connection?.saveData,
      });
    };

    const handleOnline = () => {
      updateConnectionStatus();
      toast.success('Connection restored', {
        description: 'You\'re back online!'
      });
    };

    const handleOffline = () => {
      updateConnectionStatus();
      toast.error('Connection lost', {
        description: 'Please check your internet connection'
      });
    };

    const handleConnectionChange = () => {
      updateConnectionStatus();
      
      // Warn about slow connections
      const connection = (navigator as any).connection;
      if (connection?.effectiveType === 'slow-2g') {
        toast.warning('Slow connection detected', {
          description: 'Some features may be limited'
        });
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Initial status update
    updateConnectionStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return {
    ...status,
    isSlowConnection: status.effectiveType === 'slow-2g' || status.effectiveType === '2g',
    isOffline: !status.online,
    shouldOptimizeData: status.saveData || status.effectiveType === 'slow-2g',
  };
}

// Hook for adaptive loading based on connection
export function useAdaptiveLoading() {
  const connection = useConnectionStatus();

  return {
    // Reduce image quality on slow connections
    imageQuality: connection.isSlowConnection ? 'low' : 'high',
    
    // Reduce polling frequency on slow connections
    pollingInterval: connection.isSlowConnection ? 60000 : 30000,
    
    // Disable auto-refresh on very slow connections
    enableAutoRefresh: !connection.isSlowConnection,
    
    // Batch requests on slow connections
    enableBatching: connection.isSlowConnection,
    
    // Preload less content on slow connections
    preloadLimit: connection.isSlowConnection ? 2 : 5,
    
    // Use smaller chunk sizes for large data
    chunkSize: connection.isSlowConnection ? 10 : 50,
    
    // Connection info for debugging
    connectionInfo: connection,
  };
}