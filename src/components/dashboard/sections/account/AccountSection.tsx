import React, { useState } from 'react';
import { AccountSettingsNav, AccountTab } from './AccountSettingsNav';
import { UserProfileSection } from './UserProfileSection';
import { TelegramSettingsSection } from './TelegramSettingsSection';
import { SecuritySettingsSection } from './SecuritySettingsSection';
import { ClientSideTradingProfile } from './ClientSideTradingProfile';
import { SubscriptionManagement } from './SubscriptionManagement';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

export function AccountSection() {
  const { currentUser } = useEnhancedAuth();
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const isMobile = useIsMobile();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Account Settings</h2>
          <p className="text-muted-foreground">Please sign in to access your account settings.</p>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile':
        return <UserProfileSection />;
      case 'security':
        return <SecuritySettingsSection />;
      case 'telegram':
        return <TelegramSettingsSection />;
      case 'trading':
        return <ClientSideTradingProfile />;
      case 'subscription':
        return (
          <SubscriptionManagement subscriber={{
            id: currentUser.id,
            email: currentUser.email,
            subscription_tier: currentUser.subscription_tier,
            status: currentUser.status,
            created_at: currentUser.created_at,
            updated_at: currentUser.updated_at,
            metadata: currentUser.metadata
          }} />
        );
      default:
        return <UserProfileSection />;
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Mobile Navigation */}
        <div className="border-b border-brand-neutral-10 p-4">
          <AccountSettingsNav 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            isMobile={true}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-4">
          {renderActiveTab()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-brand-neutral-10 p-6 flex-shrink-0">
        <AccountSettingsNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        {renderActiveTab()}
      </div>
    </div>
  );
}