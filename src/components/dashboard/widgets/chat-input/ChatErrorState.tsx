
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, MessageSquare } from 'lucide-react';

interface ChatErrorStateProps {
  error?: string;
}

export function ChatErrorState({ error }: ChatErrorStateProps) {
  return (
    <div className="border-t border-white/20 pt-4 space-y-3 flex-shrink-0">
      <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-700 dark:text-red-300">
          {error || 'You do not have permission to send messages'}
        </span>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="text-sm w-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl font-medium h-10"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Join Telegram Community
      </Button>
    </div>
  );
}
