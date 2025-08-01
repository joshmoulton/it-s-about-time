
import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Calendar, Users, Crown, Edit, Eye, Key, Shield, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PasswordManagementPanel } from './PasswordManagementPanel';

interface User {
  id: string;
  email: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  status: string;
  created_at: string;
  user_type?: 'beehiiv' | 'local_auth' | 'supabase_auth' | 'whop';
  role?: string;
  whop_user_id?: string;
  whop_purchase_id?: string;
}

interface UserTableProps {
  users: User[];
  selectedUsers: string[];
  onToggleUser: (userId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onEditUser?: (user: User) => void;
  onViewUser?: (user: User) => void;
  isLoading: boolean;
}

export function UserTable({ 
  users, 
  selectedUsers, 
  onToggleUser, 
  onSelectAll, 
  onDeselectAll,
  onEditUser,
  onViewUser,
  isLoading 
}: UserTableProps) {
  const { toast } = useToast();
  const [showPasswordManagement, setShowPasswordManagement] = useState<User | null>(null);

  const handlePasswordReset = async (email: string, userType: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-password-management', {
        body: {
          action: 'reset_password',
          userEmail: email,
          userType: userType
        }
      });

      if (error) throw error;

      toast({
        title: "Password Reset Sent",
        description: `Password reset link sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset link",
        variant: "destructive",
      });
    }
  };
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'paid': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'free': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'inactive': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const allSelected = users.length > 0 && users.every(user => selectedUsers.includes(user.id));
  const someSelected = selectedUsers.length > 0 && !allSelected;

  if (isLoading) {
    return (
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-slate-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No users found</h3>
          <p className="text-slate-400">No users match your search criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelectAll();
                      } else {
                        onDeselectAll();
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="text-slate-300">User</TableHead>
                <TableHead className="text-slate-300">Tier</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Joined</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => onToggleUser(user.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <div>
                        <div className="font-medium text-white">{user.email}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          ID: {user.id.slice(0, 8)}...
                          {user.user_type === 'local_auth' && (
                            <Badge variant="outline" className="text-xs border-blue-500/20 text-blue-400">
                              <Shield className="h-3 w-3 mr-1" />
                              Local Auth
                            </Badge>
                          )}
                          {user.user_type === 'supabase_auth' && (
                            <Badge variant="outline" className="text-xs border-purple-500/20 text-purple-400">
                              <Shield className="h-3 w-3 mr-1" />
                              Supabase Auth
                            </Badge>
                          )}
                          {user.user_type === 'beehiiv' && (
                            <Badge variant="outline" className="text-xs border-green-500/20 text-green-400">
                              Newsletter
                            </Badge>
                          )}
                          {user.user_type === 'whop' && (
                            <Badge variant="outline" className="text-xs border-orange-500/20 text-orange-400">
                              Whop
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTierColor(user.subscription_tier || 'free')}>
                      {user.subscription_tier === 'premium' && <Crown className="h-3 w-3 mr-1" />}
                      <span className="capitalize">{user.subscription_tier || 'free'}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status || 'active')}>
                      {user.status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(user.user_type === 'local_auth' || user.user_type === 'supabase_auth') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-slate-300 border-slate-600 h-8 px-2"
                          onClick={() => handlePasswordReset(user.email, user.user_type || 'supabase_auth')}
                          title="Send password reset"
                        >
                          <Key className="h-3 w-3" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-slate-300 border-slate-600 h-8 px-2"
                        onClick={() => setShowPasswordManagement(user)}
                        title="Advanced password management"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="text-slate-300 border-slate-600 h-8 px-2"
                         onClick={() => onEditUser?.(user)}
                         title="Edit user"
                       >
                         <Edit className="h-3 w-3" />
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="text-slate-300 border-slate-600 h-8 px-2"
                         onClick={() => onViewUser?.(user)}
                         title="View user details"
                       >
                         <Eye className="h-3 w-3" />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Password Management Modal */}
      {showPasswordManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <PasswordManagementPanel 
                user={showPasswordManagement} 
                onClose={() => setShowPasswordManagement(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
