
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { Users } from 'lucide-react';

const segmentationData = [
  { name: 'Free Tier', value: 7845, percentage: 68.2, color: '#94a3b8' },
  { name: 'Paid Tier', value: 2890, percentage: 25.1, color: '#3b82f6' },
  { name: 'Premium Tier', value: 775, percentage: 6.7, color: '#8b5cf6' },
];

const COLORS = ['#94a3b8', '#3b82f6', '#8b5cf6'];

export function UserSegmentationChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          User Segmentation
        </CardTitle>
        <CardDescription>
          Distribution of users across subscription tiers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={segmentationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {segmentationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value.toLocaleString()} users`, 'Count']}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend and Stats */}
          <div className="space-y-4">
            <div className="space-y-3">
              {segmentationData.map((segment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: segment.color }}
                    />
                    <div>
                      <div className="font-medium text-sm">{segment.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {segment.value.toLocaleString()} users
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{segment.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2">Total Users</div>
              <div className="text-2xl font-bold">
                {segmentationData.reduce((sum, seg) => sum + seg.value, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {((segmentationData[1].value + segmentationData[2].value) / 
                  segmentationData.reduce((sum, seg) => sum + seg.value, 0) * 100).toFixed(1)}% are paying customers
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
