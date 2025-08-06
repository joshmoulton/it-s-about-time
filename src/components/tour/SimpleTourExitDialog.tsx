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

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-md z-[10001] fixed">
        <AlertDialogHeader>
          <AlertDialogTitle>Tutorial Preferences</AlertDialogTitle>
          <AlertDialogDescription>
            Would you like to see this tutorial again next time, or disable it completely?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel 
            onClick={onShowLater}
            className="flex-1 bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
          >
            Show Again Later
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onNeverShowAgain}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            Never Show Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}