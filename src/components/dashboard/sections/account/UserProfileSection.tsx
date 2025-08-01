import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Camera, Save, Loader2 } from 'lucide-react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function UserProfileSection() {
  const { currentUser } = useEnhancedAuth();
  const { isAdmin } = useAdminStatus();
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
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`user_id.eq.${currentUser.id},whop_email.eq.${currentUser.email}`)
        .single();

      if (error && error.code !== 'PGRST116') {
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
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('assets')
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
        description: "Failed to upload avatar. Please try again.",
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
      const profileData = {
        display_name: formData.displayName,
        avatar_url: formData.avatarUrl,
        updated_at: new Date().toISOString()
      };

      // Determine if we're linking by user_id or whop_email
      const isWhopUser = currentUser.user_type === 'whop_user';
      const profileKey = isWhopUser ? 'whop_email' : 'user_id';
      const profileValue = isWhopUser ? currentUser.email : currentUser.id;

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          ...profileData,
          [profileKey]: profileValue
        }, {
          onConflict: profileKey
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
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
            <p className="text-sm text-muted-foreground">
              JPG, PNG or GIF (max. 5MB)
            </p>
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