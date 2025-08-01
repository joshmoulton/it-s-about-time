
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ResponsiveContainer, 
  FunnelChart, 
  Funnel, 
  LabelList,
  Tooltip
} from 'recharts';
import { TrendingDown } from 'lucide-react';

const funnelData = [
  { name: 'Visitors', value: 10000, fill: '#3b82f6' },
  { name: 'Newsletter Signups', value: 2500, fill: '#8b5cf6' },
  { name: 'Email Opens', value: 1800, fill: '#10b981' },
  { name: 'Content Views', value: 1200, fill: '#f59e0b' },
  { name: 'Paid Conversions', value: 324, fill: '#ef4444' },
];

export function ConversionFunnelChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-blue-600" />
          Conversion Funnel
        </CardTitle>
        <CardDescription>
          User journey from visitor to paid subscriber
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <FunnelChart>
            <Tooltip 
              formatter={(value, name) => [
                `${value.toLocaleString()} users`,
                name
              ]}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Funnel
              dataKey="value"
              data={funnelData}
              isAnimationActive
            >
              <LabelList position="center" fill="#fff" stroke="none" />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
        
        {/* Conversion Rates */}
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium">Conversion Rates</div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex justify-between">
              <span>Visitor → Signup:</span>
              <span className="font-medium">25%</span>
            </div>
            <div className="flex justify-between">
              <span>Signup → Engagement:</span>
              <span className="font-medium">72%</span>
            </div>
            <div className="flex justify-between">
              <span>Engagement → Content:</span>
              <span className="font-medium">67%</span>
            </div>
            <div className="flex justify-between">
              <span>Content → Paid:</span>
              <span className="font-medium">27%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
