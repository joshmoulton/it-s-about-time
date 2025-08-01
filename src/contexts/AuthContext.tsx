
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType } from '@/types/auth';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useSimpleAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const currentUser = user;

  const login = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // API-only verification through Beehiiv
      const { data, error } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
        body: { email: email.toLowerCase().trim() }
      });

      if (error || !data?.success || !data?.verified) {
        return { 
          success: false, 
          error: 'Email not found in subscriber list. Please use magic link to get started.' 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Immediately redirect to prevent any auth UI from showing
      window.location.href = '/';
      
      // Then clear auth in background (this prevents popup from showing)
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still redirect even on error
      window.location.href = '/';
    }
  };

  const value: AuthContextType = useMemo(() => ({
    subscriber: null, // No longer used - purely API-based
    currentUser,
    isLoading,
    login,
    logout,
    isAuthenticated: isAuthenticated && !isLoggingOut,
  }), [currentUser, isLoading, isAuthenticated, isLoggingOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
