// User Preferences Sync Utility
// Manages hybrid local storage + database sync for authenticated users

import { supabase } from '@/integrations/supabase/client';
import { SimplifiedAuth } from './simplifiedAuthUtils';

export interface UserPreference {
  preference_type: string;
  preference_data: Record<string, any>;
}

class UserPreferencesSync {
  private currentUserEmail: string | null = null;
  private syncQueue: Map<string, any> = new Map();
  private isOnline = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  setCurrentUser(email: string | null) {
    if (this.currentUserEmail !== email) {
      this.currentUserEmail = email;
      if (email) {
        this.syncFromDatabase();
      }
    }
  }

  // Get preference with fallback chain: memory -> localStorage -> database
  async getPreference<T = any>(type: string, defaultValue: T): Promise<T> {
    try {
      // First try localStorage (fastest)
      const localKey = `user_pref_${type}`;
      const localData = localStorage.getItem(localKey);
      if (localData) {
        return JSON.parse(localData);
      }

      // If authenticated, try database
      if (this.currentUserEmail && this.isOnline) {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('preference_data')
          .eq('user_email', this.currentUserEmail)
          .eq('preference_type', type)
          .single();

        if (!error && data) {
          // Cache in localStorage for next time
          localStorage.setItem(localKey, JSON.stringify(data.preference_data));
          return data.preference_data as T;
        }
      }

      return defaultValue;
    } catch (error) {
      console.warn('Failed to get preference:', error);
      return defaultValue;
    }
  }

  // Set preference with immediate local storage + async database sync
  async setPreference(type: string, data: any): Promise<void> {
    try {
      // Always save to localStorage immediately (for responsiveness)
      const localKey = `user_pref_${type}`;
      localStorage.setItem(localKey, JSON.stringify(data));

      // If authenticated and online, sync to database
      if (this.currentUserEmail && this.isOnline) {
        await this.syncToDatabase(type, data);
      } else if (this.currentUserEmail) {
        // Queue for later sync when online
        this.syncQueue.set(type, data);
      }

      // Log the preference change for analytics
      if (this.currentUserEmail) {
        await SimplifiedAuth.logAuthEvent(
          this.currentUserEmail, 
          'preference_update', 
          true
        );
      }
    } catch (error) {
      console.error('Failed to set preference:', error);
      throw error;
    }
  }

  // Sync specific preference to database
  private async syncToDatabase(type: string, data: any): Promise<void> {
    if (!this.currentUserEmail) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_email: this.currentUserEmail,
          preference_type: type,
          preference_data: data
        }, {
          onConflict: 'user_email,preference_type'
        });

      if (error) {
        console.error('Database sync failed:', error);
        // Add back to queue for retry
        this.syncQueue.set(type, data);
      } else {
        // Remove from queue if successful
        this.syncQueue.delete(type);
      }
    } catch (error) {
      console.error('Database sync error:', error);
      this.syncQueue.set(type, data);
    }
  }

  // Restore preferences from database to localStorage
  private async syncFromDatabase(): Promise<void> {
    if (!this.currentUserEmail || !this.isOnline) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preference_type, preference_data')
        .eq('user_email', this.currentUserEmail);

      if (!error && data) {
        data.forEach(pref => {
          const localKey = `user_pref_${pref.preference_type}`;
          const existingLocal = localStorage.getItem(localKey);
          
          // Only overwrite if we don't have local data
          if (!existingLocal) {
            localStorage.setItem(localKey, JSON.stringify(pref.preference_data));
          }
        });
      }
    } catch (error) {
      console.error('Failed to sync from database:', error);
    }
  }

  // Process queued sync operations when back online
  private async processSyncQueue(): Promise<void> {
    if (!this.currentUserEmail || this.syncQueue.size === 0) return;

    const promises = Array.from(this.syncQueue.entries()).map(([type, data]) =>
      this.syncToDatabase(type, data)
    );

    await Promise.allSettled(promises);
  }

  // Clear all user preferences (logout)
  clearUserPreferences(): void {
    // Clear localStorage items that start with user_pref_
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('user_pref_')) {
        localStorage.removeItem(key);
      }
    });
    
    this.syncQueue.clear();
    this.currentUserEmail = null;
  }

  // Get all user preferences for export/backup
  async getAllPreferences(): Promise<Record<string, any>> {
    const preferences: Record<string, any> = {};
    
    // Get from localStorage first
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('user_pref_')) {
        const type = key.replace('user_pref_', '');
        try {
          preferences[type] = JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
          // Skip invalid JSON
        }
      }
    });

    return preferences;
  }
}

// Export singleton instance
export const userPreferences = new UserPreferencesSync();

// Specific preference helpers
export const UserPreferencesHelpers = {
  // Trading Profile
  async getTradingProfile() {
    return userPreferences.getPreference('trading_profile', {
      riskTolerance: 'medium' as const,
      tradingExperience: 'intermediate' as const,
      preferredMarkets: ['crypto'],
      maxPositionSize: 10,
      riskManagementStyle: 'conservative' as const,
      tradingStyle: 'swing' as const,
      notifications: {
        signals: true,
        marketAlerts: true,
        portfolioUpdates: false
      }
    });
  },

  async setTradingProfile(profile: any) {
    return userPreferences.setPreference('trading_profile', profile);
  },

  // UI Settings
  async getUISettings() {
    return userPreferences.getPreference('ui_settings', {
      theme: 'system',
      density: 'comfortable',
      sidebarCollapsed: false,
      chartPreferences: {
        defaultTimeframe: '1D',
        indicators: ['RSI', 'MACD'],
        theme: 'dark'
      }
    });
  },

  async setUISettings(settings: any) {
    return userPreferences.setPreference('ui_settings', settings);
  },

  // Notification Preferences
  async getNotificationSettings() {
    return userPreferences.getPreference('notifications', {
      email: true,
      push: false,
      telegram: false,
      frequency: 'important',
      types: {
        signals: true,
        newsletters: true,
        account: true,
        marketing: false
      }
    });
  },

  async setNotificationSettings(settings: any) {
    return userPreferences.setPreference('notifications', settings);
  }
};