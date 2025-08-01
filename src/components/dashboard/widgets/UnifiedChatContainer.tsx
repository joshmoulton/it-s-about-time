
import React from 'react';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, RefreshCw } from 'lucide-react';
import { UnifiedChatWidget } from './UnifiedChatWidget';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface UnifiedChatContainerProps {
  subscriber: Subscriber;
  hideHeader?: boolean;
}

export function UnifiedChatContainer({ subscriber, hideHeader = false }: UnifiedChatContainerProps) {
  return (
    <ModernCard className="h-full flex flex-col bg-gradient-to-br from-indigo-900/20 via-blue-900/10 to-slate-800/50 border-indigo-500/20 hover:border-indigo-400/30 transition-all duration-200" interactive data-tour="live-chat">
      {!hideHeader && (
        <ModernCardHeader className="pb-2 pt-3 flex-shrink-0 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <ModernCardTitle className="text-sm text-white">Community Chat</ModernCardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white font-medium">Join the conversation</span>
              <Button 
                size="sm" 
                asChild
                className="h-8 px-4 text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                <a href="https://whop.com/weeklywizdom/telegram-DnUOfaebgphZtq/app/" target="_blank" rel="noopener noreferrer">
                  Join Telegram
                </a>
              </Button>
            </div>
          </div>
        </ModernCardHeader>
      )}
      
      <ModernCardContent className={`flex-1 flex flex-col ${hideHeader ? 'pt-0' : 'pt-0'} px-4 pb-4`}>
        <div className="flex-1 overflow-hidden">
          <UnifiedChatWidget 
            subscriber={subscriber}
            isExpanded={false}
            onToggleExpanded={undefined}
          />
        </div>
      </ModernCardContent>
    </ModernCard>
  );
}
