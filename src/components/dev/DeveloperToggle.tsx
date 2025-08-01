import React, { useState, useEffect } from 'react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { Button } from '@/components/ui/button';
import { Crown, UserX } from 'lucide-react';

// Development context for tier override
export const DeveloperContext = React.createContext<{
  overrideTier: 'free' | 'premium' | null;
  setOverrideTier: (tier: 'free' | 'premium' | null) => void;
}>({
  overrideTier: null,
  setOverrideTier: () => {}
});

export const DeveloperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [overrideTier, setOverrideTier] = useState<'free' | 'premium' | null>(null);

  return (
    <DeveloperContext.Provider value={{ overrideTier, setOverrideTier }}>
      {children}
    </DeveloperContext.Provider>
  );
};

export const useDeveloperOverride = () => {
  const context = React.useContext(DeveloperContext);
  if (!context) {
    throw new Error('useDeveloperOverride must be used within a DeveloperProvider');
  }
  return context;
};

export function DeveloperToggle() {
  const { currentUser } = useEnhancedAuth();
  const { overrideTier, setOverrideTier } = useDeveloperOverride();
  const [isVisible, setIsVisible] = useState(false);

  // Only show for admin users
  const isAdmin = currentUser?.user_type === 'supabase_admin' || 
                  currentUser?.user_type === 'whop_admin' ||
                  currentUser?.email === 'pidgeon@avium.trade';

  console.log('🔍 DeveloperToggle: Checking visibility', {
    currentUser: currentUser?.email,
    userType: currentUser?.user_type,
    isAdmin,
    overrideTier
  });

  useEffect(() => {
    setIsVisible(isAdmin);
  }, [isAdmin]);

  if (!isVisible) return null;

  const handleToggle = () => {
    console.log('🔄 Developer Toggle clicked, current override:', overrideTier);
    if (overrideTier === null) {
      console.log('🔄 Setting override to FREE');
      setOverrideTier('free');
    } else if (overrideTier === 'free') {
      console.log('🔄 Setting override to PREMIUM');
      setOverrideTier('premium');
    } else {
      console.log('🔄 Clearing override (Normal view)');
      setOverrideTier(null);
    }
  };

  const getButtonConfig = () => {
    switch (overrideTier) {
      case 'free':
        return {
          icon: UserX,
          text: 'Free View',
          className: 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
        };
      case 'premium':
        return {
          icon: Crown,
          text: 'Premium View',
          className: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30'
        };
      default:
        return {
          icon: Crown,
          text: 'Normal View',
          className: 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
        };
    }
  };

  const config = getButtonConfig();
  const Icon = config.icon;

  return null;
}