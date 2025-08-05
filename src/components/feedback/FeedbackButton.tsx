import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface FeedbackButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function FeedbackButton({ variant = 'outline', size = 'sm', className }: FeedbackButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => window.open('https://forms.gle/NiHXZYuN4LrazJBF9', '_blank')}
      className={className}
      data-tour="feedback-button"
    >
      <MessageSquare className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">Feedback</span>
    </Button>
  );
}