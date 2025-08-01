
import React from 'react';
import { Users, FileText, Video, BookOpen, Mail } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { useOptimizedAdminStats } from '@/hooks/useOptimizedAdminStats';

export function EnhancedStatsGrid() {
  const { data: stats } = useOptimizedAdminStats();

  const cards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'cyan' as const,
      trend: { value: 12, label: 'this month' },
      subtitle: 'Active subscribers'
    },
    {
      title: 'Newsletters',
      value: stats?.publishedContent?.newsletters || 0,
      icon: Mail,
      color: 'blue' as const,
      trend: { value: 8, label: 'this week' },
      subtitle: 'Published content'
    },
    {
      title: 'Videos',
      value: stats?.publishedContent?.videos || 0,
      icon: Video,
      color: 'purple' as const,
      trend: { value: 15, label: 'this month' },
      subtitle: 'Tutorial videos'
    },
    {
      title: 'Courses',
      value: stats?.publishedContent?.courses || 0,
      icon: BookOpen,
      color: 'green' as const,
      trend: { value: 5, label: 'this quarter' },
      subtitle: 'Complete courses'
    },
    {
      title: 'Articles',
      value: stats?.publishedContent?.articles || 0,
      icon: FileText,
      color: 'orange' as const,
      trend: { value: 23, label: 'this month' },
      subtitle: 'Published articles'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full">
      {cards.map((card, index) => (
        <StatsCard key={index} {...card} />
      ))}
    </div>
  );
}
