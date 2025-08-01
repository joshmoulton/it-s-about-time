
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit2, Key, RefreshCw, Shield, Settings, Copy, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PasswordManagementPanel } from '@/components/admin/sections/user-management/components/PasswordManagementPanel';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface EditAdminFormProps {
  admin: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export function EditAdminForm({ admin, onCancel, onSuccess }: EditAdminFormProps) {
  const { toast } = useToast();
  
  // Initialize role based on user type
  const getInitialRole = () => {
    if (admin.user_type === 'beehiiv' || admin.user_type === 'whop') {
      // For beehiiv/whop users, derive role from subscription_tier
      if (admin.subscription_tier === 'premium') return 'admin';
      if (admin.subscription_tier === 'paid') return 'editor';
      return 'user';
    }
    return admin.role || 'user';
  };
  
  const [role, setRole] = useState(getInitialRole());
  const [isActive, setIsActive] = useState(admin.is_active ?? true);
  const [showAdvancedPasswordManagement, setShowAdvancedPasswordManagement] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // New password reset actions
  const passwordResetAction = useMutation({
    mutationFn: async ({ action, generatePassword = false }: { action: string; generatePassword?: boolean }) => {
      console.log('🔄 Calling admin-password-management with:', { 
        action, 
        userEmail: admin.email || admin.display_email, 
        userType: admin.user_type, 
        generatePassword 
      });
      
      const { data, error } = await supabase.functions.invoke('admin-password-management', {
        body: {
          action,
          userEmail: admin.email || admin.display_email,
          userType: admin.user_type,
          generatePassword
        }
      });
      
      console.log('📥 Response from admin-password-management:', { data, error });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Password action successful:', data);
      if (data.tempPassword) {
        setTempPassword(data.tempPassword);
        setShowPasswordDialog(true);
        setIsCopied(false);
        
        // Auto-copy to clipboard
        navigator.clipboard?.writeText(data.tempPassword).then(() => {
          console.log('Password copied to clipboard');
        }).catch(() => {
          console.log('Could not copy to clipboard');
        });
      } else {
        toast({
          title: "Success",
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to perform action",
        variant: "destructive",
      });
    }
  });

  const handlePasswordReset = (generatePassword: boolean = false) => {
    passwordResetAction.mutate({ action: generatePassword ? 'generate_password' : 'reset_password', generatePassword });
  };

  const handleRequirePasswordReset = () => {
    passwordResetAction.mutate({ action: 'require_password_reset' });
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setIsCopied(true);
      toast({
        title: "Password Copied",
        description: "Temporary password has been copied to your clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy password to clipboard",
        variant: "destructive",
      });
    }
  };

  const isPasswordResetAvailable = ['local_auth', 'supabase_auth', 'beehiiv', 'whop_admin', 'supabase_admin'].includes(admin.user_type || 'supabase_auth');

  const updateAdmin = useMutation({
    mutationFn: async ({ role, isActive }: { role: string; isActive: boolean }) => {
      // Handle different user types based on the user's user_type
      if (admin.user_type === 'whop') {
        // For whop users, update subscription_tier
        const tier = role === 'user' ? 'paid' : 'premium';
        const { error } = await supabase
          .from('whop_authenticated_users')
          .update({ subscription_tier: tier })
          .eq('user_email', admin.email || admin.display_email);
        if (error) throw error;
      } else {
        // For local_auth and supabase_auth users, check if admin_users record exists
        const adminUserId = admin.id.startsWith('admin-') ? admin.id : `admin-${admin.email || admin.display_email}`;
        
        // Try to update existing admin_users record
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({
            role,
            is_active: isActive
          })
          .eq('email', admin.email || admin.display_email);
          
        if (updateError) {
          // If update failed, try to insert new admin_users record
          const { error: insertError } = await supabase
            .from('admin_users')
            .insert({
              email: admin.email || admin.display_email,
              role,
              is_active: isActive,
              user_type: admin.user_type
            });
          if (insertError) throw insertError;
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin user updated successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update admin user",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdmin.mutate({ role, isActive });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Admin User</h1>
          <p className="text-slate-400 mt-1">Manage user role, status, and password settings</p>
        </div>
        <Button variant="outline" onClick={onCancel} className="text-slate-300 border-slate-600">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Edit2 className="h-5 w-5" />
            Edit User: {admin.email || admin.display_email}
          </CardTitle>
          <CardDescription className="text-slate-400">
            Modify role and activation status for this admin user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-white">Admin Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base text-white">Active Status</Label>
                <p className="text-sm text-slate-400">
                  Enable or disable admin access
                </p>
              </div>
              <Switch 
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            {/* Password Reset Section */}
            <Separator className="my-6 bg-slate-600" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-slate-300" />
                <Label className="text-base font-semibold text-white">Password Management</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handlePasswordReset(false)}
                  disabled={passwordResetAction.isPending}
                  className="justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Send Password Reset Link
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handlePasswordReset(true)}
                  disabled={passwordResetAction.isPending}
                  className="justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Generate Temporary Password
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleRequirePasswordReset}
                  disabled={passwordResetAction.isPending}
                  className="justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Require Password Reset at Next Login
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAdvancedPasswordManagement(true)}
                  className="justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Password Management
                </Button>
              </div>
              
              <p className="text-xs text-slate-400">
                Advanced password management includes direct password setting, account unlock, session management, and 2FA reset.
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={updateAdmin.isPending} className="bg-blue-600 hover:bg-blue-700">
                {updateAdmin.isPending ? 'Updating...' : 'Update User'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="border-slate-600 text-slate-300">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Advanced Password Management Modal */}
      {showAdvancedPasswordManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <PasswordManagementPanel 
                user={admin} 
                onClose={() => setShowAdvancedPasswordManagement(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Temporary Password Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5" />
              Temporary Password Generated
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              A temporary password has been generated for {admin.email || admin.display_email}. 
              The user must reset their password on next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <Label className="text-white mb-2 block">Temporary Password:</Label>
            <div className="bg-slate-700 border border-slate-600 rounded-md p-3 font-mono text-white break-all select-all">
              {tempPassword}
            </div>
          </div>
          
          <AlertDialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCopyPassword}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Password
                </>
              )}
            </Button>
            <AlertDialogAction 
              onClick={() => setShowPasswordDialog(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
