
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'gradient' | 'glass' | 'colored';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan';
  trend?: {
    value: number;
    label: string;
  };
  subtitle?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  variant = 'gradient', 
  color = 'blue',
  trend,
  subtitle
}: StatsCardProps) {
  const getGradientColors = () => {
    switch (color) {
      case 'cyan': return 'from-cyan-400 to-cyan-500';
      case 'blue': return 'from-blue-500 to-blue-600';
      case 'purple': return 'from-purple-500 to-purple-600';
      case 'green': return 'from-green-500 to-green-600';
      case 'orange': return 'from-orange-500 to-orange-600';
      case 'pink': return 'from-pink-500 to-pink-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getGradientColors()} p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
      
      {/* Trend indicator - positioned at top right */}
      {trend && (
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/30">
          +{trend.value}%
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium opacity-90">{title}</span>
        </div>
        
        {/* Main value */}
        <div className="space-y-2">
          <div className="text-3xl font-bold tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          {/* Subtitle and trend label */}
          <div className="flex items-center justify-between">
            {subtitle && (
              <p className="text-sm opacity-80">{subtitle}</p>
            )}
            {trend && (
              <p className="text-xs opacity-70 font-medium">{trend.label}</p>
            )}
          </div>
        </div>
      </div>

      {/* Subtle glow effect */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
    </div>
  );
}
