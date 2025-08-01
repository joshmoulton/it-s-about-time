
import React from 'react';
import { ProfileDropdown } from './ProfileDropdown';

interface Subscriber {
  email: string;
  subscription_tier: 'free' | 'paid' | 'premium';
}

interface DesktopActionsProps {
  subscriber: Subscriber;
  onStartTour?: () => void;
  onLogout: () => void;
}

export function DesktopActions({ subscriber, onStartTour, onLogout }: DesktopActionsProps) {
  return (
    <ProfileDropdown 
      subscriber={subscriber}
      onStartTour={onStartTour}
      onLogout={onLogout}
    />
  );
}
