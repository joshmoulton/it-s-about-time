
import React from 'react';
import { RefreshCw, AlertTriangle, Wifi, WifiOff, Globe } from 'lucide-react';

interface StatusIndicatorProps {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function StatusIndicator({ isConnected, isConnecting, error }: StatusIndicatorProps) {
  if (error) {
    const isNetworkError = error.includes('service may be unavailable') || error.includes('connection error');
    return {
      icon: isNetworkError ? <Globe className="h-3 w-3 text-red-500" /> : <AlertTriangle className="h-3 w-3 text-red-500" />,
      text: isNetworkError ? "SERVICE UNAVAILABLE" : "ERROR",
      color: "text-red-600"
    };
  }
  
  if (isConnecting) {
    return {
      icon: <RefreshCw className="h-3 w-3 text-yellow-500 animate-spin" />,
      text: "CONNECTING",
      color: "text-yellow-600"
    };
  }
  
  if (isConnected) {
    return {
      icon: <Wifi className="h-3 w-3 text-green-500" />,
      text: "LIVE",
      color: "text-green-600"
    };
  }
  
  return {
    icon: <WifiOff className="h-3 w-3 text-gray-500" />,
    text: "DISCONNECTED",
    color: "text-gray-600"
  };
}
