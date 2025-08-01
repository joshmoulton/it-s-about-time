
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Send } from 'lucide-react';

interface NewsletterHeaderProps {
  status: 'draft' | 'published' | 'scheduled';
  onCancel: () => void;
}

export function NewsletterHeader({ status, onCancel }: NewsletterHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Newsletters
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Newsletter</h1>
          <p className="text-muted-foreground">Draft and publish your newsletter content</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={status === 'draft' ? 'secondary' : status === 'published' ? 'default' : 'outline'}>
          {status === 'draft' && <Clock className="h-3 w-3 mr-1" />}
          {status === 'published' && <Send className="h-3 w-3 mr-1" />}
          {status === 'scheduled' && <Clock className="h-3 w-3 mr-1" />}
          {status.toUpperCase()}
        </Badge>
      </div>
    </div>
  );
}
