
import React, { useState } from 'react';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Send, CheckCircle } from 'lucide-react';

interface SignalPreviewProps {
  formattedOutput: string;
}

export function SignalPreview({ formattedOutput }: SignalPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <ModernCard variant="elevated" className="sticky top-6">
      <ModernCardHeader>
        <ModernCardTitle className="flex items-center justify-between">
          Signal Preview
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary">
              Ready to Share
            </Badge>
          </div>
        </ModernCardTitle>
      </ModernCardHeader>
      <ModernCardContent className="space-y-4">
        <div className="bg-muted/50 border rounded-lg p-4">
          <pre className="text-foreground text-sm whitespace-pre-wrap font-mono leading-relaxed">
            {formattedOutput}
          </pre>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleCopy}
            className="flex-1 bg-brand-primary hover:bg-brand-primary/90"
            disabled={copied}
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
          
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              // Future implementation: Post to Telegram
              console.log('Post to Telegram clicked');
            }}
          >
            <Send className="h-4 w-4 mr-2" />
            Post to Telegram
          </Button>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded border">
          <strong>Usage Tips:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Copy this formatted text to share in Telegram channels</li>
            <li>The format automatically handles conditional entries</li>
            <li>All trade details are included for compliance</li>
          </ul>
        </div>
      </ModernCardContent>
    </ModernCard>
  );
}
