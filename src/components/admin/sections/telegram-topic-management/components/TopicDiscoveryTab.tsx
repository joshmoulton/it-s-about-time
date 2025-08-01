
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TopicDiscoveryTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Topic Discovery</CardTitle>
        <CardDescription>
          View automatically discovered topics and their confidence scores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Topic discovery data will appear here after enhanced sync operations
        </div>
      </CardContent>
    </Card>
  );
}
