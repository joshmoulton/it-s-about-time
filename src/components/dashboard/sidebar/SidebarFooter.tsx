
import React from 'react';
import { Button } from '@/components/ui/button';
import { SidebarFooter } from '@/components/ui/sidebar';
import { LogOut } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface DashboardSidebarFooterProps {
  subscriber: Subscriber;
  onLogout: () => void;
}

export function DashboardSidebarFooter({ subscriber, onLogout }: DashboardSidebarFooterProps) {
  return (
    <SidebarFooter className="p-4 border-t border-border/40">
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">
          <p className="truncate">{subscriber?.email}</p>
          <p>Member since {new Date(subscriber?.created_at || '').toLocaleDateString()}</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLogout}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </SidebarFooter>
  );
}
