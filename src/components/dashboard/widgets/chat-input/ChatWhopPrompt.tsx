
import React from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { WhopConnectButton } from '../WhopConnectButton';

interface ChatWhopPromptProps {
  onWhopConnected: () => void;
}

export function ChatWhopPrompt({ onWhopConnected }: ChatWhopPromptProps) {
  return (
    <div className="border-t border-white/20 pt-4 space-y-3 flex-shrink-0">
      <div className="flex gap-3">
        <input 
          type="text" 
          placeholder="Connect your Whop account to send messages..." 
          className="flex-1 px-4 py-3 text-sm border-0 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm placeholder:text-muted-foreground/70 min-w-0 shadow-sm" 
          disabled 
        />
        <Button 
          size="sm" 
          disabled 
          className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <WhopConnectButton onConnected={onWhopConnected} />
      <div className="text-xs text-muted-foreground text-center">
        Verify your Whop purchase to access the community chat
      </div>
    </div>
  );
}
