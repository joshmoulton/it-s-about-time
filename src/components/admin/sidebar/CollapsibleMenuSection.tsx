
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from './menuData';
import { LucideIcon } from 'lucide-react';

interface CollapsibleMenuSectionProps {
  title: string;
  items: MenuItem[];
  defaultExpanded?: boolean;
  icon?: LucideIcon;
}

export function CollapsibleMenuSection({ 
  title, 
  items, 
  defaultExpanded = false,
  icon: SectionIcon 
}: CollapsibleMenuSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const hasActiveItem = items.some(item => isActive(item.path));

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Live':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'New':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Enterprise':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Beta':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'AI':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <SidebarGroup className="space-y-1">
      <SidebarGroupLabel 
        className={`
          text-xs font-semibold uppercase tracking-wider px-3 py-2 mb-1 
          cursor-pointer hover:bg-slate-800/40 rounded-lg transition-all duration-200
          flex items-center justify-between group
          ${hasActiveItem ? 'text-blue-400' : 'text-slate-400 opacity-80'}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          {SectionIcon && <SectionIcon className="h-3 w-3" />}
          <span>{title}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 transition-transform" />
        ) : (
          <ChevronRight className="h-3 w-3 transition-transform" />
        )}
      </SidebarGroupLabel>

      {isExpanded && (
        <SidebarGroupContent>
          <SidebarMenu className="space-y-1">
            {items.map((item) => {
              const IconComponent = item.icon;
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.path)}
                    isActive={isActive(item.path)}
                    className={`
                      h-8 px-3 ml-2 rounded-lg text-sm font-medium transition-all duration-200 
                      hover:bg-slate-800/60 hover:backdrop-blur-sm
                      data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-600/20 data-[active=true]:to-cyan-600/20 
                      data-[active=true]:border-l-2 data-[active=true]:border-blue-500
                      data-[active=true]:text-white data-[active=true]:shadow-lg
                      text-slate-300 hover:text-white
                      group relative overflow-hidden
                      ${isActive(item.path) ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-l-2 border-blue-500' : ''}
                    `}
                  >
                    <IconComponent className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span className="truncate">{item.label}</span>
                    {isActive(item.path) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-cyan-600/5 pointer-events-none" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}
