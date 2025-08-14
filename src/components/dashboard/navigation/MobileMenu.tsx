
import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, LogOut, Crown, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
}

interface Subscriber {
  email: string;
  subscription_tier: 'free' | 'paid' | 'premium';
}

interface MobileMenuProps {
  menuItems: MenuItem[];
  activeSection: string;
  subscriber: Subscriber;
  onMenuItemClick: (itemId: string) => void;
  onStartTour?: () => void;
  onLogout: () => void;
  onCloseMobileMenu: () => void;
}

export function MobileMenu({ 
  menuItems, 
  activeSection, 
  subscriber, 
  onMenuItemClick, 
  onStartTour, 
  onLogout,
  onCloseMobileMenu 
}: MobileMenuProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAdminCheck();

  const handleMenuItemClick = (itemId: string) => {
    onMenuItemClick(itemId);
    onCloseMobileMenu();
  };

  const handleAccountClick = () => {
    navigate('/dashboard');
    onCloseMobileMenu();
  };

  const handleUpgradeClick = () => {
    navigate('/pricing');
    onCloseMobileMenu();
  };

  const handleTourClick = () => {
    if (onStartTour) {
      onStartTour();
    }
    onCloseMobileMenu();
  };

  const handleLogoutClick = () => {
    onLogout();
    onCloseMobileMenu();
  };

  return (
    <div className="flex flex-col space-y-3 p-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Main Navigation Items */}
      {menuItems.map((item) => (
        <Button
          key={item.id}
          variant={activeSection === item.id ? "default" : "ghost"}
          onClick={() => handleMenuItemClick(item.id)}
          className="flex items-center gap-3 justify-start min-h-[48px] text-left w-full rounded-xl"
          data-tour={`${item.id}-tab`}
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          <span className="truncate text-base">{item.title}</span>
        </Button>
      ))}
      
      {/* Profile Section */}
      <div className="border-t pt-4 space-y-3 mt-4">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold truncate">Profile</p>
          <p className="text-xs text-muted-foreground truncate">{subscriber?.email}</p>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={handleAccountClick}
          className="flex items-center gap-3 w-full justify-start min-h-[48px] rounded-xl"
        >
          <User className="h-5 w-5 flex-shrink-0" />
          <span className="truncate text-base">Account Settings</span>
        </Button>
        
        {isAdmin && (
          <Button 
            variant="ghost" 
            onClick={() => {
              navigate('/admin');
              onCloseMobileMenu();
            }}
            className="flex items-center gap-3 w-full justify-start min-h-[48px] rounded-xl"
          >
            <Settings className="h-5 w-5 flex-shrink-0 text-orange-400" />
            <span className="truncate text-base text-orange-400">Admin Panel</span>
          </Button>
        )}
        
        {onStartTour && (subscriber?.subscription_tier === 'paid' || subscriber?.subscription_tier === 'premium') && (
          <Button 
            variant="ghost" 
            onClick={handleTourClick}
            className="flex items-center gap-3 w-full justify-start min-h-[48px] rounded-xl"
          >
            <HelpCircle className="h-5 w-5 flex-shrink-0" />
            <span className="truncate text-base">Take Tour</span>
          </Button>
        )}
        
        {subscriber?.subscription_tier === 'free' && (
          <Button 
            onClick={handleUpgradeClick}
            className="bg-primary text-primary-foreground w-full flex items-center gap-3 min-h-[48px] rounded-xl font-medium"
            data-tour="upgrade-button"
          >
            <Crown className="h-5 w-5 flex-shrink-0" />
            <span className="truncate text-base">Upgrade</span>
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          onClick={handleLogoutClick}
          className="flex items-center gap-3 w-full justify-start min-h-[48px] rounded-xl"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="truncate text-base">Logout</span>
        </Button>
      </div>
    </div>
  );
}
