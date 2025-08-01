
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Download, History, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BackupRecord {
  id: string;
  backup_type: string;
  status: string;
  file_size_mb: number | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export function DatabaseBackupSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  // Fetch backup history
  const { data: backupHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['backup-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as BackupRecord[];
    },
    enabled: showHistory,
  });

  // Manual backup mutation
  const backupMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('database-backup', {
        body: { type: 'manual' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Backup Started",
        description: "Manual database backup has been initiated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['backup-history'] });
    },
    onError: (error) => {
      console.error('Backup error:', error);
      toast({
        title: "Backup Failed",
        description: "Failed to start manual backup. Please try again.",
        variant: "destructive",
      });
    }
  });

  const runBackup = () => {
    backupMutation.mutate();
  };

  const formatFileSize = (sizeInMB: number | null) => {
    if (!sizeInMB) return 'N/A';
    if (sizeInMB < 1) return `${(sizeInMB * 1024).toFixed(0)} KB`;
    if (sizeInMB < 1024) return `${sizeInMB.toFixed(1)} MB`;
    return `${(sizeInMB / 1024).toFixed(1)} GB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database & Backup
        </CardTitle>
        <CardDescription>Database maintenance and backup settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">Database Status</div>
            <div className="text-sm text-muted-foreground">All systems operational</div>
          </div>
          <Badge className="bg-green-500 text-white">Healthy</Badge>
        </div>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">Last Backup</div>
            <div className="text-sm text-muted-foreground">Automated daily backups enabled</div>
          </div>
          <Badge className="bg-blue-500 text-white">Today 03:00 AM</Badge>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={runBackup}
            disabled={backupMutation.isPending}
          >
            {backupMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Run Manual Backup
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4 mr-2" />
            {showHistory ? 'Hide' : 'View'} Backup History
          </Button>
        </div>

        {showHistory && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Recent Backups</h4>
            {historyLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : backupHistory && backupHistory.length > 0 ? (
              <div className="space-y-2">
                {backupHistory.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium capitalize">{backup.backup_type} Backup</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(backup.created_at)}
                        {backup.file_size_mb && ` • ${formatFileSize(backup.file_size_mb)}`}
                      </div>
                      {backup.error_message && (
                        <div className="text-sm text-red-600 mt-1">{backup.error_message}</div>
                      )}
                    </div>
                    <Badge 
                      variant={backup.status === 'completed' ? 'default' : backup.status === 'failed' ? 'destructive' : 'secondary'}
                    >
                      {backup.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No backup history available
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
