
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, Loader2 } from 'lucide-react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
// Removed unused isAdmin import
// import { useAdminStatus } from '@/hooks/useAdminStatus';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { authenticatedQuery } from '@/utils/supabaseAuthWrapper';


export function UserProfileSection() {
  const { currentUser } = useEnhancedAuth();
  // Removed unused isAdmin usage
  // const { isAdmin } = useAdminStatus();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    displayName: currentUser?.email?.split('@')[0] || '',
    email: currentUser?.email || '',
    avatarUrl: ''
  });

  // Load existing profile data
  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    if (!currentUser) return;

    try {
      // Check if we have a Supabase auth session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User has real Supabase auth - use direct auth.uid() for RLS
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading profile with auth.uid():', error);
          return;
        }

        if (data) {
          setFormData(prev => ({
            ...prev,
            displayName: data.display_name || currentUser.email?.split('@')[0] || '',
            avatarUrl: data.avatar_url || ''
          }));
        }
      } else {
        // Fallback for legacy users without Supabase auth
        let query = supabase.from('user_profiles').select('*').limit(1);

        // Try to resolve subscriber_id from Beehiiv by email
        const { data: subRow } = await authenticatedQuery(async () => 
          supabase
            .from('beehiiv_subscribers')
            .select('id')
            .eq('email', currentUser.email as string)
            .maybeSingle()
        );
        const subscriberId = subRow?.id as string | undefined;

        const isValidUUID = (id: string) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

        if (subscriberId && isValidUUID(subscriberId)) {
          query = query.eq('subscriber_id', subscriberId);
        } else {
          // Fallback to OR-based lookup when subscriber_id not available
          const useUserId = typeof currentUser.id === 'string' && isValidUUID(currentUser.id);
          const orFilter = useUserId
            ? `user_id.eq.${currentUser.id},whop_email.eq.${currentUser.email},user_email.eq.${currentUser.email}`
            : `whop_email.eq.${currentUser.email},user_email.eq.${currentUser.email}`;
          query = query.or(orFilter);
        }

        const { data, error } = await authenticatedQuery(async () => query.maybeSingle());

        if (error) {
          console.error('Error loading profile:', error);
          return;
        }

        if (data) {
          setFormData(prev => ({
            ...prev,
            displayName: data.display_name || currentUser.email?.split('@')[0] || '',
            avatarUrl: data.avatar_url || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, or GIF).",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Get the authenticated user's ID from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Generate unique filename using auth.uid() for proper storage structure
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update form data
      setFormData(prev => ({
        ...prev,
        avatarUrl: urlData.publicUrl
      }));

      toast({
        title: "Avatar Uploaded",
        description: "Your avatar has been uploaded successfully. Click 'Save Changes' to update your profile."
      });

      // Auto-enable editing mode so user can save
      setIsEditing(true);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      const profileData: any = {
        display_name: formData.displayName,
        avatar_url: formData.avatarUrl,
        user_email: currentUser.email, // keep email for lookups
        updated_at: new Date().toISOString()
      };

      // Helper: validate UUID format
      const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

      // Resolve subscriber_id via Beehiiv subscribers (preferred key)
      const { data: subRow } = await supabase
        .from('beehiiv_subscribers')
        .select('id')
        .eq('email', currentUser.email as string)
        .maybeSingle();
      const subscriberId = subRow?.id as string | undefined;

      if (subscriberId && isValidUUID(subscriberId)) {
        profileData.subscriber_id = subscriberId;
      }

      // Preserve legacy identifiers for backward compatibility
      if (currentUser.user_type === 'whop_user') {
        profileData.whop_email = currentUser.email;
      } else if (currentUser.id && isValidUUID(currentUser.id)) {
        profileData.user_id = currentUser.id;
      }

      console.log('Saving profile data:', profileData);

      const { data, error } = await authenticatedQuery(async () =>
        supabase.rpc('upsert_user_profile_basic', {
          p_display_name: formData.displayName || null,
          p_avatar_url: formData.avatarUrl || null,
          p_tour_disabled: null as any
        })
      );

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Profile saved successfully:', data);

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
      setIsEditing(false);
      
      // Reload the profile to reflect changes
      await loadUserProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message || 'Please try again.'}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <Card className="border shadow-lg">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Sign in to manage your profile</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border border-brand-navy/20 bg-brand-navy/5 shadow-lg">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Manage your display name and profile picture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />

        {/* Avatar Section */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={formData.avatarUrl} />
            <AvatarFallback className="text-lg">
              {getInitials(currentUser.email)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Change Avatar
                </>
              )}
            </Button>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>JPG, PNG or GIF (max. 5MB)</p>
              <p>Ideal size: 400x400px or larger</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              disabled={!isEditing}
              placeholder="Enter your display name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={formData.email}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* Removed Account Type section as requested */}
          {/* 
          <div className="grid gap-2">
            <Label>Account Type</Label>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm capitalize">
                {isAdmin 
                  ? 'Premium Admin Account' 
                  : currentUser.user_type === 'whop_user' 
                    ? 'Premium (Whop)' 
                    : 'Free Account'
                }
              </span>
            </div>
            {isAdmin && (
              <p className="text-sm text-muted-foreground">
                You have admin privileges with full premium access.
              </p>
            )}
            {currentUser.user_type === 'whop_user' && !isAdmin && (
              <p className="text-sm text-muted-foreground">
                Your account is managed through Whop. Use Whop to login and manage billing.
              </p>
            )}
          </div>
          */}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          {isEditing ? (
            <>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
