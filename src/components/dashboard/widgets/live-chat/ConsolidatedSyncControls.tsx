
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, RotateCcw, Square, Bot, Info } from 'lucide-react';
import { useConsolidatedTelegramSync } from '@/hooks/useConsolidatedTelegramSync';

export function ConsolidatedSyncControls() {
  const {
    sync,
    isSyncing,
    syncStatus,
    isLoadingStatus,
    resetErrors,
    forceStop,
    isResetting,
    isStopping,
    lastSyncResult,
    externalBotActive
  } = useConsolidatedTelegramSync();

  const getSyncStatusColor = (errors: number, isRunning: boolean) => {
    if (isRunning) return 'blue';
    if (errors > 0) return 'red';
    return 'green';
  };

  const getSyncStatusIcon = (errors: number, isRunning: boolean) => {
    if (isRunning) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (errors > 0) return <XCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Telegram Sync Controls</span>
          <div className="flex items-center gap-2">
            {externalBotActive && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                External Bot Active
              </Badge>
            )}
            {syncStatus?.currentState && (
              <Badge 
                variant={getSyncStatusColor(syncStatus.currentState.consecutiveErrors, syncStatus.currentState.isRunning) as any}
                className="flex items-center gap-1"
              >
                {getSyncStatusIcon(syncStatus.currentState.consecutiveErrors, syncStatus.currentState.isRunning)}
                {syncStatus.currentState.isRunning ? 'Syncing' : 
                 syncStatus.currentState.consecutiveErrors > 0 ? 'Errors' : 'Ready'}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* External Bot Status Alert */}
        {externalBotActive && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>External Python Bot Active:</strong> Automatic Telegram polling is disabled. 
              Your Python bot is now handling Telegram message synchronization. Manual controls below are for emergency use only.
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Status Display */}
        {syncStatus?.currentState && !isLoadingStatus && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Last Internal Sync:</span>
              <div className="text-muted-foreground">
                {syncStatus.currentState.lastSyncTime 
                  ? new Date(syncStatus.currentState.lastSyncTime).toLocaleString()
                  : 'Never'
                }
              </div>
            </div>
            <div>
              <span className="font-medium">Internal Sync Errors:</span>
              <div className="text-muted-foreground">
                {syncStatus.currentState.consecutiveErrors}
              </div>
            </div>
          </div>
        )}

        {/* Last Sync Result */}
        {lastSyncResult && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-medium text-sm mb-1">Last Manual Sync Result:</div>
            <div className="text-sm text-muted-foreground">
              {lastSyncResult.synced} synced • {lastSyncResult.cleaned} cleaned • {lastSyncResult.errors} errors
              {lastSyncResult.message && (
                <div className="mt-1 text-xs">{lastSyncResult.message}</div>
              )}
            </div>
          </div>
        )}

        {/* Manual Control Buttons - Only for Emergency Use */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Emergency Manual Controls:</div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => sync({ forceRefresh: true })}
              disabled={isSyncing}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Emergency Sync
            </Button>

            <Button
              onClick={() => sync({ includeCleanup: true })}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Sync + Cleanup
            </Button>

            {syncStatus?.currentState?.consecutiveErrors > 0 && (
              <Button
                onClick={() => resetErrors()}
                disabled={isResetting}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isResetting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Reset Errors
              </Button>
            )}

            {syncStatus?.currentState?.isRunning && (
              <Button
                onClick={() => forceStop()}
                disabled={isStopping}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                {isStopping ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Force Stop
              </Button>
            )}
          </div>
        </div>

        {/* Error Warning */}
        {syncStatus?.currentState?.consecutiveErrors >= 3 && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-700 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              Multiple internal sync failures detected. Your external Python bot should be handling Telegram synchronization.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
