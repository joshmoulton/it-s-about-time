
import { useState, useEffect } from 'react';

export interface WidgetPreferences {
  id: string;
  visible: boolean;
  order: number;
  size?: 'small' | 'medium' | 'large';
}

export interface DashboardPreferences {
  layout: 'default' | 'compact' | 'expanded';
  theme: 'light' | 'dark' | 'auto';
  widgets: WidgetPreferences[];
  mobileOptimized: boolean;
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  layout: 'default',
  theme: 'auto',
  mobileOptimized: true,
  widgets: [
    { id: 'chat-highlights', visible: true, order: 1, size: 'medium' },
    { id: 'sentiment-tracker', visible: true, order: 2, size: 'medium' },
    { id: 'live-chat', visible: true, order: 3, size: 'large' },
    { id: 'newsletter', visible: true, order: 4, size: 'small' },
    { id: 'edge', visible: true, order: 5, size: 'small' },
    { id: 'alerts', visible: true, order: 6, size: 'small' },
    { id: 'trades', visible: true, order: 7, size: 'medium' }
  ]
};

export function useDashboardPersonalization(userId: string) {
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = () => {
      try {
        const stored = localStorage.getItem(`dashboard-prefs-${userId}`);
        if (stored) {
          const parsedPrefs = JSON.parse(stored);
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsedPrefs });
        }
      } catch (error) {
        console.error('Failed to load dashboard preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  const updatePreferences = (updates: Partial<DashboardPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    
    try {
      localStorage.setItem(`dashboard-prefs-${userId}`, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Failed to save dashboard preferences:', error);
    }
  };

  const updateWidgetPreference = (widgetId: string, updates: Partial<WidgetPreferences>) => {
    const updatedWidgets = preferences.widgets.map(widget =>
      widget.id === widgetId ? { ...widget, ...updates } : widget
    );
    updatePreferences({ widgets: updatedWidgets });
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem(`dashboard-prefs-${userId}`);
  };

  return {
    preferences,
    isLoading,
    updatePreferences,
    updateWidgetPreference,
    resetToDefaults
  };
}
