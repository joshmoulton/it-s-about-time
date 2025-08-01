
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Loader2, CheckCircle, AlertTriangle, Clock, Square } from 'lucide-react';

interface SyncStatusTabProps {
  syncStatus: any[];
  syncStatusLoading: boolean;
  onStopSync: () => void;
  isStopping: boolean;
}

export function SyncStatusTab({ syncStatus, syncStatusLoading, onStopSync, isStopping }: SyncStatusTabProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Sync Status
        </CardTitle>
        <CardDescription>
          Monitor synchronization status and history
        </CardDescription>
      </CardHeader>
      <CardContent>
        {syncStatusLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : syncStatus && syncStatus.length > 0 ? (
          <div className="space-y-4">
            {syncStatus.map((status) => (
              <div key={status.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{status.sync_type} Sync</span>
                        <Badge variant={status.status === 'completed' ? 'default' : status.status === 'failed' ? 'destructive' : 'secondary'}>
                          {status.status}
                        </Badge>
                        {status.status === 'running' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onStopSync}
                            disabled={isStopping}
                            className="ml-2 h-6 px-2 text-xs"
                          >
                            {isStopping ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Square className="h-3 w-3" />
                            )}
                            {isStopping ? 'Stopping...' : 'Stop'}
                          </Button>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDateTime(status.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div>Processed: {status.messages_processed}</div>
                    <div>Synced: {status.messages_synced}</div>
                    <div>Deleted: {status.messages_deleted}</div>
                    {status.errors_count > 0 && (
                      <div className="text-red-500">Errors: {status.errors_count}</div>
                    )}
                  </div>
                </div>
                {status.metadata && Object.keys(status.metadata).length > 0 && (
                  <div className="mt-3 p-2 bg-muted rounded text-xs">
                    <pre>{JSON.stringify(status.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No sync status records found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
