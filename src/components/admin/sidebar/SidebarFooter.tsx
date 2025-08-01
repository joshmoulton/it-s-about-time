
import React from 'react';
import { SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminUser {
  id: string;
  role: string;
  permissions: any;
  is_active: boolean;
  beehiiv_subscribers?: {
    email: string;
  };
}

interface AdminSidebarFooterProps {
  adminUser: AdminUser;
}

export function AdminSidebarFooter({ adminUser }: AdminSidebarFooterProps) {
  const navigate = useNavigate();

  return (
    <SidebarFooter className="p-3 border-t border-slate-800">
      <div className="space-y-3">
        {/* Back to Dashboard Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="w-full bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Admin User Info */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {adminUser?.beehiiv_subscribers?.email || 'Admin User'}
            </p>
            <p className="text-xs text-slate-400 capitalize">
              {adminUser?.role || 'Administrator'}
            </p>
          </div>
        </div>
      </div>
    </SidebarFooter>
  );
}
