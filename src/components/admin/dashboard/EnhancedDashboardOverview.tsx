
import React from 'react';
import { useOptimizedDashboardStats } from '@/hooks/admin-stats/useOptimizedDashboardStats';
import { ContentStatsGrid } from './ContentStatsGrid';
import { QuickActions } from './QuickActions';
import { SystemHealthMonitor } from './SystemHealthMonitor';

interface EnhancedDashboardOverviewProps {
  adminUser: any;
}

export function EnhancedDashboardOverview({ adminUser }: EnhancedDashboardOverviewProps) {
  const { data: dashboardStats, isLoading } = useOptimizedDashboardStats();

  return (
    <div className="h-full w-full bg-slate-900">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">
          Welcome back, {adminUser?.beehiiv_subscribers?.email || 'Admin'}
        </p>
      </div>

      <div className="p-6 space-y-8">
        {isLoading ? (
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-800 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-slate-800 rounded-lg"></div>
            <div className="h-48 bg-slate-800 rounded-lg"></div>
          </div>
        ) : (
          <>
            {/* Content Stats Grid */}
            <ContentStatsGrid contentStats={dashboardStats?.content} />

            {/* Dashboard Preview */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Dashboard Preview</h2>
              <div className="flex justify-center">
                <img 
                  src="/lovable-uploads/1111680c-61ee-4c20-9f7e-903098860400.png" 
                  alt="Dashboard Interface Preview"
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <QuickActions />

            {/* System Health Monitor */}
            <SystemHealthMonitor syncJobs={dashboardStats?.syncJobs} />
          </>
        )}
      </div>
    </div>
  );
}
