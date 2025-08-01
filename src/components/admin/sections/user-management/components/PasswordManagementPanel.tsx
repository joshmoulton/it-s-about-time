import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, 
  Shield, 
  RefreshCw, 
  Unlock, 
  Eye, 
  EyeOff, 
  Settings, 
  AlertTriangle,
  Clock,
  LogOut,
  Smartphone
} from 'lucide-react';

interface PasswordManagementPanelProps {
  user: any;
  onClose: () => void;
}

export function PasswordManagementPanel({ user, onClose }: PasswordManagementPanelProps) {
  const { toast } = useToast();
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forcePasswordReset, setForcePasswordReset] = useState(false);

  // Fetch user sessions
  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ['user-sessions', user.email],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-user-sessions', {
        body: { userEmail: user.email }
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user.email
  });

  // Fetch account security status
  const { data: securityStatus } = useQuery({
    queryKey: ['user-security', user.email],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-user-security-status', {
        body: { userEmail: user.email }
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user.email
  });

  // Password management mutations
  const passwordAction = useMutation({
    mutationFn: async (action: any) => {
      const { data, error } = await supabase.functions.invoke('admin-password-management', {
        body: {
          action: action.type,
          userEmail: user.email,
          userType: user.user_type,
          ...action.payload
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (data.tempPassword) {
        toast({
          title: "Password Set Successfully",
          description: `New password: ${data.tempPassword}`,
          duration: 15000,
        });
        navigator.clipboard?.writeText(data.tempPassword);
      } else {
        toast({
          title: "Success",
          description: data.message || "Action completed successfully",
        });
      }
      
      if (variables.type === 'revoke_sessions') {
        refetchSessions();
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

  const handleSetCustomPassword = () => {
    if (!customPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a password",
        variant: "destructive",
      });
      return;
    }

    passwordAction.mutate({
      type: 'set_password',
      payload: {
        password: customPassword,
        requireReset: forcePasswordReset
      }
    });
  };

  const handleGeneratePassword = () => {
    passwordAction.mutate({
      type: 'generate_password',
      payload: { requireReset: forcePasswordReset }
    });
  };

  const handleUnlockAccount = () => {
    passwordAction.mutate({
      type: 'unlock_account',
      payload: {}
    });
  };

  const handleRevokeAllSessions = () => {
    passwordAction.mutate({
      type: 'revoke_sessions',
      payload: {}
    });
  };

  const handleReset2FA = () => {
    passwordAction.mutate({
      type: 'reset_2fa',
      payload: {}
    });
  };

  const isPasswordActionAvailable = ['local_auth', 'supabase_auth', 'beehiiv', 'whop'].includes(user.user_type);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Password Management - {user.email}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Status */}
          {securityStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">Account Status</span>
                </div>
                <Badge className={securityStatus.isLocked ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}>
                  {securityStatus.isLocked ? 'Locked' : 'Active'}
                </Badge>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">Failed Attempts</span>
                </div>
                <span className="text-lg font-semibold">{securityStatus.failedAttempts || 0}</span>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium">2FA Status</span>
                </div>
                <Badge className={securityStatus.has2FA ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}>
                  {securityStatus.has2FA ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          )}

          {isPasswordActionAvailable && (
            <>
              <Separator />
              
              {/* Direct Password Setting */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Set Password
                </h3>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button onClick={handleSetCustomPassword} disabled={passwordAction.isPending}>
                      Set Password
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="force-reset"
                      checked={forcePasswordReset}
                      onCheckedChange={setForcePasswordReset}
                    />
                    <Label htmlFor="force-reset">Force password reset on next login</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleGeneratePassword}
                    disabled={passwordAction.isPending}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Generate Random Password
                  </Button>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Account Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Account Management
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {securityStatus?.isLocked && (
                <Button
                  variant="outline"
                  onClick={handleUnlockAccount}
                  disabled={passwordAction.isPending}
                  className="flex items-center gap-2"
                >
                  <Unlock className="h-4 w-4" />
                  Unlock Account
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleRevokeAllSessions}
                disabled={passwordAction.isPending}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Revoke All Sessions
              </Button>

              {securityStatus?.has2FA && (
                <Button
                  variant="outline"
                  onClick={handleReset2FA}
                  disabled={passwordAction.isPending}
                  className="flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  Reset 2FA
                </Button>
              )}
            </div>
          </div>

          {/* Active Sessions */}
          {sessions && sessions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Active Sessions</h3>
                <div className="space-y-2">
                  {sessions.map((session: any, index: number) => (
                    <div key={index} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{session.ip_address || 'Unknown IP'}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.user_agent || 'Unknown device'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last active: {new Date(session.last_activity).toLocaleString()}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => passwordAction.mutate({
                            type: 'revoke_single_session',
                            payload: { sessionId: session.id }
                          })}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}