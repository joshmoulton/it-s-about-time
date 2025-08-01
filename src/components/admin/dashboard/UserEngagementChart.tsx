
import React from 'react';
import { EnhancedCard, EnhancedCardContent, EnhancedCardDescription, EnhancedCardHeader, EnhancedCardTitle } from '@/components/ui/enhanced-card';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const mockEngagementData = [
  { day: 'Mon', newsletters: 850, videos: 420, courses: 180 },
  { day: 'Tue', newsletters: 920, videos: 380, courses: 220 },
  { day: 'Wed', newsletters: 1100, videos: 450, courses: 190 },
  { day: 'Thu', newsletters: 980, videos: 520, courses: 240 },
  { day: 'Fri', newsletters: 1200, videos: 380, courses: 200 },
  { day: 'Sat', newsletters: 650, videos: 280, courses: 120 },
  { day: 'Sun', newsletters: 580, videos: 250, courses: 100 },
];

export function UserEngagementChart() {
  return (
    <EnhancedCard variant="glass" className="h-full">
      <EnhancedCardHeader>
        <EnhancedCardTitle className="flex items-center gap-2 text-white">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
          Content Engagement
        </EnhancedCardTitle>
        <EnhancedCardDescription className="text-slate-300">
          Daily content consumption by type
        </EnhancedCardDescription>
      </EnhancedCardHeader>
      <EnhancedCardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockEngagementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12, fill: '#cbd5e1' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#cbd5e1' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                color: '#ffffff',
                backdropFilter: 'blur(10px)'
              }}
            />
            <Legend 
              wrapperStyle={{ color: '#cbd5e1' }}
            />
            <Bar dataKey="newsletters" fill="#06b6d4" name="Newsletters" radius={[4, 4, 0, 0]} />
            <Bar dataKey="videos" fill="#8b5cf6" name="Videos" radius={[4, 4, 0, 0]} />
            <Bar dataKey="courses" fill="#f59e0b" name="Courses" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </EnhancedCardContent>
    </EnhancedCard>
  );
}
