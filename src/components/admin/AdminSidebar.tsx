
import React from 'react';
import {
  Sidebar,
  SidebarContent,
} from '@/components/ui/sidebar';
import { AdminSidebarHeader } from './sidebar/SidebarHeader';
import { AdminSidebarFooter } from './sidebar/SidebarFooter';
import { CollapsibleMenuSection } from './sidebar/CollapsibleMenuSection';
import { getMenuItemsBySection } from './sidebar/menuData';
import { 
  BarChart3, 
  FileText, 
  Search, 
  Activity, 
  DollarSign, 
  Zap, 
  Bot, 
  Shield,
  Brain,
  MessageCircle,
  TrendingUp
} from 'lucide-react';

interface AdminUser {
  id: string;
  role: string;
  permissions: any;
  is_active: boolean;
}

interface AdminSidebarProps {
  adminUser: AdminUser;
}

export function AdminSidebar({ adminUser }: AdminSidebarProps) {
  const isAnalyst = adminUser.role === 'analyst';
  
  if (isAnalyst) {
    // Analyst-specific sidebar with limited access
    const analystMainItems = getMenuItemsBySection('analyst_main');
    const analystSignalsItems = getMenuItemsBySection('analyst_signals');
    
    return (
      <Sidebar className="border-r border-border/10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white w-64">
        <AdminSidebarHeader />

        <SidebarContent className="px-3 py-4 space-y-2 overflow-y-auto">
          <CollapsibleMenuSection 
            title="Dashboard" 
            items={analystMainItems} 
            defaultExpanded={true}
            icon={BarChart3}
          />
          
          <CollapsibleMenuSection 
            title="Trading Signals" 
            items={analystSignalsItems} 
            defaultExpanded={true}
            icon={TrendingUp}
          />
        </SidebarContent>

        <AdminSidebarFooter adminUser={adminUser} />
      </Sidebar>
    );
  }

  // Full admin sidebar
  const mainItems = getMenuItemsBySection('main');
  const contentItems = getMenuItemsBySection('content');
  const operationsItems = getMenuItemsBySection('operations');
  const aiSentimentItems = getMenuItemsBySection('ai_sentiment');
  const chatHighlightsItems = getMenuItemsBySection('chat_highlights');
  const integrationItems = getMenuItemsBySection('integrations');
  const systemItems = getMenuItemsBySection('system');

  return (
    <Sidebar className="border-r border-border/10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white w-64">
      <AdminSidebarHeader />

      <SidebarContent className="px-3 py-4 space-y-2 overflow-y-auto">
        <CollapsibleMenuSection 
          title="Dashboard" 
          items={mainItems} 
          defaultExpanded={true}
          icon={BarChart3}
        />
        
        <CollapsibleMenuSection 
          title="Content" 
          items={contentItems} 
          icon={FileText}
        />
        
        <CollapsibleMenuSection 
          title="Operations" 
          items={operationsItems} 
          icon={Activity}
        />
        
        <CollapsibleMenuSection 
          title="AI Sentiment Analysis" 
          items={aiSentimentItems} 
          icon={Brain}
        />
        
        <CollapsibleMenuSection 
          title="Chat Highlights" 
          items={chatHighlightsItems} 
          icon={MessageCircle}
        />
        
        <CollapsibleMenuSection 
          title="Integrations" 
          items={integrationItems} 
          icon={Zap}
        />
        
        {adminUser.role === 'super_admin' && (
          <CollapsibleMenuSection 
            title="System" 
            items={systemItems} 
            icon={Shield}
          />
        )}
      </SidebarContent>

      <AdminSidebarFooter adminUser={adminUser} />
    </Sidebar>
  );
}
