
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Send, Zap } from 'lucide-react';

export function ChatUpgradePrompt() {
  const navigate = useNavigate();
  return (
    <div className="border-t border-white/20 pt-4 space-y-3 flex-shrink-0">
      <div className="flex gap-3">
        <input 
          type="text" 
          placeholder="Premium subscription required to send messages..." 
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
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => navigate('/pricing?open=1')}
        className="text-sm w-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl font-medium h-10"
      >
        <Zap className="h-4 w-4 mr-2" />
        Upgrade to Premium to Send Messages
      </Button>
    </div>
  );
}
