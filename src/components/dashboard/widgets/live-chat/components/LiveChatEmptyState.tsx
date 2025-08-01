
import React from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveChatEmptyStateProps {
  showTopicFeatures: boolean;
  subscriber: any;
}

export function LiveChatEmptyState({
  showTopicFeatures,
  subscriber
}: LiveChatEmptyStateProps) {
  console.log('📭 LiveChatEmptyState render:', {
    showTopicFeatures,
    subscriber: !!subscriber
  });

  return (
    <div className="text-center py-12 space-y-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
        <MessageCircle className="w-8 h-8 text-gray-400" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">
          No Messages Yet
        </h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Connect to Telegram to start receiving live chat messages from your community.
        </p>
      </div>

      {showTopicFeatures && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
            <Users className="w-4 h-4" />
            <span>Topic-based chat available</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // This would trigger a sync or connection attempt
              console.log('🔄 Manual sync triggered from empty state');
            }}
          >
            Refresh Messages
          </Button>
        </div>
      )}

      {!subscriber && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Upgrade your subscription to access live chat features
          </p>
        </div>
      )}
    </div>
  );
}
