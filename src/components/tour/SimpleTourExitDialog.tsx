import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SimpleTourExitDialogProps {
  isOpen: boolean;
  onNeverShowAgain: () => void;
  onShowLater: () => void;
}

export function SimpleTourExitDialog({ 
  isOpen, 
  onNeverShowAgain, 
  onShowLater 
}: SimpleTourExitDialogProps) {
  console.log('🎭 SimpleTourExitDialog rendered, isOpen:', isOpen);

  const handleNeverShowAgain = () => {
    console.log('🚫 User clicked "Never Show Again" - disabling tours permanently');
    onNeverShowAgain();
  };

  const handleShowLater = () => {
    console.log('⏰ User clicked "Show Again Later" - keeping tours enabled');
    onShowLater();
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-md z-[10001] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border border-border shadow-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-foreground">Tutorial Preferences</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            Would you like to see this tutorial again next time, or disable it completely?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 pt-4">
          <AlertDialogCancel 
            onClick={handleShowLater}
            className="flex-1 bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
          >
            Show Again Later
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleNeverShowAgain}
            className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            Never Show Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}