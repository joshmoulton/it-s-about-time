import { useEffect } from 'react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { SessionRestorer } from './SessionRestorer';

export const SessionDetector: React.FC = () => {
  const { currentUser, refreshCurrentUser } = useEnhancedAuth();

  const handleSessionRestored = () => {
    console.log('✅ Session restored, refreshing auth state');
    // Clear the restoration state and refresh
    localStorage.removeItem('last_known_premium_email');
    window.location.reload();
  };

  // Only show the session restorer if we detect a restoration is needed
  if (currentUser?.user_type === 'needs_session_restoration') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <SessionRestorer 
          userEmail={currentUser.email}
          onSessionRestored={handleSessionRestored}
        />
      </div>
    );
  }

  return null;
};