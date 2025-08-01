
import React from 'react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { DashboardSidebarMenuItem } from './SidebarMenuItem';
import {
  MessageCircle,
  Mail,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Home,
} from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface SidebarMenuListProps {
  subscriber: Subscriber;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  {
    title: 'Overview',
    icon: Home,
    id: 'overview',
    tier: 'free',
  },
  {
    title: 'Chat Highlights',
    icon: MessageCircle,
    id: 'chat',
    tier: 'free',
  },
  {
    title: 'Newsletter',
    icon: Mail,
    id: 'newsletter',
    tier: 'free',
  },
  {
    title: 'The Edge',
    icon: BookOpen,
    id: 'edge',
    tier: 'paid',
  },
  {
    title: 'Active Alerts',
    icon: AlertTriangle,
    id: 'alerts',
    tier: 'paid',
  },
  {
    title: 'Active Trades',
    icon: TrendingUp,
    id: 'trades',
    tier: 'paid',
  },
  {
    title: 'Sentiment Tracker',
    icon: BarChart3,
    id: 'sentiment',
    tier: 'premium',
  },
];

const getTierLevel = (tier: string) => {
  const levels = { free: 0, paid: 1, premium: 2 };
  return levels[tier as keyof typeof levels] || 0;
};

export function SidebarMenuList({ subscriber, activeSection, onSectionChange }: SidebarMenuListProps) {
  const userTierLevel = getTierLevel(subscriber?.subscription_tier || 'free');

  const canAccess = (requiredTier: string) => {
    return userTierLevel >= getTierLevel(requiredTier);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            const hasAccess = canAccess(item.tier);
            return (
              <DashboardSidebarMenuItem
                key={item.id}
                item={item}
                hasAccess={hasAccess}
                isActive={activeSection === item.id}
                onSectionChange={onSectionChange}
              />
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
