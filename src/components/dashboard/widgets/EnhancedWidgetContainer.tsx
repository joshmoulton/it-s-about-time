
import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import { WidgetPreferences } from '@/hooks/useDashboardPersonalization';

interface EnhancedWidgetContainerProps {
  widgetId: string;
  title: string;
  children: React.ReactNode;
  preferences: WidgetPreferences;
  onPreferenceChange: (updates: Partial<WidgetPreferences>) => void;
  userId: string;
  className?: string;
  allowResize?: boolean;
  allowToggle?: boolean;
}

export function EnhancedWidgetContainer({
  widgetId,
  title,
  children,
  preferences,
  onPreferenceChange,
  userId,
  className = '',
  allowResize = true,
  allowToggle = true
}: EnhancedWidgetContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { trackWidgetView, trackWidgetInteraction } = useDashboardAnalytics(userId);
  const isVisible = preferences.visible;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackWidgetView(widgetId);
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [widgetId, trackWidgetView]);

  const handleInteraction = () => {
    trackWidgetInteraction(widgetId);
  };

  const toggleVisibility = () => {
    onPreferenceChange({ visible: !isVisible });
    handleInteraction();
  };

  const toggleSize = () => {
    const newSize = preferences.size === 'small' ? 'medium' : 
                   preferences.size === 'medium' ? 'large' : 'small';
    onPreferenceChange({ size: newSize });
    handleInteraction();
  };

  const getSizeClasses = () => {
    switch (preferences.size) {
      case 'small': return 'h-48';
      case 'large': return 'min-h-[500px]';
      default: return 'h-80';
    }
  };

  if (!isVisible) {
    return (
      <Card className={`${className} h-16 flex items-center justify-between p-4 opacity-60 border-dashed`}>
        <span className="text-sm text-muted-foreground">{title} (Hidden)</span>
        {allowToggle && (
          <Button variant="ghost" size="sm" onClick={toggleVisibility}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card 
      ref={containerRef}
      className={`${className} ${getSizeClasses()} relative group transition-all duration-200 bg-gradient-to-br from-blue-900/20 via-indigo-900/10 to-slate-800/50 border border-blue-500/20 hover:border-blue-400/30 hover:shadow-md`}
      onClick={handleInteraction}
    >
      {/* Widget Controls */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {allowToggle && (
              <DropdownMenuItem onClick={toggleVisibility}>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Widget
              </DropdownMenuItem>
            )}
            {allowResize && (
              <DropdownMenuItem onClick={toggleSize}>
                {preferences.size === 'large' ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
                {preferences.size === 'large' ? 'Make Smaller' : 'Make Larger'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {children}
    </Card>
  );
}
