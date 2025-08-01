
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserStats } from '../types';

interface UserStatsCardsProps {
  stats: UserStats | undefined;
  isLoading: boolean;
}

export function UserStatsCards({ stats, isLoading }: UserStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border border-slate-700 bg-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse bg-slate-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Free Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-400">{stats.tierBreakdown.free.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Premium Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-400">{stats.tierBreakdown.premium.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Recent Signups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">{stats.recentSignups.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  );
}
