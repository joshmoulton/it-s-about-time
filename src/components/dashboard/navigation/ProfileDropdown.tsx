
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, HelpCircle, LogOut, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { authenticatedQuery } from '@/utils/supabaseAuthWrapper';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

interface Subscriber {
  email: string;
  subscription_tier: 'free' | 'paid' | 'premium';
}

interface ProfileDropdownProps {
  subscriber: Subscriber;
  onStartTour?: () => void;
  onLogout: () => void;
}

export function ProfileDropdown({ subscriber, onStartTour, onLogout }: ProfileDropdownProps) {
  const navigate = useNavigate();
  const { currentUser } = useEnhancedAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  // Load user's profile avatar
  useEffect(() => {
    const loadUserAvatar = async () => {
      if (!currentUser) return;

      try {
        // Prefer subscriber_id linkage for stable profile lookup
        const isValidUUID = (id: string) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

        // Try to resolve beehiiv subscriber_id by email (RLS allows self-read)
        const { data: subRow } = await supabase
          .from('beehiiv_subscribers')
          .select('id')
          .eq('email', currentUser.email as string)
          .maybeSingle();
        const subscriberId = subRow?.id as string | undefined;

        let query = supabase.from('user_profiles').select('avatar_url').limit(1);
        if (subscriberId && isValidUUID(subscriberId)) {
          query = query.eq('subscriber_id', subscriberId);
        } else {
          // Fallback to prior OR lookup when subscriber_id not available
          const useUserId = typeof currentUser.id === 'string' && isValidUUID(currentUser.id);
          const orFilter = useUserId
            ? `user_id.eq.${currentUser.id},whop_email.eq.${currentUser.email},user_email.eq.${currentUser.email}`
            : `whop_email.eq.${currentUser.email},user_email.eq.${currentUser.email}`;
          query = query.or(orFilter);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error('Error loading avatar:', error);
          return;
        }

        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
      }
    };

    loadUserAvatar();
  }, [currentUser]);

  const handleAccountSettings = () => {
    // Navigate to dashboard with account section using React Router
    navigate('/dashboard?section=account');
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleLogout = async () => {
    try {
      await onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleTakeTour = () => {
    // Only allow tour for paid/premium subscribers
    const subscriberTier = subscriber?.subscription_tier;
    const hasPaidAccess = subscriberTier === 'paid' || subscriberTier === 'premium';
    
    if (hasPaidAccess && onStartTour) {
      onStartTour();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full text-foreground">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt="Profile" />
            <AvatarFallback className="text-xs bg-muted text-foreground">
              {getInitials(subscriber?.email || 'U')}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-background border shadow-md z-50" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">
              {subscriber?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleAccountSettings} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        {/* Tour disabled via feature flag */}
        {subscriber?.subscription_tier === 'free' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleUpgrade} 
              className="cursor-pointer text-primary"
            >
              <Crown className="mr-2 h-4 w-4" />
              <span>Upgrade</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
