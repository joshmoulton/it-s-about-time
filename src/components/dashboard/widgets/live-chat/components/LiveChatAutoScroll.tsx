
import { useEffect, useRef } from 'react';

interface LiveChatAutoScrollProps {
  messages: any[];
  lastMessageCount: number;
  setLastMessageCount: (count: number) => void;
  autoScrollEnabled: boolean;
}

export function LiveChatAutoScroll({ 
  messages, 
  lastMessageCount, 
  setLastMessageCount, 
  autoScrollEnabled 
}: LiveChatAutoScrollProps) {
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find the scrollable container
    const findScrollContainer = () => {
      const containers = document.querySelectorAll('[data-chat-messages]');
      return containers[0] as HTMLElement;
    };

    if (messages && messages.length !== lastMessageCount) {
      setLastMessageCount(messages.length);
      
      if (autoScrollEnabled) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          const container = findScrollContainer();
          if (container) {
            container.scrollTop = container.scrollHeight;
            console.log('📜 Auto-scrolled to bottom:', messages.length, 'messages');
          }
        }, 100);
      }
    }
  }, [messages, lastMessageCount, setLastMessageCount, autoScrollEnabled]);

  return null;
}
