
import React from 'react';
import { SidebarHeader } from '@/components/ui/sidebar';

export function AdminSidebarHeader() {
  return (
    <SidebarHeader className="p-3 border-b border-slate-800">
      <div className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/a8eaa39b-22e5-4a3c-a288-fe43b8619eab.png" 
          alt="Weekly Wizdom" 
          className="h-7 w-7 rounded-lg object-contain dark:filter-none filter brightness-0"
          onError={(e) => {
            // Fallback to original admin icon if logo fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'h-7 w-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center';
            fallback.innerHTML = '<span class="text-white font-bold text-xs">A</span>';
            target.parentNode?.appendChild(fallback);
          }}
        />
        <div>
          <span className="font-semibold text-xs text-white">Admin Panel</span>
          <p className="text-xs text-slate-400">Management Hub</p>
        </div>
      </div>
    </SidebarHeader>
  );
}
