
import React from 'react';
import { Crown } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  tier: string;
}

interface DashboardSidebarMenuItemProps {
  item: MenuItem;
  hasAccess: boolean;
  isActive: boolean;
  onSectionChange: (sectionId: string) => void;
}

export function DashboardSidebarMenuItem({ 
  item, 
  hasAccess, 
  isActive, 
  onSectionChange 
}: DashboardSidebarMenuItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => hasAccess && onSectionChange(item.id)}
        isActive={isActive}
        className={!hasAccess ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        tooltip={!hasAccess ? `Requires ${item.tier} subscription` : undefined}
      >
        <item.icon className="h-4 w-4" />
        <span>{item.title}</span>
        {!hasAccess && (
          <Crown className="h-3 w-3 ml-auto text-yellow-500" />
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
