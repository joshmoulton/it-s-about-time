
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Clock, Send, Eye } from 'lucide-react';

interface NewsletterPublishingActionsProps {
  isValid: boolean;
  isPending: boolean;
  setStatus: (status: 'draft' | 'published' | 'scheduled') => void;
  handlePreview: () => void;
}

export function NewsletterPublishingActions({ 
  isValid, 
  isPending, 
  setStatus, 
  handlePreview 
}: NewsletterPublishingActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publishing Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          type="submit"
          variant="outline"
          className="w-full justify-start"
          onClick={() => setStatus('draft')}
          disabled={isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save as Draft
        </Button>

        <Button
          type="submit"
          variant="outline"
          className="w-full justify-start"
          onClick={() => setStatus('scheduled')}
          disabled={isPending || !isValid}
        >
          <Clock className="h-4 w-4 mr-2" />
          Schedule for Later
        </Button>

        <Button
          type="submit"
          className="w-full justify-start bg-brand-primary hover:bg-brand-primary/90"
          onClick={() => setStatus('published')}
          disabled={isPending || !isValid}
        >
          <Send className="h-4 w-4 mr-2" />
          Publish Now
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start"
          onClick={handlePreview}
          disabled={!isValid}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </CardContent>
    </Card>
  );
}
