
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/LazyImage';
import { Settings, Crown } from 'lucide-react';
import { TierBadge } from './navigation/TierBadge';
import { ProfileDropdown } from './navigation/ProfileDropdown';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { useTierOverride } from '@/hooks/useTierOverride';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import PremiumPricingModal from '@/components/PremiumPricingModal';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface TopNavigationProps {
  subscriber: Subscriber;
  onStartTour: () => void;
}

export function TopNavigation({ 
  subscriber, 
  onStartTour 
}: TopNavigationProps) {
  const { logout } = useEnhancedAuth();
  const { isAdmin } = useAdminStatus();
  const { currentOverride } = useTierOverride();
  const [showPricingModal, setShowPricingModal] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur border-0" style={{ backgroundColor: 'hsl(220 65% 9%)' }} data-tour="main-navigation">
      <div className="container flex h-12 sm:h-14 md:h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0">
          <LazyImage
            src="https://wrvvlmevpvcenauglcyz.supabase.co/storage/v1/object/public/assets/Property%201=Black%20(3).png" 
            alt="Weekly Wizdom" 
            className="h-5 sm:h-6 md:h-8 w-auto cursor-pointer"
            loading="eager"
            fetchPriority="high"
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIj5XVzwvdGV4dD48L3N2Zz4="
          />
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6 min-w-0" data-tour="navigation-menu">
          
          
          {/* Feedback Button - Always visible, responsive sizing */}
          <FeedbackButton 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 sm:h-9 sm:px-4 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 font-medium text-xs sm:text-sm rounded-lg shadow-sm" 
          />
          
          {/* Admin Panel Access */}
          {isAdmin && (
            <Link to="/admin" className="hidden sm:block">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-4 bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:border-orange-400/50 hover:text-orange-200 transition-all duration-200 font-medium text-sm rounded-lg shadow-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Admin</span>
              </Button>
            </Link>
          )}
          
          {/* Upgrade Button for Free Users */}
          {subscriber?.subscription_tier === 'free' && (
            <div className="hidden sm:block">
              <Button 
                size="sm" 
                onClick={() => setShowPricingModal(true)}
                className="h-9 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 font-medium text-sm rounded-lg shadow-sm transition-all duration-200"
              >
                <Crown className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Upgrade</span>
              </Button>
            </div>
          )}
          
          {/* Enhanced Tier Badge - larger and more prominent */}
          <div data-tour="subscription-tier" className="min-w-0">
            <TierBadge subscriber={subscriber} />
          </div>
          
          {/* Refined divider */}
          <div className="w-px h-5 bg-slate-600/50"></div>
          
          {/* Enhanced Profile Dropdown - larger and more prominent */}
          <div data-tour="profile-dropdown" className="min-w-0">
            <ProfileDropdown 
              subscriber={subscriber}
              onStartTour={onStartTour}
              onLogout={logout}
            />
          </div>
        </div>
      </div>
      
      {/* Pricing Modal */}
      <PremiumPricingModal 
        open={showPricingModal}
        onOpenChange={setShowPricingModal}
      />
    </header>
  );
}
