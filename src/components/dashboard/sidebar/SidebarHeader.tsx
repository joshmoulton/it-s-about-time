
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { SidebarHeader } from '@/components/ui/sidebar';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface DashboardSidebarHeaderProps {
  subscriber: Subscriber;
}

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'premium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'paid': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  }
};

export function DashboardSidebarHeader({ subscriber }: DashboardSidebarHeaderProps) {
  return (
    <SidebarHeader className="p-4 border-b border-border/40">
      <div className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/a8eaa39b-22e5-4a3c-a288-fe43b8619eab.png" 
          alt="Weekly Wizdom" 
          className="h-6 w-auto dark:filter-none filter brightness-0"
          onError={(e) => {
            // Fallback to crown icon and text if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallbackContainer = document.createElement('div');
            fallbackContainer.className = 'flex items-center gap-2';
            fallbackContainer.innerHTML = '<svg class="h-6 w-6 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 6L9 9l3-8 3 8-3-3zM9 9l-7 3 7-3zM15 9l7 3-7-3zM9 9l3 8 3-8H9z"/></svg><span class="font-bold text-lg">Weekly Wizdom</span>';
            target.parentNode?.appendChild(fallbackContainer);
          }}
        />
      </div>
      <div className="mt-2">
        <Badge className={getTierColor(subscriber?.subscription_tier || 'free')}>
          {subscriber?.subscription_tier === 'premium' && <Crown className="h-3 w-3 mr-1" />}
          <span className="capitalize">{subscriber?.subscription_tier} Member</span>
        </Badge>
      </div>
    </SidebarHeader>
  );
}
