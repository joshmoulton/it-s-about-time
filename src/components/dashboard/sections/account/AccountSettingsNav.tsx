import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Shield, MessageSquare, TrendingUp, CreditCard, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

export type AccountTab = 'profile' | 'security' | 'telegram' | 'trading' | 'subscription';

interface AccountSettingsNavProps {
  activeTab: AccountTab;
  onTabChange: (tab: AccountTab) => void;
  isMobile?: boolean;
}

export function AccountSettingsNav({ activeTab, onTabChange, isMobile = false }: AccountSettingsNavProps) {
  const navigate = useNavigate();
  const { currentUser } = useEnhancedAuth();

  // Filter tabs based on user tier
  const isPremiumUser = currentUser?.subscription_tier === 'premium' || currentUser?.subscription_tier === 'paid';
  
  const allTabs = [
    { id: 'profile' as AccountTab, label: 'Profile', icon: User },
    { id: 'security' as AccountTab, label: 'Security', icon: Shield },
    { id: 'telegram' as AccountTab, label: 'Telegram', icon: MessageSquare },
    { id: 'trading' as AccountTab, label: 'Trading Profile', icon: TrendingUp },
    { id: 'subscription' as AccountTab, label: 'Subscription', icon: CreditCard },
  ];

  // Free users only see profile and subscription tabs
  const tabs = isPremiumUser ? allTabs : allTabs.filter(tab => 
    tab.id === 'profile' || tab.id === 'subscription'
  );

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border rounded-lg p-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-1 text-foreground">Account Settings</h2>
          <p className="text-muted-foreground text-sm">
            Manage your profile, security settings, and preferences
          </p>
        </div>

        {/* Mobile horizontal scrollable tabs */}
        <nav className="flex overflow-x-auto gap-2 pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "secondary" : "outline"}
              size="sm"
              className={`flex items-center gap-2 whitespace-nowrap flex-shrink-0 border ${
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary" 
                  : "text-foreground hover:bg-muted border-border"
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">Account Settings</h2>
        <p className="text-muted-foreground mb-6">
          Manage your profile, security settings, and preferences
        </p>
      </div>

      <nav className="flex flex-col space-y-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "outline"}
            className={`justify-start gap-3 h-11 border ${
              activeTab === tab.id 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary" 
                : "text-foreground hover:bg-muted border-border"
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </nav>
    </div>
  );
}