import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface BulkUpdateResult {
  message: string;
  total_videos: number;
  successful_updates: number;
  errors: number;
  updates: Array<{
    id: string;
    title: string;
    thumbnail_url: string;
  }>;
}

export function BulkThumbnailUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<BulkUpdateResult | null>(null);
  const { toast } = useToast();

  const handleBulkUpdate = async () => {
    setIsUpdating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('bulk-update-thumbnails');
      
      if (error) {
        throw error;
      }

      setResult(data);
      
      if (data.successful_updates > 0) {
        toast({
          title: "Thumbnails updated successfully!",
          description: `Updated ${data.successful_updates} out of ${data.total_videos} videos`
        });
      } else {
        toast({
          title: "No updates needed",
          description: "All videos already have thumbnails or no Vimeo videos found",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update thumbnails",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Bulk Thumbnail Update
        </CardTitle>
        <CardDescription>
          Update thumbnails for all videos that don't have them yet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleBulkUpdate}
          disabled={isUpdating}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Updating Thumbnails...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Update All Missing Thumbnails
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4">
            <Alert className={result.successful_updates > 0 ? "border-green-500" : "border-yellow-500"}>
              {result.successful_updates > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <AlertDescription>
                <strong>{result.message}</strong>
                <br />
                Total videos processed: {result.total_videos}
                <br />
                Successful updates: {result.successful_updates}
                <br />
                Errors: {result.errors}
              </AlertDescription>
            </Alert>

            {result.updates && result.updates.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Updated Videos:</h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.updates.map((update, index) => (
                    <div key={update.id} className="text-sm p-2 bg-muted rounded">
                      <div className="font-medium">{update.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {update.thumbnail_url}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}