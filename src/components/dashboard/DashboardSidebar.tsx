
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
} from '@/components/ui/sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DashboardSidebarHeader,
  SidebarMenuList,
  UpgradeSection,
  DashboardSidebarFooter,
} from './sidebar';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface DashboardSidebarProps {
  subscriber: Subscriber;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function DashboardSidebar({ subscriber, activeSection = 'overview', onSectionChange }: DashboardSidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleSectionChange = (sectionId: string) => {
    onSectionChange?.(sectionId);
  };

  return (
    <Sidebar className="border-r border-border/40">
      <DashboardSidebarHeader subscriber={subscriber} />

      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarMenuList 
          subscriber={subscriber}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        <UpgradeSection subscriber={subscriber} />
      </SidebarContent>

      <DashboardSidebarFooter 
        subscriber={subscriber}
        onLogout={handleLogout}
      />
    </Sidebar>
  );
}
