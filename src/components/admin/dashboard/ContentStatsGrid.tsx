
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, BookOpen, GraduationCap, FileText, TrendingUp, TrendingDown } from 'lucide-react';

interface ContentStatsGridProps {
  contentStats?: {
    newsletters: number;
    videos: number;
    courses: number;
    articles: number;
    newslettersChange: number;
    videosChange: number;
    coursesChange: number;
    articlesChange: number;
  };
}

export function ContentStatsGrid({ contentStats: stats }: ContentStatsGridProps) {

  const items = [
    {
      title: 'Total Users',
      value: stats?.newsletters || 0,
      change: stats?.newslettersChange || 0,
      icon: Mail,
      color: 'bg-cyan-500',
      description: 'Active subscribers',
      period: 'this month'
    },
    {
      title: 'Newsletters',
      value: stats?.newsletters || 0,
      change: stats?.newslettersChange || 0,
      icon: Mail,
      color: 'bg-blue-500',
      description: 'Published content',
      period: 'this week'
    },
    {
      title: 'Videos',
      value: stats?.videos || 0,
      change: stats?.videosChange || 0,
      icon: BookOpen,
      color: 'bg-purple-500',
      description: 'Tutorial videos',
      period: 'this month'
    },
    {
      title: 'Courses',
      value: stats?.courses || 0,
      change: stats?.coursesChange || 0,
      icon: GraduationCap,
      color: 'bg-green-500',
      description: 'Complete courses',
      period: 'this quarter'
    },
    {
      title: 'Articles',
      value: stats?.articles || 0,
      change: stats?.articlesChange || 0,
      icon: FileText,
      color: 'bg-orange-500',
      description: 'Published articles',
      period: 'this month'
    }
  ];

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div 
      className="grid gap-4 w-full justify-center"
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 250px))'
      }}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const isPositive = item.change > 0;
        const isNegative = item.change < 0;
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${item.color}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${item.color} bg-opacity-10`}>
                  <Icon className={`h-4 w-4 text-white`} />
                </div>
              </div>
              {item.change !== 0 && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    isPositive ? 'text-green-600 border-green-200' : 
                    isNegative ? 'text-red-600 border-red-200' : 
                    'text-gray-600 border-gray-200'
                  }`}
                >
                  {isPositive && <TrendingUp className="h-3 w-3 mr-1" />}
                  {isNegative && <TrendingDown className="h-3 w-3 mr-1" />}
                  {item.change > 0 ? '+' : ''}{item.change}%
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {item.title}
                </p>
                <p className="text-3xl font-bold">{item.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  {item.description} • {item.period}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
