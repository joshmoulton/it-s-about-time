
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface UpgradeSectionProps {
  subscriber: Subscriber;
}

export function UpgradeSection({ subscriber }: UpgradeSectionProps) {
  const navigate = useNavigate();
  const { currentUser } = useEnhancedAuth();

  // Hide upgrade section if user has premium access via WHOP or is premium subscriber
  if (subscriber?.subscription_tier !== 'free' || currentUser?.subscription_tier === 'premium') {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Upgrade</SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="p-3 bg-primary/5 rounded-lg mx-2">
          <p className="text-sm text-muted-foreground mb-2">
            Get premium access via WHOP
          </p>
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => navigate('/pricing')}
          >
            Upgrade Now
          </Button>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
