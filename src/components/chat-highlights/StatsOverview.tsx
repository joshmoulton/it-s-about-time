import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, MessageSquare, Users, Activity } from 'lucide-react';

interface StatsOverviewProps {
  totalHighlights: number;
  activeTopics: number;
  uniqueUsers: number;
  avgEngagement: number;
}

export const StatsOverview = memo<StatsOverviewProps>(({ 
  totalHighlights, 
  activeTopics, 
  uniqueUsers, 
  avgEngagement 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Total Highlights</span>
        </div>
        <p className="text-2xl font-bold">{totalHighlights}</p>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">Active Topics</span>
        </div>
        <p className="text-2xl font-bold">{activeTopics}</p>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">Unique Users</span>
        </div>
        <p className="text-2xl font-bold">{uniqueUsers}</p>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium">Avg Engagement</span>
        </div>
        <p className="text-2xl font-bold">{avgEngagement}</p>
      </CardContent>
    </Card>
  </div>
));

StatsOverview.displayName = 'StatsOverview';