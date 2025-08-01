
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff, AlertTriangle, Globe } from 'lucide-react';

interface ConnectionStatesProps {
  error: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  onReconnect: () => void;
}

export function ConnectionStates({ error, isConnecting, isConnected, onReconnect }: ConnectionStatesProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="flex flex-col items-center space-y-2 text-center">
          {error.includes('service may be unavailable') ? (
            <Globe className="h-6 w-6 text-red-400" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-red-400" />
          )}
          <p className="text-sm text-red-400">
            {error.includes('service may be unavailable') ? 'Service Unavailable' : 'Connection Error'}
          </p>
          <p className="text-xs text-gray-400 max-w-xs">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReconnect}
            disabled={isConnecting}
            className="mt-2 text-white border-gray-600 hover:bg-gray-700"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                Connecting...
              </>
            ) : (
              'Retry Connection'
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="flex flex-col items-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          <p className="text-sm text-gray-300">Connecting to live feed...</p>
          <p className="text-xs text-gray-500">Establishing WebSocket connection</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="flex flex-col items-center space-y-2 text-center">
          <WifiOff className="h-6 w-6 text-gray-400" />
          <p className="text-sm text-gray-300">Disconnected</p>
          <p className="text-xs text-gray-500">Click retry to reconnect</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReconnect}
            className="mt-2 text-white border-gray-600 hover:bg-gray-700"
          >
            Connect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full text-white">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
        <p className="text-sm text-gray-400">Waiting for new trading alerts...</p>
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Connected and monitoring</span>
        </div>
      </div>
    </div>
  );
}
