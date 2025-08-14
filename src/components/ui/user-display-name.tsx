import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { cn } from '@/lib/utils';

interface UserDisplayNameProps {
  className?: string;
  fallbackToEmail?: boolean;
  showLoading?: boolean;
}

export function UserDisplayName({ 
  className, 
  fallbackToEmail = true,
  showLoading = false 
}: UserDisplayNameProps) {
  const { currentUser } = useEnhancedAuth();
  const { displayName, loading } = useUserProfile();

  if (!currentUser) {
    return null;
  }

  if (loading && showLoading) {
    return (
      <span className={cn("text-muted-foreground", className)}>
        Loading...
      </span>
    );
  }

  const name = displayName || (fallbackToEmail ? currentUser.email?.split('@')[0] : null) || 'User';

  return (
    <span className={className}>
      {name}
    </span>
  );
}

interface UserAvatarTextProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function UserAvatarText({ className, size = 'md' }: UserAvatarTextProps) {
  const { initials } = useUserProfile();

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <span className={cn(sizeClasses[size], className)}>
      {initials}
    </span>
  );
}