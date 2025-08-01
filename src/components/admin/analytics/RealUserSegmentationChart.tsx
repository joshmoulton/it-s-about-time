
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  Tooltip
} from 'recharts';
import { Users } from 'lucide-react';
import { useOptimizedAdminStats } from '@/hooks/useOptimizedAdminStats';

export function RealUserSegmentationChart() {
  const { data: stats, isLoading } = useOptimizedAdminStats();

  const segmentationData = [
    { 
      name: 'Free Tier', 
      value: stats?.usersByTier?.free || 0, 
      color: '#64748b',
      percentage: stats?.totalUsers ? ((stats.usersByTier?.free || 0) / stats.totalUsers * 100).toFixed(1) : '0.0'
    },
    { 
      name: 'Paid Tier', 
      value: stats?.usersByTier?.paid || 0, 
      color: '#3b82f6',
      percentage: stats?.totalUsers ? ((stats.usersByTier?.paid || 0) / stats.totalUsers * 100).toFixed(1) : '0.0'
    },
    { 
      name: 'Premium Tier', 
      value: stats?.usersByTier?.premium || 0, 
      color: '#8b5cf6',
      percentage: stats?.totalUsers ? ((stats.usersByTier?.premium || 0) / stats.totalUsers * 100).toFixed(1) : '0.0'
    }
  ];

  const totalUsers = stats?.totalUsers || 0;
  const payingUsers = (stats?.usersByTier?.paid || 0) + (stats?.usersByTier?.premium || 0);
  const payingPercentage = totalUsers > 0 ? ((payingUsers / totalUsers) * 100).toFixed(1) : '0.0';

  if (isLoading) {
    return (
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="animate-pulse text-slate-400">Loading user data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="h-5 w-5 text-blue-400" />
          User Segmentation
        </CardTitle>
        <CardDescription className="text-slate-400">
          Distribution of users across subscription tiers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Pie Chart */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={segmentationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {segmentationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [
                    `${value.toLocaleString()} users`,
                    name
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend and Stats */}
          <div className="flex-1 space-y-4">
            {segmentationData.map((segment, index) => (
              <div key={segment.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-white font-medium">{segment.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{segment.value.toLocaleString()}</div>
                  <div className="text-slate-400 text-sm">{segment.percentage}%</div>
                </div>
              </div>
            ))}
            
            {/* Summary Stats */}
            <div className="border-t border-slate-600 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Users:</span>
                <span className="font-bold text-white">{totalUsers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Paying Customers:</span>
                <span className="font-bold text-green-400">{payingPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
