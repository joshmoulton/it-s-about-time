
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: string | null;
}

interface ConnectionStatusIndicatorProps {
  connectionState: ConnectionState;
  onReconnect: () => void;
  className?: string;
}

export function ConnectionStatusIndicator({ 
  connectionState, 
  onReconnect, 
  className = "" 
}: ConnectionStatusIndicatorProps) {
  const getStatusInfo = () => {
    switch (connectionState.status) {
      case 'connected':
        return {
          icon: CheckCircle,
          text: 'Connected',
          color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300',
          showReconnect: false
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          text: 'Connecting...',
          color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
          showReconnect: false,
          animate: true
        };
      case 'reconnecting':
        return {
          icon: RefreshCw,
          text: `Reconnecting (${connectionState.reconnectAttempts})`,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
          showReconnect: true,
          animate: true
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Connection Error',
          color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300',
          showReconnect: true
        };
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          text: 'Disconnected',
          color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300',
          showReconnect: true
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const formatLastConnected = () => {
    if (!connectionState.lastConnected) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - connectionState.lastConnected.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`flex items-center gap-1 text-xs px-2 py-1 ${statusInfo.color}`}
          >
            <StatusIcon 
              className={`h-3 w-3 ${statusInfo.animate ? 'animate-spin' : ''}`} 
            />
            {statusInfo.text}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1">
            <p>Status: {connectionState.status}</p>
            <p>Last connected: {formatLastConnected()}</p>
            {connectionState.error && (
              <p className="text-red-400">Error: {connectionState.error}</p>
            )}
            {connectionState.reconnectAttempts > 0 && (
              <p>Reconnect attempts: {connectionState.reconnectAttempts}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {statusInfo.showReconnect && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReconnect}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Reconnect to live chat</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
