import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { authenticatedQuery } from '@/utils/supabaseAuthWrapper';

// Global cache to prevent redundant database calls
const tourPreferencesCache = new Map<string, { disabled: boolean; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const ongoingLoads = new Map<string, Promise<boolean>>();

export const useTourPreferences = (userEmail: string | null) => {
  const [isTourDisabled, setIsTourDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const lastUserEmailRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Optimized function with caching and deduplication
  const loadTourPreferences = async (email: string): Promise<boolean> => {
    // Check cache first
    const cached = tourPreferencesCache.get(email);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.disabled;
    }

    // Check for ongoing load
    const existingLoad = ongoingLoads.get(email);
    if (existingLoad) {
      return await existingLoad;
    }

    // Create promise for this load
    const loadPromise = (async (): Promise<boolean> => {
      try {
        // First check localStorage for quick access
        const saved = localStorage.getItem(`tour-disabled-${email}`);
        console.log('📱 Checking localStorage for tour preference:', saved);
        if (saved !== null) {
          const isDisabled = saved === 'true';
          console.log('✅ Found localStorage preference:', isDisabled);
          // Cache the result
          tourPreferencesCache.set(email, {
            disabled: isDisabled,
            timestamp: Date.now()
          });
          return isDisabled;
        }

        // Query database with optimized query
        console.log('🔍 Checking database for tour preference...');
        const { data: profile, error } = await authenticatedQuery(async () =>
          supabase
            .from('user_profiles')
            .select('tour_disabled')
            .eq('user_email', email)
            .maybeSingle()
        );

        if (error && error.code !== 'PGRST116') {
          console.warn('Error loading tour preferences:', error);
          return false;
        }

        let isDisabled = false;
        if (profile) {
          isDisabled = profile.tour_disabled;
          console.log('📊 Database tour preference:', isDisabled);
        } else {
          // Create profile with default tour setting (don't wait for completion)
          supabase
            .rpc('upsert_user_profile_basic', {
              p_display_name: null,
              p_avatar_url: null,
              p_tour_disabled: false
            })
             .then(({ error: insertError }) => {
              if (insertError) {
                console.warn('Error creating user profile:', insertError);
              }
            });
        }

        // Cache the result
        tourPreferencesCache.set(email, {
          disabled: isDisabled,
          timestamp: Date.now()
        });

        return isDisabled;
      } catch (e) {
        console.warn('Failed to load tour preferences:', e);
        return false;
      } finally {
        ongoingLoads.delete(email);
      }
    })();

    ongoingLoads.set(email, loadPromise);
    return await loadPromise;
  };

  // Load preferences on mount and when userEmail changes
  useEffect(() => {
    const loadPreferences = async () => {
      if (!userEmail) {
        setIsTourDisabled(false);
        setIsLoading(false);
        hasLoadedRef.current = false;
        return;
      }

      // Skip if already loaded for this user
      if (hasLoadedRef.current && lastUserEmailRef.current === userEmail) {
        return;
      }

      setIsLoading(true);
      try {
        const isDisabled = await loadTourPreferences(userEmail);
        setIsTourDisabled(isDisabled);
        hasLoadedRef.current = true;
        lastUserEmailRef.current = userEmail;
      } finally {
        setIsLoading(false);
      }
    };

    // Reset loading state when user changes
    if (lastUserEmailRef.current !== userEmail) {
      hasLoadedRef.current = false;
      setIsLoading(true);
    }

    loadPreferences();
  }, [userEmail]);

  // Fast disable function with optimized caching
  const disableTour = async () => {
    if (!userEmail) return;

    console.log('🚫 Disabling tour for user:', userEmail);

    // Update state immediately for better UX
    setIsTourDisabled(true);
    
    // Update cache
    tourPreferencesCache.set(userEmail, {
      disabled: true,
      timestamp: Date.now()
    });

    // Save to localStorage for immediate persistence
    try {
      localStorage.setItem(`tour-disabled-${userEmail}`, 'true');
      console.log('✅ Tour disabled preference saved to localStorage');
    } catch (e) {
      console.warn('Failed to save tour preference to localStorage:', e);
    }

    // Update database asynchronously (don't await to prevent blocking)
    supabase
      .rpc('upsert_user_profile_basic', {
        p_display_name: null,
        p_avatar_url: null,
        p_tour_disabled: true
      })
      .then(({ error, data }) => {
        if (error) {
          console.error('❌ Error saving tour preference to database:', error);
          // Rollback on error
          setIsTourDisabled(false);
          tourPreferencesCache.delete(userEmail);
          localStorage.removeItem(`tour-disabled-${userEmail}`);
        } else {
          console.log('✅ Tour disabled preference saved to database:', data);
        }
      });
  };

  const enableTour = async () => {
    if (!userEmail) return;

    // Update state immediately for better UX
    setIsTourDisabled(false);
    
    // Update cache
    tourPreferencesCache.set(userEmail, {
      disabled: false,
      timestamp: Date.now()
    });

    // Save to localStorage for immediate persistence
    try {
      localStorage.removeItem(`tour-disabled-${userEmail}`);
    } catch (e) {
      console.warn('Failed to clear tour preference from localStorage:', e);
    }

    // Update database asynchronously
    supabase
      .rpc('upsert_user_profile_basic', {
        p_display_name: null,
        p_avatar_url: null,
        p_tour_disabled: false
      })
      .then(({ error }) => {
        if (error) {
          console.warn('Error saving tour preference:', error);
          // Rollback on error
          setIsTourDisabled(true);
          tourPreferencesCache.set(userEmail, {
            disabled: true,
            timestamp: Date.now()
          });
          localStorage.setItem(`tour-disabled-${userEmail}`, 'true');
        }
      });
  };

  const shouldShowTour = (): boolean => {
    if (isLoading) {
      return false; // Don't show tour while loading
    }
    return !isTourDisabled;
  };

  return {
    isTourDisabled,
    isLoading,
    shouldShowTour,
    disableTour,
    enableTour,
  };
};