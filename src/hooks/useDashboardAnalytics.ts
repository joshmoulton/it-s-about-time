
import { useState, useEffect, useCallback } from 'react';
import { postHogWrapper } from '@/utils/postHogWrapper';

interface WidgetEngagement {
  widgetId: string;
  viewTime: number;
  interactions: number;
  lastViewed: Date;
}

interface SessionMetrics {
  sessionStart: Date;
  totalTime: number;
  widgetsViewed: string[];
  actionsPerformed: number;
}

export function useDashboardAnalytics(userId: string) {
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    sessionStart: new Date(),
    totalTime: 0,
    widgetsViewed: [],
    actionsPerformed: 0
  });
  
  const [widgetEngagement, setWidgetEngagement] = useState<Map<string, WidgetEngagement>>(new Map());
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [widgetStartTime, setWidgetStartTime] = useState<Date | null>(null);

  // Track widget view start
  const trackWidgetView = useCallback((widgetId: string) => {
    if (activeWidget && widgetStartTime) {
      // Record time spent on previous widget
      const timeSpent = Date.now() - widgetStartTime.getTime();
      setWidgetEngagement(prev => {
        const current = prev.get(activeWidget) || {
          widgetId: activeWidget,
          viewTime: 0,
          interactions: 0,
          lastViewed: new Date()
        };
        
        const updated = new Map(prev);
        updated.set(activeWidget, {
          ...current,
          viewTime: current.viewTime + timeSpent,
          lastViewed: new Date()
        });
        return updated;
      });
    }

    setActiveWidget(widgetId);
    setWidgetStartTime(new Date());
    
    // Update session metrics
    setSessionMetrics(prev => ({
      ...prev,
      widgetsViewed: [...new Set([...prev.widgetsViewed, widgetId])]
    }));

    // Track with PostHog wrapper (rate limited)
    postHogWrapper.capture('dashboard_widget_view', {
      widgetId,
      userId
    });
  }, [activeWidget, widgetStartTime, userId]);

  // Track widget interactions
  const trackWidgetInteraction = useCallback((widgetId: string) => {
    setWidgetEngagement(prev => {
      const current = prev.get(widgetId) || {
        widgetId,
        viewTime: 0,
        interactions: 0,
        lastViewed: new Date()
      };
      
      const updated = new Map(prev);
      updated.set(widgetId, {
        ...current,
        interactions: current.interactions + 1,
        lastViewed: new Date()
      });
      return updated;
    });

    setSessionMetrics(prev => ({
      ...prev,
      actionsPerformed: prev.actionsPerformed + 1
    }));

    // Track with PostHog wrapper (rate limited)
    postHogWrapper.capture('dashboard_widget_interaction', {
      widgetId,
      userId
    });
  }, [userId]);

  // Update total session time - reduced frequency to prevent PostHog rate limiting
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionMetrics(prev => ({
        ...prev,
        totalTime: Date.now() - prev.sessionStart.getTime()
      }));
    }, 60000); // Every 60 seconds instead of 10 seconds to reduce PostHog events

    return () => clearInterval(interval);
  }, []);

  // Save analytics data periodically - reduced frequency to prevent PostHog rate limiting
  useEffect(() => {
    const saveAnalytics = () => {
      const analyticsData = {
        sessionMetrics,
        widgetEngagement: Array.from(widgetEngagement.entries()),
        timestamp: new Date().toISOString()
      };
      
      try {
        const existing = JSON.parse(localStorage.getItem(`analytics-${userId}`) || '[]');
        const updated = [...existing, analyticsData].slice(-50); // Keep last 50 sessions
        localStorage.setItem(`analytics-${userId}`, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save analytics:', error);
      }
    };

    const interval = setInterval(saveAnalytics, 120000); // Save every 2 minutes instead of 30 seconds
    return () => clearInterval(interval);
  }, [sessionMetrics, widgetEngagement, userId]);

  const getWidgetStats = (widgetId: string) => {
    return widgetEngagement.get(widgetId) || {
      widgetId,
      viewTime: 0,
      interactions: 0,
      lastViewed: new Date()
    };
  };

  const getMostEngagedWidgets = () => {
    return Array.from(widgetEngagement.values())
      .sort((a, b) => (b.viewTime + b.interactions * 1000) - (a.viewTime + a.interactions * 1000))
      .slice(0, 5);
  };

  return {
    sessionMetrics,
    trackWidgetView,
    trackWidgetInteraction,
    getWidgetStats,
    getMostEngagedWidgets,
    widgetEngagement: Array.from(widgetEngagement.values())
  };
}
