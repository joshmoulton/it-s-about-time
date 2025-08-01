import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TOUR_DISABLED_KEY = 'tour-disabled';

// Get a user-specific key for tour preferences (fallback for localStorage)
function getTourKey(userEmail?: string | null): string {
  if (userEmail) {
    return `${TOUR_DISABLED_KEY}-${userEmail}`;
  }
  return TOUR_DISABLED_KEY;
}

export function useTourPreferences(userEmail?: string | null) {
  const [isTourDisabled, setIsTourDisabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load tour preferences from database
  const loadTourPreferences = async (): Promise<boolean> => {
    if (!userEmail) {
      // Fallback to localStorage for non-authenticated users
      try {
        const key = getTourKey(userEmail);
        const stored = localStorage.getItem(key);
        const isDisabled = stored === 'true';
        console.log('🎯 Tour disabled check (localStorage) for anonymous:', isDisabled);
        return isDisabled;
      } catch (e) {
        console.warn('Failed to read tour preference from localStorage:', e);
        return false;
      }
    }

    try {
      console.log('🔄 Loading tour preferences from database for:', userEmail);
      
      // Try to get existing profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('tour_disabled')
        .eq('user_email', userEmail)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error loading tour preferences:', error);
        return false;
      }

      if (profile) {
        console.log('✅ Tour preferences loaded from database:', profile.tour_disabled);
        return profile.tour_disabled;
      } else {
        console.log('ℹ️ No profile found, creating default profile');
        // Create profile with default tour setting
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_email: userEmail,
            tour_disabled: false
          });

        if (insertError) {
          console.warn('Error creating user profile:', insertError);
        }
        return false;
      }
    } catch (e) {
      console.warn('Failed to load tour preferences from database:', e);
      return false;
    }
  };

  // Load preferences on mount and when userEmail changes
  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoading(true);
      const isDisabled = await loadTourPreferences();
      setIsTourDisabled(isDisabled);
      setIsLoading(false);
    };

    loadPreferences();
  }, [userEmail]);

  const disableTour = async () => {
    console.log('🚫 Disabling tour for user:', userEmail || 'anonymous');
    
    if (!userEmail) {
      // Fallback to localStorage for non-authenticated users
      try {
        const key = getTourKey(userEmail);
        localStorage.setItem(key, 'true');
        setIsTourDisabled(true);
        return;
      } catch (e) {
        console.warn('Failed to save tour preference to localStorage:', e);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_email: userEmail,
          tour_disabled: true
        }, {
          onConflict: 'user_email'
        });

      if (error) {
        console.error('Error saving tour preference:', error);
        return;
      }

      console.log('✅ Tour disabled and saved to database');
      setIsTourDisabled(true);
    } catch (e) {
      console.warn('Failed to save tour preference to database:', e);
    }
  };

  const enableTour = async () => {
    console.log('✅ Enabling tour for user:', userEmail || 'anonymous');
    
    if (!userEmail) {
      // Fallback to localStorage for non-authenticated users
      try {
        const key = getTourKey(userEmail);
        localStorage.removeItem(key);
        setIsTourDisabled(false);
        return;
      } catch (e) {
        console.warn('Failed to clear tour preference from localStorage:', e);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_email: userEmail,
          tour_disabled: false
        }, {
          onConflict: 'user_email'
        });

      if (error) {
        console.error('Error saving tour preference:', error);
        return;
      }

      console.log('✅ Tour enabled and saved to database');
      setIsTourDisabled(false);
    } catch (e) {
      console.warn('Failed to save tour preference to database:', e);
    }
  };

  const shouldShowTour = (): boolean => {
    if (isLoading) {
      console.log('🎯 Tour preferences still loading...');
      return false; // Don't show tour while loading
    }
    
    const shouldShow = !isTourDisabled;
    console.log('🎯 Should show tour for', userEmail || 'anonymous', ':', shouldShow);
    return shouldShow;
  };

  return {
    isTourDisabled,
    isLoading,
    shouldShowTour,
    disableTour,
    enableTour,
  };
}