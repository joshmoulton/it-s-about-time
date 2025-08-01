
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2 } from 'lucide-react';

interface ChatActiveInputProps {
  message: string;
  setMessage: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSend: () => void;
  selectedTopic?: string | null;
  topicName?: string | null;
  maxLength: number;
  charactersLeft: number;
  isAdmin: boolean;
  permissions: any;
  sendMessageMutation: any;
}

export function ChatActiveInput({
  message,
  setMessage,
  textareaRef,
  handleKeyDown,
  handleSend,
  selectedTopic,
  topicName,
  maxLength,
  charactersLeft,
  isAdmin,
  permissions,
  sendMessageMutation
}: ChatActiveInputProps) {
  return (
    <div className="border-t border-white/20 pt-4 space-y-3 flex-shrink-0">
      {/* Permission status */}
      {permissions?.permissions && !isAdmin && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {permissions.permissions.remainingMessages} of {permissions.permissions.dailyLimit} messages remaining today
          </span>
          {selectedTopic && topicName && (
            <Badge variant="secondary" className="text-xs">
              Sending to: {topicName}
            </Badge>
          )}
        </div>
      )}

      {/* Admin indicator */}
      {isAdmin && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            Admin Access - Unlimited Messages
          </Badge>
          {selectedTopic && topicName && (
            <Badge variant="secondary" className="text-xs">
              Sending to: {topicName}
            </Badge>
          )}
        </div>
      )}

      {/* Message input area */}
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTopic ? `Send a message to ${topicName}...` : "Send a message to the community..."}
            className="min-h-[60px] max-h-[120px] resize-none border-0 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm placeholder:text-muted-foreground/70 shadow-sm pr-12"
            maxLength={maxLength}
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending || charactersLeft < 0}
            size="sm"
            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Character count and status */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {sendMessageMutation.isPending && (
              <span className="text-blue-600 dark:text-blue-400">
                Sending...
              </span>
            )}
          </div>
          <span className={`${charactersLeft < 100 ? 'text-orange-600' : 'text-muted-foreground'}`}>
            {charactersLeft} characters left
          </span>
        </div>
      </div>

      {/* Help text */}
      <div className="text-xs text-muted-foreground text-center">
        Press Enter to send • Shift+Enter for new line
      </div>
    </div>
  );
}
