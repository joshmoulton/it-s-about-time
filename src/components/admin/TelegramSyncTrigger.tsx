import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function TelegramSyncTrigger() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerSync = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚀 Triggering manual Telegram sync...');
      
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'enhanced_sync',
          force_refresh: true,
          batch_size: 50,
          include_cleanup: true
        }
      });

      if (error) {
        console.error('❌ Sync error:', error);
        setError(error.message || 'Sync failed');
      } else {
        console.log('✅ Sync result:', data);
        setResult(data);
      }
    } catch (err: any) {
      console.error('❌ Sync exception:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Telegram Message Sync
        </CardTitle>
        <CardDescription>
          Manually trigger sync to fetch latest messages from @newsletteralertbot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={triggerSync} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Sync Now
            </>
          )}
        </Button>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {result && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-green-700 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            <div className="text-sm">
              <div>Sync completed!</div>
              <div>Messages synced: {result.synced || 0}</div>
              <div>Messages cleaned: {result.cleaned || 0}</div>
              {result.message && <div>Status: {result.message}</div>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}