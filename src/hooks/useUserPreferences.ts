// Custom hook for user preferences management
// Provides a simple interface for components to use user preferences

import { useState, useEffect } from 'react';
import { UserPreferencesHelpers } from '@/utils/userPreferencesSync';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

export function useUserPreferences() {
  const { currentUser } = useEnhancedAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [tradingProfile, setTradingProfile] = useState(null);
  const [uiSettings, setUISettings] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState(null);

  // Load all preferences on mount or user change
  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        const [trading, ui, notifications] = await Promise.all([
          UserPreferencesHelpers.getTradingProfile(),
          UserPreferencesHelpers.getUISettings(),
          UserPreferencesHelpers.getNotificationSettings()
        ]);

        setTradingProfile(trading);
        setUISettings(ui);
        setNotificationSettings(notifications);
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [currentUser?.email]);

  // Helper methods for updating preferences
  const updateTradingProfile = async (updates: any) => {
    const newProfile = { ...tradingProfile, ...updates };
    setTradingProfile(newProfile);
    await UserPreferencesHelpers.setTradingProfile(newProfile);
  };

  const updateUISettings = async (updates: any) => {
    const newSettings = { ...uiSettings, ...updates };
    setUISettings(newSettings);
    await UserPreferencesHelpers.setUISettings(newSettings);
  };

  const updateNotificationSettings = async (updates: any) => {
    const newSettings = { ...notificationSettings, ...updates };
    setNotificationSettings(newSettings);
    await UserPreferencesHelpers.setNotificationSettings(newSettings);
  };

  return {
    // State
    isLoading,
    tradingProfile,
    uiSettings,
    notificationSettings,
    
    // Update methods
    updateTradingProfile,
    updateUISettings,
    updateNotificationSettings,
    
    // User info
    isAuthenticated: !!currentUser,
    userEmail: currentUser?.email,
    syncStatus: currentUser ? 'synced' : 'local'
  };
}

// Specific hooks for individual preference types
export function useTradingProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    UserPreferencesHelpers.getTradingProfile().then(data => {
      setProfile(data);
      setIsLoading(false);
    });
  }, []);

  const updateProfile = async (updates: any) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    await UserPreferencesHelpers.setTradingProfile(newProfile);
  };

  return { profile, updateProfile, isLoading };
}

export function useUISettings() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    UserPreferencesHelpers.getUISettings().then(data => {
      setSettings(data);
      setIsLoading(false);
    });
  }, []);

  const updateSettings = async (updates: any) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await UserPreferencesHelpers.setUISettings(newSettings);
  };

  return { settings, updateSettings, isLoading };
}