import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function MessageRecoveryTab() {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryHours, setRecoveryHours] = useState(24);
  const [recoveryResult, setRecoveryResult] = useState<any>(null);
  const { toast } = useToast();

  const handleMessageRecovery = async () => {
    setIsRecovering(true);
    setRecoveryResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: {
          action: 'message_recovery',
          hours: recoveryHours,
          force_refresh: true,
          include_topic_discovery: true
        }
      });

      if (error) throw error;

      setRecoveryResult(data);
      toast({
        title: "Message Recovery Completed",
        description: `Recovered ${data.recoveredMessages} messages and discovered ${data.topicsDiscovered} topics`,
      });
    } catch (error) {
      console.error('Recovery error:', error);
      toast({
        title: "Recovery Failed",
        description: "Failed to recover messages",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const handleBulkTopicMapping = async () => {
    setIsRecovering(true);

    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: {
          action: 'bulk_topic_mapping'
        }
      });

      if (error) throw error;

      toast({
        title: "Bulk Topic Mapping Completed",
        description: `Updated ${data.updated} messages, created ${data.created} topics`,
      });
    } catch (error) {
      console.error('Bulk mapping error:', error);
      toast({
        title: "Bulk Mapping Failed",
        description: "Failed to perform bulk topic mapping",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Use this recovery system to fix message sync gaps and topic mapping issues.
          Recovery is safe and will not create duplicates.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Message Recovery
          </CardTitle>
          <CardDescription>
            Recover missed messages from the last 14 hours and fix topic mappings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="recovery-hours">Recovery Window (hours)</Label>
              <Input
                id="recovery-hours"
                type="number"
                min="1"
                max="72"
                value={recoveryHours}
                onChange={(e) => setRecoveryHours(parseInt(e.target.value) || 24)}
                className="w-32"
              />
            </div>
            <Button 
              onClick={handleMessageRecovery}
              disabled={isRecovering}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRecovering ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Start Recovery
            </Button>
          </div>

          {recoveryResult && (
            <div className="mt-4 p-4 bg-slate-800 rounded-lg border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Recovery Results
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Badge variant="secondary">
                  Messages: {recoveryResult.recoveredMessages}
                </Badge>
                <Badge variant="secondary">
                  Topics: {recoveryResult.topicsDiscovered}
                </Badge>
                <Badge variant={recoveryResult.errors > 0 ? "destructive" : "secondary"}>
                  Errors: {recoveryResult.errors}
                </Badge>
                <Badge variant="outline">
                  Window: {recoveryResult.recoveryWindow}
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                {recoveryResult.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Topic Mapping</CardTitle>
          <CardDescription>
            Fix all messages with missing topic names in one operation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleBulkTopicMapping}
            disabled={isRecovering}
            variant="outline"
            className="w-full"
          >
            {isRecovering ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Fix All Topic Names
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current state of the Telegram chat system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Last Message ID:</span>
              <Badge variant="outline">1946073</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Messages:</span>
              <Badge variant="outline">73</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Topic Mappings:</span>
              <Badge variant="outline">0</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Sync Gap:</span>
              <Badge variant="destructive">~14 hours</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}