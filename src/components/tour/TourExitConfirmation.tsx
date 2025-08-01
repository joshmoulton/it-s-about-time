import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { X, Clock, Ban } from 'lucide-react';

interface TourExitConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onNeverShowAgain: () => void;
  onShowLater: () => void;
}

export function TourExitConfirmation({
  isOpen,
  onClose,
  onNeverShowAgain,
  onShowLater,
}: TourExitConfirmationProps) {
  console.log('🔍 TourExitConfirmation render - isOpen:', isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardHeader className="relative pb-3">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted/60 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          
          <CardTitle className="text-lg font-semibold text-center pr-6">
            Skip Tour?
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Would you like to see this tour again next time you visit?
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={onShowLater}
              variant="outline"
              className="w-full justify-start gap-3 h-12"
            >
              <Clock className="h-4 w-4 text-primary" />
              <div className="text-left">
                <div className="font-medium">Show Again Later</div>
                <div className="text-xs text-muted-foreground">I'll see the tour next time</div>
              </div>
            </Button>
            
            <Button
              onClick={onNeverShowAgain}
              variant="outline"
              className="w-full justify-start gap-3 h-12"
            >
              <Ban className="h-4 w-4 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">Never Show Again</div>
                <div className="text-xs text-muted-foreground">Don't show this tour anymore</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}