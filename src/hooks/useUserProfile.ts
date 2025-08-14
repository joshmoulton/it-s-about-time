import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { authenticatedQuery } from '@/utils/supabaseAuthWrapper';

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  user_email: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const { currentUser } = useEnhancedAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!currentUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to get profile by subscriber_id first, then fallback to email lookup
      const { data: subRow } = await authenticatedQuery(async () => 
        supabase
          .from('beehiiv_subscribers')
          .select('id')
          .eq('email', currentUser.email as string)
          .maybeSingle()
      );

      let query = supabase.from('user_profiles').select('*').limit(1);

      if (subRow?.id) {
        query = query.eq('subscriber_id', subRow.id);
      } else {
        // Fallback to email-based lookup
        const orFilter = `whop_email.eq.${currentUser.email},user_email.eq.${currentUser.email}`;
        query = query.or(orFilter);
      }

      const { data, error: profileError } = await authenticatedQuery(async () => 
        query.maybeSingle()
      );

      if (profileError) {
        throw profileError;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Reload profile when user changes
  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  // Get display name with fallback to email username
  const getDisplayName = () => {
    if (profile?.display_name) {
      return profile.display_name;
    }
    
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    
    return 'User';
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    const displayName = getDisplayName();
    return displayName.slice(0, 2).toUpperCase();
  };

  return {
    profile,
    loading,
    error,
    displayName: getDisplayName(),
    initials: getInitials(),
    avatarUrl: profile?.avatar_url || null,
    refetch: loadProfile
  };
}